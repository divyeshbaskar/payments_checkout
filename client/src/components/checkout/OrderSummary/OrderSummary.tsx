import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Tag,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  ShoppingBag,
} from "lucide-react";
import { formatPaiseToINR } from "../../../utils/currency";
import { QuoteResult } from "../../../types";
import { ProductTile } from "../../cart/ProductTile";
import { Button } from "../../common/Button";
import styles from "./OrderSummary.module.scss";

export interface OrderSummaryProps {
  quote: QuoteResult | null;
  isLoading: boolean;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  quote,
  isLoading,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim()) {
      onApplyCoupon(couponInput.trim());
      setCouponInput("");
    }
  };

  const totalPaise = quote?.totalPaise ?? 0;
  const subtotalPaise = quote?.subtotalPaise ?? 0;
  const discountPaise = quote?.discountPaise ?? 0;
  const shippingPaise = quote?.shippingPaise ?? 0;
  const items = quote?.items ?? [];

  return (
    <aside className={styles.summaryWrapper} aria-label="Order Summary">
      {/* Mobile Accordion Toggle */}
      <button
        type="button"
        className={styles.mobileAccordionToggle}
        onClick={() => setIsMobileOpen(prev => !prev)}
        aria-expanded={isMobileOpen}
        aria-controls="checkout-order-summary-details"
      >
        <div className={styles.mobileToggleLeft}>
          <ShoppingBag size={18} color="var(--color-accent)" />
          <span>{isMobileOpen ? "Hide order summary" : "Show order summary"}</span>
          {isMobileOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        <div className={`${styles.mobileTotal} tabular-nums`}>
          {formatPaiseToINR(totalPaise)}
        </div>
      </button>

      {/* Main Summary Card */}
      <div
        id="checkout-order-summary-details"
        className={`${styles.summaryCard} ${isMobileOpen ? styles.mobileOpen : ""}`}
      >
        <div className={styles.cardHeader}>
          <h2>Order Summary</h2>
          <span className={styles.itemCountBadge}>
            {quote?.itemCount ?? 0} {quote?.itemCount === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Line Items List */}
        <div className={styles.itemList}>
          {items.map(item => (
            <div key={item.productId} className={styles.itemRow}>
              <div className={styles.itemInfo}>
                <ProductTile visualType={item.visualType} name={item.name} />
                <div className={styles.itemDetails}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemQty}>Qty: {item.quantity}</span>
                </div>
              </div>
              <div className={`${styles.itemPrice} tabular-nums`}>
                {formatPaiseToINR(item.lineTotalPaise)}
              </div>
            </div>
          ))}
        </div>

        {/* Coupon Code Section */}
        <div className={styles.couponSection}>
          {quote?.coupon?.applied ? (
            <div className={styles.appliedTag}>
              <div className={styles.appliedTagContent}>
                <Tag size={14} />
                <span>{quote.coupon.code} applied</span>
              </div>
              <button
                type="button"
                className={styles.removeCouponBtn}
                onClick={onRemoveCoupon}
                aria-label={`Remove coupon ${quote.coupon.code}`}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplyCoupon} className={styles.couponForm}>
              <label htmlFor="coupon-input-field" className="sr-only">
                Coupon or gift code
              </label>
              <input
                id="coupon-input-field"
                type="text"
                placeholder="PROMO CODE"
                value={couponInput}
                onChange={e => setCouponInput(e.target.value.toUpperCase())}
                className={styles.couponInput}
                autoComplete="off"
                autoCapitalize="characters"
              />
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={!couponInput.trim() || isLoading}
              >
                Apply
              </Button>
            </form>
          )}

          {/* Inline Coupon Message Feedback */}
          {quote?.coupon && quote.coupon.message && (
            <div
              className={`${styles.couponFeedback} ${
                quote.coupon.applied ? styles.couponSuccess : styles.couponError
              }`}
              role="status"
              aria-live="polite"
            >
              {quote.coupon.applied ? (
                <CheckCircle2 size={14} />
              ) : (
                <AlertCircle size={14} />
              )}
              <span>{quote.coupon.message}</span>
            </div>
          )}
        </div>

        {/* Pricing Breakdown */}
        <div className={styles.breakdown}>
          <div className={styles.line}>
            <span>Subtotal</span>
            <span className="tabular-nums">{formatPaiseToINR(subtotalPaise)}</span>
          </div>

          {discountPaise > 0 && (
            <div className={`${styles.line} ${styles.discountLine}`}>
              <span>Discount ({quote?.coupon?.code})</span>
              <span className="tabular-nums">- {formatPaiseToINR(discountPaise)}</span>
            </div>
          )}

          <div className={styles.line}>
            <span>Shipping</span>
            {shippingPaise === 0 ? (
              <span className={styles.freeShipping}>FREE</span>
            ) : (
              <span className="tabular-nums">{formatPaiseToINR(shippingPaise)}</span>
            )}
          </div>

          {/* Grand Total */}
          <div className={styles.totalRow}>
            <div className={styles.totalLabel}>Total</div>
            <div className={styles.totalAmountWrapper}>
              <div
                className={`${styles.totalAmount} tabular-nums`}
                aria-live="polite"
                aria-atomic="true"
              >
                {isLoading ? (
                  <div className={styles.skeletonBar} style={{ width: 120 }} />
                ) : (
                  formatPaiseToINR(totalPaise)
                )}
              </div>
              <span className={styles.taxNotice}>Inclusive of all taxes</span>
            </div>
          </div>
        </div>

        {/* Trust footnote */}
        <div className={styles.trustFootnote}>
          <Lock size={13} color="var(--color-accent)" aria-hidden="true" />
          <span>Encrypted checkout. Only server-quoted amounts are processed.</span>
        </div>
      </div>
    </aside>
  );
};
