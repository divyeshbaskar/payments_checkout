export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  pricePaise: number;
  visualType:
    | "felt_mat"
    | "walnut_stand"
    | "aluminum_shelf"
    | "brass_anchor"
    | "orbit_lamp"
    | "charging_dock";
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface QuoteLineItem {
  productId: string;
  slug: string;
  name: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
  visualType: Product["visualType"];
}

export interface CouponStatus {
  applied: boolean;
  code: string | null;
  discountPaise: number;
  message: string;
}

export interface QuoteResult {
  items: QuoteLineItem[];
  itemCount: number;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  totalPaise: number;
  coupon: CouponStatus;
  currency: "INR";
  taxNote: "Inclusive of all taxes";
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderCreateResponse {
  internalOrderId: string;
  razorpayOrderId: string;
  amount: number; // in paise
  currency: "INR";
  keyId: string; // Public key only!
}

export interface PaymentVerificationResponse {
  verified: boolean;
  internalOrderId: string;
  razorpayPaymentId: string;
  status: "paid";
  message: string;
}
