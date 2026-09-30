import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  Product,
  CartItem,
  QuoteResult,
  CustomerDetails,
  ShippingAddress,
  OrderCreateResponse,
  PaymentVerificationResponse,
} from "../../types";

const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) || "";

export interface CreateOrderPayload {
  items: CartItem[];
  couponCode?: string | null;
  expectedTotal: number;
  customer: CustomerDetails;
  shippingAddress: ShippingAddress;
}

export interface VerifyPaymentPayload {
  internalOrderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface OrderDetailsResponse {
  order: {
    id: string;
    receipt: string;
    amountPaise: number;
    currency: "INR";
    status: "created" | "paid" | "failed" | "cancelled";
    customer: {
      name: string;
      email: string;
    };
    shippingAddress: ShippingAddress;
    quote: QuoteResult;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    createdAt: string;
  };
}

export const meridianApi = createApi({
  reducerPath: "meridianApi",
  baseQuery: fetchBaseQuery({
    baseUrl: baseUrl ? `${baseUrl}` : "",
  }),
  tagTypes: ["Quote", "Order"],
  endpoints: builder => ({
    getProducts: builder.query<{ products: Product[] }, void>({
      query: () => "/api/products",
    }),
    getQuote: builder.mutation<
      QuoteResult,
      { items: CartItem[]; couponCode?: string | null }
    >({
      query: body => ({
        url: "/api/quote",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Quote"],
    }),
    createOrder: builder.mutation<
      OrderCreateResponse,
      { payload: CreateOrderPayload; idempotencyKey?: string }
    >({
      query: ({ payload, idempotencyKey }) => ({
        url: "/api/orders",
        method: "POST",
        body: payload,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: ["Order"],
    }),
    verifyPayment: builder.mutation<PaymentVerificationResponse, VerifyPaymentPayload>({
      query: body => ({
        url: "/api/payments/verify",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Order"],
    }),
    getOrder: builder.query<OrderDetailsResponse, string>({
      query: id => `/api/orders/${id}`,
      providesTags: (_res, _err, id) => [{ type: "Order", id }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetQuoteMutation,
  useCreateOrderMutation,
  useVerifyPaymentMutation,
  useGetOrderQuery,
} = meridianApi;
