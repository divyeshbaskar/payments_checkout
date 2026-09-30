import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  setCurrentStepIndex,
  setCurrentQuote,
  setIsQuoting,
} from "../../store/slices/checkoutSlice";
import { setCouponCode, removeCoupon } from "../../store/slices/cartSlice";
import { useGetQuoteMutation } from "../../store/api/meridianApi";
import { useToast } from "../../context/ToastContext";
import { Stepper, StepItem } from "../../components/common/Stepper";
import { OrderSummary } from "../../components/checkout/OrderSummary";
import { CartStep } from "../../components/checkout/steps/CartStep";
import { DetailsStep } from "../../components/checkout/steps/DetailsStep";
import { PaymentStep } from "../../components/checkout/steps/PaymentStep";
import styles from "./CheckoutPage.module.scss";

const STEPS: StepItem[] = [
  { id: "cart", label: "Bag" },
  { id: "details", label: "Delivery" },
  { id: "payment", label: "Payment" },
];

export const CheckoutPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const currentStepIndex = useAppSelector(state => state.checkout.currentStepIndex);
  const cartItems = useAppSelector(state => state.cart.items);
  const couponCode = useAppSelector(state => state.cart.couponCode);
  const currentQuote = useAppSelector(state => state.checkout.currentQuote);
  const isQuoting = useAppSelector(state => state.checkout.isQuoting);

  const [fetchQuote, { isLoading: isQuoteApiLoading }] = useGetQuoteMutation();

  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  // Focus step heading on step change for accessibility
  useEffect(() => {
    if (stepHeadingRef.current) {
      stepHeadingRef.current.focus();
    }
  }, [currentStepIndex]);

  // Request fresh server-calculated quote whenever items or coupon change
  useEffect(() => {
    let isCancelled = false;

    async function syncQuote() {
      dispatch(setIsQuoting(true));
      try {
        const quote = await fetchQuote({
          items: cartItems,
          couponCode: couponCode,
        }).unwrap();

        if (!isCancelled) {
          dispatch(setCurrentQuote(quote));
        }
      } catch {
        if (!isCancelled) {
          showToast(
            "Unable to recalculate price quote. Please check your connection.",
            "danger",
          );
        }
      } finally {
        if (!isCancelled) {
          dispatch(setIsQuoting(false));
        }
      }
    }

    syncQuote();

    return () => {
      isCancelled = true;
    };
  }, [cartItems, couponCode, dispatch, fetchQuote, showToast]);

  const handleApplyCoupon = (code: string) => {
    dispatch(setCouponCode(code));
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
    showToast("Coupon removed", "info");
  };

  const handleStepClick = (index: number) => {
    if (index < currentStepIndex) {
      dispatch(setCurrentStepIndex(index));
    }
  };

  return (
    <div className={styles.checkoutPage}>
      <h1 ref={stepHeadingRef} tabIndex={-1} className="sr-only">
        Meridian Checkout — {STEPS[currentStepIndex]?.label}
      </h1>

      <Stepper
        steps={STEPS}
        currentStepIndex={currentStepIndex}
        onStepClick={handleStepClick}
      />

      <div className={styles.checkoutLayout}>
        <div className={styles.stepContent}>
          <AnimatePresence mode="wait">
            {currentStepIndex === 0 && (
              <motion.div
                key="step-cart"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
              >
                <CartStep
                  quote={currentQuote}
                  onNextStep={() => dispatch(setCurrentStepIndex(1))}
                />
              </motion.div>
            )}

            {currentStepIndex === 1 && (
              <motion.div
                key="step-details"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
              >
                <DetailsStep
                  onBack={() => dispatch(setCurrentStepIndex(0))}
                  onNextStep={() => dispatch(setCurrentStepIndex(2))}
                />
              </motion.div>
            )}

            {currentStepIndex === 2 && (
              <motion.div
                key="step-payment"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
              >
                <PaymentStep
                  quote={currentQuote}
                  onEditDetails={() => dispatch(setCurrentStepIndex(1))}
                  onEditBag={() => dispatch(setCurrentStepIndex(0))}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <OrderSummary
          quote={currentQuote}
          isLoading={isQuoting || isQuoteApiLoading}
          onApplyCoupon={handleApplyCoupon}
          onRemoveCoupon={handleRemoveCoupon}
        />
      </div>
    </div>
  );
};
