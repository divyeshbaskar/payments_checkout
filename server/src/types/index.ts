export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  pricePaise: number; // Stored in integer paise
  visualType:
    | "felt_mat"
    | "walnut_stand"
    | "aluminum_shelf"
    | "brass_anchor"
    | "orbit_lamp"
    | "charging_dock";
}

export interface CartItemInput {
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

export type OrderStatus = "created" | "paid" | "failed" | "cancelled";

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

export interface InternalOrder {
  id: string; // internalOrderId
  receipt: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: "INR";
  status: OrderStatus;
  customer: CustomerDetails;
  shippingAddress: ShippingAddress;
  quote: QuoteResult;
  razorpayPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}
