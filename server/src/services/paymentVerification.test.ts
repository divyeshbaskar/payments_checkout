import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifyPaymentSignature } from "./paymentVerification.js";

describe("Payment Signature Verification Service", () => {
  const testSecret = "top_secret_test_key_12345";
  const orderId = "order_O123456789ABCD";
  const paymentId = "pay_P9876543210ZYX";

  function computeValidSignature(order: string, payment: string, secret: string): string {
    return crypto
      .createHmac("sha256", secret)
      .update(`${order}|${payment}`)
      .digest("hex");
  }

  it("successfully verifies a valid Razorpay signature", () => {
    const validSignature = computeValidSignature(orderId, paymentId, testSecret);
    const result = verifyPaymentSignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: validSignature,
      keySecret: testSecret,
    });
    expect(result).toBe(true);
  });

  it("rejects a tampered signature with modified characters", () => {
    const validSignature = computeValidSignature(orderId, paymentId, testSecret);
    // Replace the last character with a different hex character
    const lastChar = validSignature.slice(-1);
    const tamperedChar = lastChar === "a" ? "b" : "a";
    const tamperedSignature = validSignature.slice(0, -1) + tamperedChar;

    const result = verifyPaymentSignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: tamperedSignature,
      keySecret: testSecret,
    });
    expect(result).toBe(false);
  });

  it("rejects a signature with wrong length without throwing error", () => {
    const validSignature = computeValidSignature(orderId, paymentId, testSecret);
    const tooShortSignature = validSignature.slice(0, 32);
    const tooLongSignature = validSignature + "extra";

    expect(
      verifyPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: tooShortSignature,
        keySecret: testSecret,
      }),
    ).toBe(false);

    expect(
      verifyPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: tooLongSignature,
        keySecret: testSecret,
      }),
    ).toBe(false);
  });

  it("rejects when signature was generated with a different secret", () => {
    const signatureWithWrongSecret = computeValidSignature(
      orderId,
      paymentId,
      "different_secret_key",
    );

    const result = verifyPaymentSignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signatureWithWrongSecret,
      keySecret: testSecret,
    });
    expect(result).toBe(false);
  });

  it("handles missing or empty arguments safely", () => {
    const validSignature = computeValidSignature(orderId, paymentId, testSecret);

    expect(
      verifyPaymentSignature({
        razorpayOrderId: "",
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
        keySecret: testSecret,
      }),
    ).toBe(false);

    expect(
      verifyPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: "",
        razorpaySignature: validSignature,
        keySecret: testSecret,
      }),
    ).toBe(false);

    expect(
      verifyPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: "",
        keySecret: testSecret,
      }),
    ).toBe(false);

    expect(
      verifyPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
        keySecret: "",
      }),
    ).toBe(false);
  });
});
