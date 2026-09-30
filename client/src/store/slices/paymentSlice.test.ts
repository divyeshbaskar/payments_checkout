import { describe, it, expect } from "vitest";
import paymentReducer, {
  startOrderCreation,
  orderCreatedSuccess,
  orderCreationError,
  startVerification,
  verificationSuccess,
  paymentFailed,
  paymentDismissed,
  resumeAwaitingPayment,
  resetPaymentState,
  PaymentState,
} from "./paymentSlice";
import { OrderCreateResponse } from "../../types";

describe("Payment State Machine Reducer", () => {
  const dummyOrder: OrderCreateResponse = {
    internalOrderId: "ord_test_123",
    razorpayOrderId: "order_rzp_123",
    amount: 349900,
    currency: "INR",
    keyId: "rzp_test_12345",
  };

  const initialIdleState: PaymentState = {
    status: "idle",
    currentOrder: null,
    paymentId: null,
    errorMessage: null,
    failureInfo: null,
  };

  describe("Happy Path Flow", () => {
    it("transitions cleanly: idle -> creatingOrder -> awaitingPayment -> verifying -> success", () => {
      // 1. idle -> creatingOrder
      let state = paymentReducer(initialIdleState, startOrderCreation());
      expect(state.status).toBe("creatingOrder");

      // 2. creatingOrder -> awaitingPayment
      state = paymentReducer(state, orderCreatedSuccess(dummyOrder));
      expect(state.status).toBe("awaitingPayment");
      expect(state.currentOrder).toEqual(dummyOrder);

      // 3. awaitingPayment -> verifying
      state = paymentReducer(state, startVerification());
      expect(state.status).toBe("verifying");

      // 4. verifying -> success
      state = paymentReducer(state, verificationSuccess({ paymentId: "pay_test_999" }));
      expect(state.status).toBe("success");
      expect(state.paymentId).toBe("pay_test_999");
    });
  });

  describe("Failure and Retry Flow", () => {
    it("transitions awaitingPayment -> failed -> awaitingPayment", () => {
      let state = paymentReducer(initialIdleState, startOrderCreation());
      state = paymentReducer(state, orderCreatedSuccess(dummyOrder));
      expect(state.status).toBe("awaitingPayment");

      // Payment failed
      state = paymentReducer(
        state,
        paymentFailed({
          code: "BAD_REQUEST_ERROR",
          description: "Payment was declined by issuing bank",
          step: "payment_authorization",
        }),
      );
      expect(state.status).toBe("failed");
      expect(state.errorMessage).toBe("Payment was declined by issuing bank");

      // Retry same order -> awaitingPayment
      state = paymentReducer(state, resumeAwaitingPayment());
      expect(state.status).toBe("awaitingPayment");
    });
  });

  describe("Modal Dismissal and Resume Flow", () => {
    it("transitions awaitingPayment -> cancelled -> awaitingPayment", () => {
      let state = paymentReducer(initialIdleState, startOrderCreation());
      state = paymentReducer(state, orderCreatedSuccess(dummyOrder));

      // User closed modal without paying
      state = paymentReducer(state, paymentDismissed());
      expect(state.status).toBe("cancelled");

      // Resume payment
      state = paymentReducer(state, resumeAwaitingPayment());
      expect(state.status).toBe("awaitingPayment");
    });
  });

  describe("Enforcement: Illegal Transitions are Blocked", () => {
    it("prevents jumping directly from idle to success", () => {
      const state = paymentReducer(
        initialIdleState,
        verificationSuccess({ paymentId: "pay_fake" }),
      );
      // Status must remain idle
      expect(state.status).toBe("idle");
      expect(state.paymentId).toBeNull();
    });

    it("prevents jumping directly from idle to verifying", () => {
      const state = paymentReducer(initialIdleState, startVerification());
      expect(state.status).toBe("idle");
    });

    it("prevents jumping from creatingOrder directly to success", () => {
      let state = paymentReducer(initialIdleState, startOrderCreation());
      expect(state.status).toBe("creatingOrder");

      state = paymentReducer(state, verificationSuccess({ paymentId: "pay_fake" }));
      expect(state.status).toBe("creatingOrder");
      expect(state.paymentId).toBeNull();
    });

    it("handles order creation error and allows reset", () => {
      let state = paymentReducer(initialIdleState, startOrderCreation());
      state = paymentReducer(state, orderCreationError("Network timeout"));
      expect(state.status).toBe("error");
      expect(state.errorMessage).toBe("Network timeout");

      state = paymentReducer(state, resetPaymentState());
      expect(state.status).toBe("idle");
    });
  });
});
