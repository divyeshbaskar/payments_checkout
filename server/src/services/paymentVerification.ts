import crypto from "node:crypto";

export interface VerifySignatureParams {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  keySecret: string;
}

/**
 * Cryptographically verifies Razorpay Standard Checkout payment signature.
 *
 * Algorithm:
 * 1. Compute HMAC-SHA256 of `razorpayOrderId + "|" + razorpayPaymentId` with the key secret.
 * 2. Convert expected hex and received signature into Buffers.
 * 3. Verify buffer lengths match (timingSafeEqual throws on unequal length buffers).
 * 4. Perform timingSafeEqual comparison to prevent timing attacks.
 */
export function verifyPaymentSignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  keySecret,
}: VerifySignatureParams): boolean {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !keySecret) {
    return false;
  }

  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(payload)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
  const receivedBuffer = Buffer.from(razorpaySignature, "utf-8");

  // Critical security check: timingSafeEqual throws an error if buffer lengths differ
  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
