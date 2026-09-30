import { getProductById } from "../catalog/products.js";
import {
  CartItemInput,
  CouponStatus,
  QuoteLineItem,
  QuoteResult,
} from "../types/index.js";

export const SHIPPING_THRESHOLD_PAISE = 99900; // ₹999.00
export const STANDARD_SHIPPING_PAISE = 9900; // ₹99.00
export const MINIMUM_ORDER_FLOOR_PAISE = 10000; // ₹100.00 store floor
export const RAZORPAY_HARD_FLOOR_PAISE = 100; // ₹1.00 hard payment gateway floor

export const FLAT200_MIN_SUBTOTAL_PAISE = 199900; // ₹1,999.00
export const FLAT200_DISCOUNT_PAISE = 20000; // ₹200.00
export const WELCOME10_CAP_PAISE = 50000; // ₹500.00

export class PricingError extends Error {
  constructor(
    message: string,
    public readonly code: "PRODUCT_NOT_FOUND" | "INVALID_QUANTITY" | "EMPTY_CART",
  ) {
    super(message);
    this.name = "PricingError";
  }
}

/**
 * Validates and evaluates coupon code against the current cart subtotal.
 * Enforces integer arithmetic only (no floating point math).
 */
export function evaluateCoupon(
  rawCouponCode: string | undefined | null,
  subtotalPaise: number,
): CouponStatus {
  if (!rawCouponCode || rawCouponCode.trim() === "") {
    return {
      applied: false,
      code: null,
      discountPaise: 0,
      message: "No coupon applied",
    };
  }

  const normalizedCode = rawCouponCode.trim().toUpperCase();

  if (normalizedCode === "WELCOME10") {
    if (subtotalPaise <= 0) {
      return {
        applied: false,
        code: normalizedCode,
        discountPaise: 0,
        message: "Cart must have items to apply WELCOME10",
      };
    }
    // 10% off subtotal using integer math: Math.floor((subtotal * 10) / 100)
    const rawDiscount = Math.floor((subtotalPaise * 10) / 100);
    const cappedDiscount = Math.min(rawDiscount, WELCOME10_CAP_PAISE);

    return {
      applied: true,
      code: normalizedCode,
      discountPaise: cappedDiscount,
      message:
        rawDiscount >= WELCOME10_CAP_PAISE
          ? "WELCOME10 applied: 10% discount (max cap of ₹500 reached)"
          : "WELCOME10 applied: 10% discount",
    };
  }

  if (normalizedCode === "FLAT200") {
    if (subtotalPaise < FLAT200_MIN_SUBTOTAL_PAISE) {
      return {
        applied: false,
        code: normalizedCode,
        discountPaise: 0,
        message: "FLAT200 requires a minimum subtotal of ₹1,999",
      };
    }

    return {
      applied: true,
      code: normalizedCode,
      discountPaise: FLAT200_DISCOUNT_PAISE,
      message: "FLAT200 applied: ₹200 savings on your order",
    };
  }

  return {
    applied: false,
    code: normalizedCode,
    discountPaise: 0,
    message: `Coupon code "${normalizedCode}" is invalid or expired`,
  };
}

/**
 * Single source of truth pricing engine.
 * Computes prices strictly from the server product catalog.
 * Uses integer paise exclusively.
 */
export function calculateQuote(
  items: CartItemInput[],
  couponCode?: string | null,
): QuoteResult {
  if (!items || items.length === 0) {
    return {
      items: [],
      itemCount: 0,
      subtotalPaise: 0,
      discountPaise: 0,
      shippingPaise: 0,
      totalPaise: 0,
      coupon: {
        applied: false,
        code: null,
        discountPaise: 0,
        message: "Cart is empty",
      },
      currency: "INR",
      taxNote: "Inclusive of all taxes",
    };
  }

  let subtotalPaise = 0;
  let totalQuantity = 0;
  const quoteLineItems: QuoteLineItem[] = [];

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
      throw new PricingError(
        `Quantity for product "${item.productId}" must be an integer between 1 and 10`,
        "INVALID_QUANTITY",
      );
    }

    const product = getProductById(item.productId);
    if (!product) {
      throw new PricingError(
        `Product with id "${item.productId}" was not found in catalog`,
        "PRODUCT_NOT_FOUND",
      );
    }

    const lineTotalPaise = product.pricePaise * item.quantity;
    subtotalPaise += lineTotalPaise;
    totalQuantity += item.quantity;

    quoteLineItems.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      quantity: item.quantity,
      unitPricePaise: product.pricePaise,
      lineTotalPaise,
      visualType: product.visualType,
    });
  }

  // Evaluate coupon
  const coupon = evaluateCoupon(couponCode, subtotalPaise);
  const discountPaise = coupon.applied ? coupon.discountPaise : 0;

  // Shipping calculation: 0 if (subtotal - discount) >= 99900 paise, else 9900 paise
  const netSubtotal = Math.max(0, subtotalPaise - discountPaise);
  const shippingPaise =
    netSubtotal >= SHIPPING_THRESHOLD_PAISE ? 0 : STANDARD_SHIPPING_PAISE;

  // Total calculation with floor enforcement
  const calculatedTotal = subtotalPaise - discountPaise + shippingPaise;
  // Floor: Total must never be below 10000 paise (store floor) or 100 paise (Razorpay minimum)
  const totalPaise = Math.max(
    MINIMUM_ORDER_FLOOR_PAISE,
    Math.max(RAZORPAY_HARD_FLOOR_PAISE, calculatedTotal),
  );

  return {
    items: quoteLineItems,
    itemCount: totalQuantity,
    subtotalPaise,
    discountPaise,
    shippingPaise,
    totalPaise,
    coupon,
    currency: "INR",
    taxNote: "Inclusive of all taxes",
  };
}
