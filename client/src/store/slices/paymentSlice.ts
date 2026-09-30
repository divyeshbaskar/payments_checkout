import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { OrderCreateResponse } from "../../types";

export type PaymentStatus =
  | "idle"
  | "creatingOrder"
  | "awaitingPayment"
  | "verifying"
  | "success"
  | "failed"
  | "cancelled"
  | "error";

export interface PaymentFailureInfo {
  code?: string;
  description?: string;
  source?: string;
  step?: string;
  reason?: string;
}

export interface PaymentState {
  status: PaymentStatus;
  currentOrder: OrderCreateResponse | null;
  paymentId: string | null;
  errorMessage: string | null;
  failureInfo: PaymentFailureInfo | null;
}

const initialState: PaymentState = {
  status: "idle",
  currentOrder: null,
  paymentId: null,
  errorMessage: null,
  failureInfo: null,
};

// Strict transition graph definition
const VALID_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  idle: ["creatingOrder"],
  creatingOrder: ["awaitingPayment", "error", "idle"],
  awaitingPayment: ["verifying", "failed", "cancelled", "error", "idle"],
  verifying: ["success", "failed", "error"],
  failed: ["awaitingPayment", "creatingOrder", "idle"],
  cancelled: ["awaitingPayment", "creatingOrder", "idle"],
  error: ["creatingOrder", "idle"],
  success: ["idle"],
};

export const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    startOrderCreation: state => {
      if (VALID_TRANSITIONS[state.status].includes("creatingOrder")) {
        state.status = "creatingOrder";
        state.errorMessage = null;
        state.failureInfo = null;
      }
    },
    orderCreatedSuccess: (state, action: PayloadAction<OrderCreateResponse>) => {
      if (VALID_TRANSITIONS[state.status].includes("awaitingPayment")) {
        state.status = "awaitingPayment";
        state.currentOrder = action.payload;
        state.errorMessage = null;
      }
    },
    orderCreationError: (state, action: PayloadAction<string>) => {
      if (VALID_TRANSITIONS[state.status].includes("error")) {
        state.status = "error";
        state.errorMessage = action.payload;
      }
    },
    startVerification: state => {
      if (VALID_TRANSITIONS[state.status].includes("verifying")) {
        state.status = "verifying";
        state.errorMessage = null;
      }
    },
    verificationSuccess: (state, action: PayloadAction<{ paymentId: string }>) => {
      if (VALID_TRANSITIONS[state.status].includes("success")) {
        state.status = "success";
        state.paymentId = action.payload.paymentId;
        state.errorMessage = null;
      }
    },
    paymentFailed: (state, action: PayloadAction<PaymentFailureInfo>) => {
      if (VALID_TRANSITIONS[state.status].includes("failed")) {
        state.status = "failed";
        state.failureInfo = action.payload;
        state.errorMessage =
          action.payload.description || "Payment failed. Please try again.";
      }
    },
    paymentDismissed: state => {
      if (VALID_TRANSITIONS[state.status].includes("cancelled")) {
        state.status = "cancelled";
        state.errorMessage = null;
      }
    },
    resumeAwaitingPayment: state => {
      if (
        VALID_TRANSITIONS[state.status].includes("awaitingPayment") &&
        state.currentOrder
      ) {
        state.status = "awaitingPayment";
        state.errorMessage = null;
      }
    },
    resetPaymentState: () => initialState,
  },
});

export const {
  startOrderCreation,
  orderCreatedSuccess,
  orderCreationError,
  startVerification,
  verificationSuccess,
  paymentFailed,
  paymentDismissed,
  resumeAwaitingPayment,
  resetPaymentState,
} = paymentSlice.actions;

export default paymentSlice.reducer;
