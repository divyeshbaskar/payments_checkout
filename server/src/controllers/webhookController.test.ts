import { describe, it, expect } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import { app } from "../index.js";
import { orderRepository } from "../repository/orderRepository.js";
import { env } from "../config/env.js";
import { InternalOrder } from "../types/index.js";

describe("Razorpay Webhook API Integration", () => {
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || "default_webhook_secret";

  function computeWebhookSignature(body: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(body).digest("hex");
  }

  const sampleOrder: InternalOrder = {
    id: "ord_webhook_test_1",
    receipt: "rcpt_wh_1",
    razorpayOrderId: "order_rzp_webhook_123",
    amountPaise: 349900,
    currency: "INR",
    status: "created",
    customer: {
      name: "Webhook Tester",
      email: "webhook@example.com",
      phone: "9876543210",
    },
    shippingAddress: {
      line1: "123 Test St",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
    },
    quote: {
      items: [],
      itemCount: 1,
      subtotalPaise: 349900,
      discountPaise: 0,
      shippingPaise: 0,
      totalPaise: 349900,
      coupon: { applied: false, code: null, discountPaise: 0, message: "" },
      currency: "INR",
      taxNote: "Inclusive of all taxes",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("returns 400 when X-Razorpay-Signature header is missing", async () => {
    const res = await request(app)
      .post("/api/webhooks/razorpay")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ event: "payment.captured" }));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_WEBHOOK_SIGNATURE");
  });

  it("returns 400 when X-Razorpay-Signature signature is invalid", async () => {
    const rawBody = JSON.stringify({ event: "payment.captured" });
    const res = await request(app)
      .post("/api/webhooks/razorpay")
      .set("Content-Type", "application/json")
      .set("x-razorpay-signature", "invalid_signature_hex_12345")
      .send(rawBody);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_WEBHOOK_SIGNATURE");
  });

  it("processes payment.captured event and updates order status to paid", async () => {
    await orderRepository.save(sampleOrder);

    const eventPayload = {
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_wh_captured_999",
            order_id: sampleOrder.razorpayOrderId,
            amount: sampleOrder.amountPaise,
            status: "captured",
          },
        },
      },
    };

    const rawBody = JSON.stringify(eventPayload);
    const validSignature = computeWebhookSignature(rawBody, webhookSecret);

    const res = await request(app)
      .post("/api/webhooks/razorpay")
      .set("Content-Type", "application/json")
      .set("x-razorpay-signature", validSignature)
      .send(rawBody);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");

    const updatedOrder = await orderRepository.findById(sampleOrder.id);
    expect(updatedOrder?.status).toBe("paid");
    expect(updatedOrder?.razorpayPaymentId).toBe("pay_wh_captured_999");
  });

  it("processes payment.failed event and updates order status to failed", async () => {
    const failedOrder = {
      ...sampleOrder,
      id: "ord_webhook_failed_2",
      razorpayOrderId: "order_rzp_failed_456",
    };
    await orderRepository.save(failedOrder);

    const eventPayload = {
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: "pay_wh_failed_000",
            order_id: failedOrder.razorpayOrderId,
            status: "failed",
          },
        },
      },
    };

    const rawBody = JSON.stringify(eventPayload);
    const validSignature = computeWebhookSignature(rawBody, webhookSecret);

    const res = await request(app)
      .post("/api/webhooks/razorpay")
      .set("Content-Type", "application/json")
      .set("x-razorpay-signature", validSignature)
      .send(rawBody);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");

    const updatedOrder = await orderRepository.findById(failedOrder.id);
    expect(updatedOrder?.status).toBe("failed");
  });
});
