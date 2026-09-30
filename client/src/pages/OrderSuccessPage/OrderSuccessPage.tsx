import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Printer,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useGetOrderQuery } from "../../store/api/meridianApi";
import { useAppDispatch } from "../../store";
import { resetToDefault } from "../../store/slices/cartSlice";
import { resetPaymentState } from "../../store/slices/paymentSlice";
import { setCurrentStepIndex } from "../../store/slices/checkoutSlice";
import { formatPaiseToINR } from "../../utils/currency";
import { AnimatedCheckmark } from "../../components/common/AnimatedCheckmark";
import { ProductTile } from "../../components/cart/ProductTile";
import { Button } from "../../components/common/Button";
import styles from "./OrderSuccessPage.module.scss";

export const OrderSuccessPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data, isLoading, error } = useGetOrderQuery(id || "", {
    skip: !id,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleContinueShopping = () => {
    dispatch(resetToDefault());
    dispatch(resetPaymentState());
    dispatch(setCurrentStepIndex(0));
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className={styles.successPage}>
        <div className={styles.skeletonContainer}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--color-surface-subtle)",
              margin: "0 auto",
            }}
          />
          <div
            style={{
              height: 28,
              width: 260,
              background: "var(--color-surface-subtle)",
              margin: "0 auto",
              borderRadius: 4,
            }}
          />
          <div
            style={{
              height: 16,
              width: 380,
              background: "var(--color-surface-subtle)",
              margin: "0 auto",
              borderRadius: 4,
            }}
          />
        </div>
      </div>
    );
  }

  if (error || !data?.order) {
    return (
      <div className={styles.successPage}>
        <div
          className={styles.successCard}
          style={{ textAlign: "center", alignItems: "center" }}
        >
          <div style={{ color: "var(--color-danger)", marginBottom: 12 }}>
            <AlertCircle size={48} />
          </div>
          <h1>Order Not Found</h1>
          <p style={{ color: "var(--color-text-muted)" }}>
            We were unable to locate details for order ID &ldquo;{id}&rdquo;.
          </p>
          <div style={{ marginTop: 24 }}>
            <Link to="/">
              <Button variant="primary">Return to Checkout</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { order } = data;
  const quote = order.quote;
  const items = quote?.items ?? [];

  return (
    <div className={styles.successPage}>
      <div className={`${styles.successCard} printable-receipt`}>
        {/* Animated Checkmark and Header */}
        <div className={styles.headerSection}>
          <AnimatedCheckmark />
          <h1>Payment Confirmed</h1>
          <p>
            Thank you, {order.customer.name}. Your order has been cryptographically
            verified and scheduled for expedited fulfillment.
          </p>
        </div>

        {/* Order Metadata Grid */}
        <div className={styles.orderMetaGrid}>
          <div className={styles.metaItem}>
            <span>Order ID</span>
            <strong>{order.id}</strong>
          </div>

          <div className={styles.metaItem}>
            <span>Payment ID</span>
            <strong style={{ color: "var(--color-accent)" }}>
              {order.razorpayPaymentId || "Verified Simulator"}
            </strong>
          </div>

          <div className={styles.metaItem}>
            <span>Status</span>
            <div className={styles.badgePaid}>
              <CheckCircle2 size={16} />
              <span>Paid &amp; Captured</span>
            </div>
          </div>

          <div className={styles.metaItem}>
            <span>Receipt No.</span>
            <strong>{order.receipt}</strong>
          </div>
        </div>

        {/* Itemized Table */}
        <div className={styles.receiptTableWrapper}>
          <table className={styles.receiptTable}>
            <thead>
              <tr>
                <th scope="col">Item Description</th>
                <th scope="col" style={{ textAlign: "center" }}>
                  Qty
                </th>
                <th scope="col" style={{ textAlign: "right" }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.productId}>
                  <td>
                    <div className={styles.itemCell}>
                      <ProductTile visualType={item.visualType} name={item.name} />
                      <div>
                        <strong>{item.name}</strong>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          Unit: {formatPaiseToINR(item.unitPricePaise)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }} className="tabular-nums">
                    {item.quantity}
                  </td>
                  <td style={{ textAlign: "right" }} className="tabular-nums">
                    {formatPaiseToINR(item.lineTotalPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Breakdown summary */}
          <div className={styles.receiptSummary}>
            <div className={styles.summaryLine}>
              <span>Subtotal</span>
              <span className="tabular-nums">
                {formatPaiseToINR(quote.subtotalPaise)}
              </span>
            </div>

            {quote.discountPaise > 0 && (
              <div
                className={styles.summaryLine}
                style={{ color: "var(--color-success)", fontWeight: 600 }}
              >
                <span>Discount ({quote.coupon?.code})</span>
                <span className="tabular-nums">
                  - {formatPaiseToINR(quote.discountPaise)}
                </span>
              </div>
            )}

            <div className={styles.summaryLine}>
              <span>Shipping</span>
              <span>
                {quote.shippingPaise === 0
                  ? "FREE"
                  : formatPaiseToINR(quote.shippingPaise)}
              </span>
            </div>

            <div className={styles.totalLine}>
              <div>
                <span>Total Paid</span>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 400,
                    color: "var(--color-text-muted)",
                  }}
                >
                  Inclusive of all taxes
                </div>
              </div>
              <span className="tabular-nums">{formatPaiseToINR(order.amountPaise)}</span>
            </div>
          </div>
        </div>

        {/* Customer and Shipping Details */}
        <div className={styles.shippingInfoGrid}>
          <div>
            <h4>Contact Details</h4>
            <p>
              <strong>{order.customer.name}</strong>
              <br />
              {order.customer.email}
              <br />
              Confirmation email dispatched.
            </p>
          </div>

          <div>
            <h4>Shipping Destination</h4>
            <p>
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 && (
                <>
                  <br />
                  {order.shippingAddress.line2}
                </>
              )}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} &ndash;{" "}
              {order.shippingAddress.pincode}
            </p>
          </div>
        </div>

        {/* Security badge footnote */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.8125rem",
            color: "var(--color-text-muted)",
            borderTop: "1px solid var(--color-border-subtle)",
            paddingTop: 16,
          }}
        >
          <ShieldCheck size={16} color="var(--color-success)" />
          <span>Authenticated cryptographic payment record sealed via SHA-256 HMAC.</span>
        </div>

        {/* Actions Row */}
        <div className={`${styles.actionsRow} no-print`}>
          <Button
            variant="secondary"
            size="md"
            onClick={handlePrint}
            leftIcon={<Printer size={16} />}
          >
            Print Receipt
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleContinueShopping}
            rightIcon={<ArrowRight size={16} />}
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
};
