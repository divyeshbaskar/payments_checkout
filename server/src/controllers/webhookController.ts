import { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { orderRepository } from "../repository/orderRepository.js";

/**
 * Razorpay Webhook Handler
 * Verifies raw request body with X-Razorpay-Signature HMAC-SHA256 digest
 * Handles payment.captured and payment.failed idempotently
 */
export async function razorpayWebhookHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const signature = req.headers["x-razorpay-signature"] as string | undefined;
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || "default_webhook_secret";

    if (!signature) {
      res.status(400).json({
        error: {
          code: "MISSING_WEBHOOK_SIGNATURE",
          message: "X-Razorpay-Signature header is missing.",
        },
      });
      return;
    }

    const rawBodyBuffer = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body), "utf-8");

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBodyBuffer)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "utf-8");
    const receivedBuf = Buffer.from(signature, "utf-8");

    if (
      expectedBuf.length !== receivedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, receivedBuf)
    ) {
      res.status(400).json({
        error: {
          code: "INVALID_WEBHOOK_SIGNATURE",
          message: "Webhook cryptographic signature validation failed.",
        },
      });
      return;
    }

    const payload = JSON.parse(rawBodyBuffer.toString("utf-8"));
    const event = payload.event as string;

    if (event === "payment.captured") {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id as string | undefined;
      const paymentId = paymentEntity?.id as string | undefined;

      if (razorpayOrderId) {
        const order = await orderRepository.findByRazorpayOrderId(razorpayOrderId);
        if (order && order.status !== "paid") {
          await orderRepository.updateStatus(order.id, "paid", paymentId);
        }
      }
    } else if (event === "payment.failed") {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id as string | undefined;

      if (razorpayOrderId) {
        const order = await orderRepository.findByRazorpayOrderId(razorpayOrderId);
        if (order && order.status !== "paid") {
          await orderRepository.updateStatus(order.id, "failed");
        }
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (err) {
    next(err);
  }
}
