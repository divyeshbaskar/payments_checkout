import React from "react";
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, RotateCcw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../../store";
import {
  incrementQuantity,
  decrementQuantity,
  removeItem,
  clearCart,
  resetToDefault,
  addItem,
} from "../../../../store/slices/cartSlice";
import { useGetProductsQuery } from "../../../../store/api/meridianApi";
import { formatPaiseToINR } from "../../../../utils/currency";
import { QuoteResult } from "../../../../types";
import { ProductTile } from "../../../cart/ProductTile";
import { Button } from "../../../common/Button";
import styles from "./CartStep.module.scss";

export interface CartStepProps {
  quote: QuoteResult | null;
  onNextStep: () => void;
}

export const CartStep: React.FC<CartStepProps> = ({ quote, onNextStep }) => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(state => state.cart.items);
  const { data: productsData } = useGetProductsQuery();
  const catalog = productsData?.products ?? [];

  const quoteItems = quote?.items ?? [];
  const isCartEmpty = cartItems.length === 0;

  return (
    <div className={styles.cartStep}>
      <div className={styles.stepHeader}>
        <h2>Your Bag</h2>
        {!isCartEmpty && (
          <button
            type="button"
            className={styles.clearCartBtn}
            onClick={() => dispatch(clearCart())}
          >
            Clear cart
          </button>
        )}
      </div>

      {isCartEmpty ? (
        <div className={styles.emptyCart}>
          <div className={styles.emptyIconWrapper}>
            <ShoppingBag size={32} />
          </div>
          <h3>Your shopping bag is empty</h3>
          <p>
            Add items from our premium desk accessories collection below to test the
            checkout flow.
          </p>
          <Button
            variant="primary"
            onClick={() => dispatch(resetToDefault())}
            leftIcon={<RotateCcw size={16} />}
          >
            Restore Sample Order
          </Button>
        </div>
      ) : (
        <div className={styles.cartList}>
          {quoteItems.map(item => (
            <div key={item.productId} className={styles.cartItemCard}>
              <div className={styles.itemLeft}>
                <ProductTile visualType={item.visualType} name={item.name} />
                <div className={styles.itemInfo}>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  <span className={`${styles.unitPrice} tabular-nums`}>
                    {formatPaiseToINR(item.unitPricePaise)} each
                  </span>
                </div>
              </div>

              <div className={styles.itemRight}>
                {/* Quantity Stepper (min 1, max 10) */}
                <div
                  className={styles.stepperControl}
                  role="group"
                  aria-label={`Quantity for ${item.name}`}
                >
                  <button
                    type="button"
                    className={styles.stepperBtn}
                    onClick={() => dispatch(decrementQuantity(item.productId))}
                    disabled={item.quantity <= 1}
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    <Minus size={14} />
                  </button>
                  <span className={styles.stepperValue} aria-live="polite">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className={styles.stepperBtn}
                    onClick={() => dispatch(incrementQuantity(item.productId))}
                    disabled={item.quantity >= 10}
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className={`${styles.lineTotal} tabular-nums`}>
                  {formatPaiseToINR(item.lineTotalPaise)}
                </div>

                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => dispatch(removeItem(item.productId))}
                  aria-label={`Remove ${item.name} from bag`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Catalog items drawer to easily test different totals and coupons */}
      <div className={styles.catalogDrawerSection}>
        <div className={styles.catalogHeader}>
          <h3>Add more items from Meridian Collection</h3>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            Try adding to reach coupon thresholds (₹1,999 for FLAT200)
          </span>
        </div>
        <div className={styles.catalogGrid}>
          {catalog.map(prod => {
            const inCart = cartItems.some(i => i.productId === prod.id);
            return (
              <div key={prod.id} className={styles.catalogCard}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ProductTile visualType={prod.visualType} name={prod.name} />
                  <div className={styles.catalogItemInfo}>
                    <span className={styles.catalogItemName}>{prod.name}</span>
                    <span className={`${styles.catalogItemPrice} tabular-nums`}>
                      {formatPaiseToINR(prod.pricePaise)}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={inCart ? "secondary" : "primary"}
                  onClick={() => dispatch(addItem({ productId: prod.id }))}
                  aria-label={`Add ${prod.name} to cart`}
                >
                  {inCart ? "+1" : "Add"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Continue Action */}
      {!isCartEmpty && (
        <div className={styles.actionBar}>
          <Button
            size="lg"
            variant="primary"
            onClick={onNextStep}
            rightIcon={<ArrowRight size={18} />}
          >
            Continue to Delivery Details
          </Button>
        </div>
      )}
    </div>
  );
};
