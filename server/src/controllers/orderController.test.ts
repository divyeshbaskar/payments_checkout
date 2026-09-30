import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import { app } from "../index.js";
import { razorpayClient } from "../services/razorpayClient.js";
import { env } from "../config/env.js";

describe("Order & Payment Verification API Integration", () => {
  const validOrderPayload = {
    items: [{ productId: "prod_felt_mat", quantity: 1 }],
    couponCode: "WELCOME10",
    // prod_felt_mat: 349900, 10% discount: 34990, total: 314910 paise
    expectedTotal: 314910,
    customer: {
      name: "Rohit Verma",
      email: "rohit.verma@example.com",
      phone: "9876543210",
    },
    shippingAddress: {
      line1: "12, Green Glen Layout, Bellandur",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560103",
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /api/orders", () => {
    it("creates order with mocked Razorpay client and returns 201 with public key only", async () => {
      const mockRazorpayCreate = vi
        .spyOn(razorpayClient.orders, "create")
        .mockResolvedValueOnce({
          id: "order_rzp_mock_12345",
          amount: 314910,
          currency: "INR",
          receipt: "rcpt_mock_123",
          status: "created",
        } as never);

      const res = await request(app).post("/api/orders").send(validOrderPayload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("internalOrderId");
      expect(res.body.razorpayOrderId).toBe("order_rzp_mock_12345");
      expect(res.body.amount).toBe(314910);
      expect(res.body.currency).toBe("INR");
      expect(res.body.keyId).toBe(env.RAZORPAY_KEY_ID);
      // Ensure key secret is never present in response
      expect(res.body).not.toHaveProperty("keySecret");
      expect(res.body).not.toHaveProperty("RAZORPAY_KEY_SECRET");

      expect(mockRazorpayCreate).toHaveBeenCalledTimes(1);
    });

    it("returns 409 Conflict when expectedTotal does not match server recomputed quote", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({
          ...validOrderPayload,
          expectedTotal: 100000, // Tampered or stale total
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("PRICE_MISMATCH");
      expect(res.body.error.freshQuote).toBeDefined();
      expect(res.body.error.freshQuote.totalPaise).toBe(314910);
    });

    it("supports Idempotency-Key and avoids duplicate orders", async () => {
      const mockRazorpayCreate = vi
        .spyOn(razorpayClient.orders, "create")
        .mockResolvedValue({
          id: "order_rzp_mock_idempotent",
          amount: 314910,
          currency: "INR",
          receipt: "rcpt_idempotent",
          status: "created",
        } as never);

      const idempotencyKey = `key_${Date.now()}_${Math.random()}`;

      // First call
      const res1 = await request(app)
        .post("/api/orders")
        .set("Idempotency-Key", idempotencyKey)
        .send(validOrderPayload);

      expect(res1.status).toBe(201);

      // Duplicate retry call with same idempotency key
      const res2 = await request(app)
        .post("/api/orders")
        .set("Idempotency-Key", idempotencyKey)
        .send(validOrderPayload);

      expect(res2.status).toBe(200);
      expect(res2.body.internalOrderId).toBe(res1.body.internalOrderId);
      expect(res2.body.razorpayOrderId).toBe(res1.body.razorpayOrderId);

      // Razorpay create was called only once despite duplicate request
      expect(mockRazorpayCreate).toHaveBeenCalledTimes(1);
    });

    it("returns 400 VALIDATION_ERROR on invalid customer phone", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({
          ...validOrderPayload,
          customer: {
            ...validOrderPayload.customer,
            phone: "12345", // invalid Indian mobile
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/payments/verify", () => {
    it("successfully verifies valid signature and marks order paid", async () => {
      // 1. Create order
      vi.spyOn(razorpayClient.orders, "create").mockResolvedValueOnce({
        id: "order_rzp_for_verification",
        amount: 314910,
        currency: "INR",
        receipt: "rcpt_verify_1",
        status: "created",
      } as never);

      const orderRes = await request(app).post("/api/orders").send(validOrderPayload);

      const { internalOrderId, razorpayOrderId } = orderRes.body;
      const razorpayPaymentId = "pay_mock_test_998877";

      // 2. Compute valid signature using local secret
      const validSignature = crypto
        .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      // 3. Verify
      const verifyRes = await request(app).post("/api/payments/verify").send({
        internalOrderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: validSignature,
      });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.verified).toBe(true);
      expect(verifyRes.body.status).toBe("paid");

      // 4. Test idempotency (calling verify again on already paid order)
      const verifyAgainRes = await request(app).post("/api/payments/verify").send({
        internalOrderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: validSignature,
      });

      expect(verifyAgainRes.status).toBe(200);
      expect(verifyAgainRes.body.status).toBe("paid");
    });

    it("rejects tampered signature and leaves order unpaid", async () => {
      // 1. Create order
      vi.spyOn(razorpayClient.orders, "create").mockResolvedValueOnce({
        id: "order_rzp_for_tamper_test",
        amount: 314910,
        currency: "INR",
        receipt: "rcpt_tamper_1",
        status: "created",
      } as never);

      const orderRes = await request(app).post("/api/orders").send(validOrderPayload);

      const { internalOrderId, razorpayOrderId } = orderRes.body;
      const razorpayPaymentId = "pay_mock_test_112233";

      // Invalid/tampered signature
      const tamperedSignature =
        "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

      const verifyRes = await request(app).post("/api/payments/verify").send({
        internalOrderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: tamperedSignature,
      });

      expect(verifyRes.status).toBe(400);
      expect(verifyRes.body.error.code).toBe("PAYMENT_VERIFICATION_FAILED");

      // Confirm order remains unpaid in repository
      const checkRes = await request(app).get(`/api/orders/${internalOrderId}`);
      expect(checkRes.body.order.status).toBe("created");
    });
  });

  describe("GET /api/orders/:id", () => {
    it("returns order summary for valid ID", async () => {
      vi.spyOn(razorpayClient.orders, "create").mockResolvedValueOnce({
        id: "order_rzp_lookup_test",
        amount: 314910,
        currency: "INR",
        receipt: "rcpt_lookup_1",
        status: "created",
      } as never);

      const orderRes = await request(app).post("/api/orders").send(validOrderPayload);

      const res = await request(app).get(`/api/orders/${orderRes.body.internalOrderId}`);
      expect(res.status).toBe(200);
      expect(res.body.order.id).toBe(orderRes.body.internalOrderId);
      expect(res.body.order.amountPaise).toBe(314910);
      expect(res.body.order.customer.email).toBe(validOrderPayload.customer.email);
    });

    it("returns 404 for unknown order ID", async () => {
      const res = await request(app).get("/api/orders/ord_non_existent_999");
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORDER_NOT_FOUND");
    });
  });
});
