import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  User,
  MapPin,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../../store";
import {
  startOrderCreation,
  orderCreatedSuccess,
  orderCreationError,
  startVerification,
  verificationSuccess,
  paymentFailed,
  paymentDismissed,
  resumeAwaitingPayment,
} from "../../../../store/slices/paymentSlice";
import { clearCart } from "../../../../store/slices/cartSlice";
import {
  useCreateOrderMutation,
  useVerifyPaymentMutation,
} from "../../../../store/api/meridianApi";
import {
  loadRazorpayCheckoutScript,
  RazorpayInstance,
} from "../../../../services/razorpayLoader";
import { formatPaiseToINR } from "../../../../utils/currency";
import { QuoteResult, OrderCreateResponse } from "../../../../types";
import { Button } from "../../../common/Button";
import { useToast } from "../../../../context/ToastContext";
import styles from "./PaymentStep.module.scss";

export interface PaymentStepProps {
  quote: QuoteResult | null;
  onEditDetails: () => void;
  onEditBag: () => void;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({
  quote,
  onEditDetails,
  onEditBag,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const customer = useAppSelector(state => state.checkout.customer);
  const shippingAddress = useAppSelector(state => state.checkout.shippingAddress);
  const cartItems = useAppSelector(state => state.cart.items);
  const couponCode = useAppSelector(state => state.cart.couponCode);
  const paymentState = useAppSelector(state => state.payment);

  const [createOrderMutation] = useCreateOrderMutation();
  const [verifyPaymentMutation] = useVerifyPaymentMutation();

  const [isScriptLoading, setIsScriptLoading] = useState(false);
  const [scriptLoadError, setScriptLoadError] = useState<string | null>(null);

  // Store instance ref for re-opening
  const rzpInstanceRef = useRef<RazorpayInstance | null>(null);

  const totalPaise = quote?.totalPaise ?? 0;
  const isProcessing =
    paymentState.status === "creatingOrder" ||
    paymentState.status === "awaitingPayment" ||
    paymentState.status === "verifying" ||
    isScriptLoading;

  const openRazorpayModal = (orderData: OrderCreateResponse) => {
    if (!window.Razorpay) {
      showToast("Razorpay SDK not loaded. Please retry.", "danger");
      return;
    }

    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: "INR",
      order_id: orderData.razorpayOrderId,
      name: "Meridian",
      description: "Workspace Accessories Order",
      prefill: {
        name: customer.name,
        email: customer.email,
        contact: customer.phone,
      },
      theme: {
        color: "#3444EB",
      },
      modal: {
        ondismiss: () => {
          dispatch(paymentDismissed());
        },
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        dispatch(startVerification());

        try {
          const result = await verifyPaymentMutation({
            internalOrderId: orderData.internalOrderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }).unwrap();

          if (result.verified) {
            dispatch(verificationSuccess({ paymentId: response.razorpay_payment_id }));
            dispatch(clearCart());
            navigate(`/order/${orderData.internalOrderId}`);
          }
        } catch (err: unknown) {
          const apiErr = err as { data?: { error?: { message?: string } } };
          const msg =
            apiErr?.data?.error?.message ||
            "Cryptographic signature verification failed. Please contact support.";
          dispatch(paymentFailed({ description: msg }));
          showToast(msg, "danger");
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", failureResponse => {
      dispatch(paymentFailed(failureResponse.error));
    });

    rzpInstanceRef.current = rzp;
    rzp.open();
  };

  const handleInitiatePayment = async () => {
    if (!quote || quote.totalPaise <= 0 || cartItems.length === 0) {
      showToast("Your cart is empty.", "danger");
      return;
    }

    // Ensure Razorpay SDK is loaded
    setIsScriptLoading(true);
    setScriptLoadError(null);
    try {
      await loadRazorpayCheckoutScript();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to load Razorpay payment SDK";
      setIsScriptLoading(false);
      setScriptLoadError(errorMsg);
      showToast(errorMsg, "danger");
      return;
    }
    setIsScriptLoading(false);

    // Generate unique idempotency key for this order attempt
    const idempotencyKey = `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    dispatch(startOrderCreation());

    try {
      const orderData = await createOrderMutation({
        payload: {
          items: cartItems,
          couponCode: couponCode,
          expectedTotal: quote.totalPaise,
          customer,
          shippingAddress,
        },
        idempotencyKey,
      }).unwrap();

      dispatch(orderCreatedSuccess(orderData));
      openRazorpayModal(orderData);
    } catch (err: unknown) {
      const apiErr = err as {
        status?: number;
        data?: { error?: { code?: string; message?: string } };
      };

      if (apiErr.status === 409) {
        showToast(
          "Prices or discounts were updated. Please review your total.",
          "warning",
        );
        dispatch(orderCreationError("Prices were updated."));
      } else {
        const errorMsg =
          apiErr?.data?.error?.message ||
          "Unable to create order. Please check your connection and retry.";
        dispatch(orderCreationError(errorMsg));
        showToast(errorMsg, "danger");
      }
    }
  };

  const handleResumePayment = () => {
    if (paymentState.currentOrder) {
      dispatch(resumeAwaitingPayment());
      openRazorpayModal(paymentState.currentOrder);
    } else {
      handleInitiatePayment();
    }
  };

  return (
    <div className={styles.paymentStep}>
      <div className={styles.stepHeader}>
        <h2>Review &amp; Pay</h2>
        <p>Confirm your contact details and shipping address before opening payment.</p>
      </div>

      {/* Script Loading Error Banner with Retry */}
      {scriptLoadError && (
        <div
          className={styles.statusCard}
          style={{ borderColor: "var(--color-danger)" }}
          role="alert"
        >
          <div
            className={styles.statusIconWrapper}
            style={{ color: "var(--color-danger)" }}
          >
            <AlertCircle size={24} />
          </div>
          <h3>Payment Gateway Connection Error</h3>
          <p>{scriptLoadError}</p>
          <Button variant="secondary" size="sm" onClick={handleInitiatePayment}>
            Retry Loading Gateway
          </Button>
        </div>
      )}

      {/* Verifying Payment In-Progress State */}
      {paymentState.status === "verifying" && (
        <div
          className={`${styles.statusCard} ${styles.verifyingState}`}
          role="status"
          aria-live="polite"
        >
          <div className={styles.statusIconWrapper}>
            <ShieldCheck size={28} />
          </div>
          <h3>Confirming your payment</h3>
          <p>
            Cryptographically verifying your transaction with the server and banking
            network. Please do not close or refresh this tab.
          </p>
          <div className={styles.statusActions}>
            <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              Securing transaction receipt...
            </span>
          </div>
        </div>
      )}

      {/* Modal Dismissed / Neutral Cancelled State */}
      {paymentState.status === "cancelled" && (
        <div className={`${styles.statusCard} ${styles.cancelledState}`}>
          <div className={styles.statusIconWrapper}>
            <Clock size={24} />
          </div>
          <h3>Payment not completed</h3>
          <p>
            The payment window was closed before completion. No money was charged, and
            your cart and delivery details are safely preserved.
          </p>
          <div className={styles.statusActions}>
            <Button
              variant="primary"
              size="md"
              onClick={handleResumePayment}
              leftIcon={<RotateCcw size={16} />}
            >
              Resume Payment
            </Button>
            <Button variant="secondary" size="md" onClick={onEditDetails}>
              Edit Details
            </Button>
          </div>
        </div>
      )}

      {/* Payment Failed State */}
      {paymentState.status === "failed" && (
        <div className={`${styles.statusCard} ${styles.failedState}`} role="alert">
          <div className={styles.statusIconWrapper}>
            <AlertCircle size={24} />
          </div>
          <h3>Payment Unsuccessful</h3>
          <p>
            {paymentState.failureInfo?.description ||
              paymentState.errorMessage ||
              "Your card or bank declined the transaction in test mode."}
          </p>
          <div className={styles.statusActions}>
            <Button
              variant="primary"
              size="md"
              onClick={handleResumePayment}
              leftIcon={<RotateCcw size={16} />}
            >
              Try Again
            </Button>
            <Button variant="secondary" size="md" onClick={onEditDetails}>
              Edit Delivery Details
            </Button>
          </div>
        </div>
      )}

      {/* Review Details Card */}
      <div className={styles.reviewCard}>
        {/* Contact info review */}
        <div className={styles.reviewSection}>
          <div className={styles.sectionHeader}>
            <h3>
              <User size={16} color="var(--color-accent)" />
              <span>Contact Information</span>
            </h3>
            <button type="button" className={styles.editBtn} onClick={onEditDetails}>
              Edit
            </button>
          </div>
          <div className={styles.detailsContent}>
            <div>
              <strong>{customer.name}</strong>
            </div>
            <div>{customer.email}</div>
            <div>+91 {customer.phone}</div>
          </div>
        </div>

        {/* Shipping address review */}
        <div className={styles.reviewSection}>
          <div className={styles.sectionHeader}>
            <h3>
              <MapPin size={16} color="var(--color-accent)" />
              <span>Delivery Address</span>
            </h3>
            <button type="button" className={styles.editBtn} onClick={onEditDetails}>
              Edit
            </button>
          </div>
          <div className={styles.detailsContent}>
            <div>{shippingAddress.line1}</div>
            {shippingAddress.line2 && <div>{shippingAddress.line2}</div>}
            <div>
              {shippingAddress.city}, {shippingAddress.state} &ndash;{" "}
              {shippingAddress.pincode}
            </div>
          </div>
        </div>

        {/* Bag review link */}
        <div className={styles.reviewSection}>
          <div className={styles.sectionHeader}>
            <h3>
              <ShieldCheck size={16} color="var(--color-accent)" />
              <span>Order Items ({quote?.itemCount ?? 0})</span>
            </h3>
            <button type="button" className={styles.editBtn} onClick={onEditBag}>
              Edit Bag
            </button>
          </div>
          <div className={styles.detailsContent}>
            <span>All items confirmed tax-inclusive.</span>
          </div>
        </div>

        {/* Trust Row */}
        <div className={styles.trustRow}>
          <Lock size={20} color="var(--color-accent)" />
          <div className={styles.trustText}>
            <strong>Payments processed securely by Razorpay</strong>
            <span>
              256-bit TLS encryption protects your payment information. In test mode, no
              real funds are transferred.
            </span>
          </div>
        </div>
      </div>

      {/* Primary Pay Action */}
      <div className={styles.payButtonContainer}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={isProcessing || totalPaise <= 0}
          isLoading={isProcessing}
          loadingText={
            paymentState.status === "verifying"
              ? "Confirming payment..."
              : isScriptLoading
                ? "Connecting to gateway..."
                : "Opening checkout..."
          }
          onClick={
            paymentState.status === "cancelled" || paymentState.status === "failed"
              ? handleResumePayment
              : handleInitiatePayment
          }
          rightIcon={!isProcessing ? <ArrowRight size={18} /> : undefined}
        >
          Pay {formatPaiseToINR(totalPaise)}
        </Button>
      </div>
    </div>
  );
};
