import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { calculateQuote } from "../pricing/pricingEngine.js";
import { orderRepository } from "../repository/orderRepository.js";
import { razorpayClient } from "../services/razorpayClient.js";
import { verifyPaymentSignature } from "../services/paymentVerification.js";
import { InternalOrder, OrderStatus } from "../types/index.js";

// Validation schema for creating an order
export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
        quantity: z
          .number()
          .int("Quantity must be an integer")
          .min(1, "Quantity must be at least 1")
          .max(10, "Quantity cannot exceed 10"),
      }),
    )
    .min(1, "Cart cannot be empty"),
  couponCode: z.string().trim().optional().nullable(),
  expectedTotal: z
    .number()
    .int("Expected total must be an integer paise amount")
    .positive("Expected total must be positive"),
  customer: z.object({
    name: z.string().trim().min(2, "Customer name must be at least 2 characters"),
    email: z.string().trim().email("Customer email must be a valid email address"),
    phone: z
      .string()
      .trim()
      .regex(
        /^[6-9]\d{9}$/,
        "Phone must be a 10-digit Indian mobile number starting with 6-9",
      ),
  }),
  shippingAddress: z.object({
    line1: z.string().trim().min(5, "Address line 1 must be at least 5 characters"),
    line2: z.string().trim().optional(),
    city: z.string().trim().min(2, "City is required"),
    state: z.string().trim().min(1, "State is required"),
    pincode: z
      .string()
      .trim()
      .regex(
        /^[1-9]\d{5}$/,
        "Pincode must be a 6-digit Indian PIN (cannot start with 0)",
      ),
  }),
});

// Validation schema for payment verification
export const verifyPaymentSchema = z.object({
  internalOrderId: z.string().min(1, "internalOrderId is required"),
  razorpay_order_id: z.string().min(1, "razorpay_order_id is required"),
  razorpay_payment_id: z.string().min(1, "razorpay_payment_id is required"),
  razorpay_signature: z.string().min(1, "razorpay_signature is required"),
});

// In-memory idempotency cache for order creation
const idempotencyStore = new Map<
  string,
  {
    response: {
      internalOrderId: string;
      razorpayOrderId: string;
      amount: number;
      currency: "INR";
      keyId: string;
    };
    timestamp: number;
  }
>();

export async function createOrderHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

    if (idempotencyKey && idempotencyStore.has(idempotencyKey)) {
      const cached = idempotencyStore.get(idempotencyKey);
      if (cached) {
        res.json(cached.response);
        return;
      }
    }

    const payload = createOrderSchema.parse(req.body);

    // Recompute quote server-side strictly from our own product catalog
    const quote = calculateQuote(payload.items, payload.couponCode);

    // If recomputed total differs from what client sent, reject with 409
    if (quote.totalPaise !== payload.expectedTotal) {
      res.status(409).json({
        error: {
          code: "PRICE_MISMATCH",
          message:
            "Prices or coupon eligibility have updated. Please review the updated order quote before proceeding.",
          freshQuote: quote,
        },
      });
      return;
    }

    const internalOrderId = `ord_${crypto.randomUUID()}`;
    const timestampStr = Date.now().toString(36);
    const randomHex = crypto.randomBytes(4).toString("hex");
    // Receipt length must be at most 40 characters
    const receipt = `rcpt_${timestampStr}_${randomHex}`.slice(0, 40);

    // Create Razorpay Order via official client
    // Note: notes contains ONLY internalOrderId, never personal data
    const razorpayOrder = await razorpayClient.orders.create({
      amount: quote.totalPaise,
      currency: "INR",
      receipt,
      notes: {
        internalOrderId,
      },
    });

    const now = new Date().toISOString();
    const internalOrder: InternalOrder = {
      id: internalOrderId,
      receipt,
      razorpayOrderId: razorpayOrder.id,
      amountPaise: quote.totalPaise,
      currency: "INR",
      status: "created",
      customer: payload.customer,
      shippingAddress: payload.shippingAddress,
      quote,
      createdAt: now,
      updatedAt: now,
    };

    await orderRepository.save(internalOrder);

    const responsePayload = {
      internalOrderId,
      razorpayOrderId: razorpayOrder.id,
      amount: quote.totalPaise,
      currency: "INR" as const,
      keyId: env.RAZORPAY_KEY_ID, // Only public key reaches the client
    };

    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, {
        response: responsePayload,
        timestamp: Date.now(),
      });
    }

    res.status(201).json(responsePayload);
  } catch (err) {
    next(err);
  }
}

export async function verifyPaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = verifyPaymentSchema.parse(req.body);

    const order = await orderRepository.findById(payload.internalOrderId);
    if (!order) {
      res.status(404).json({
        error: {
          code: "ORDER_NOT_FOUND",
          message: "Order with the specified ID was not found.",
        },
      });
      return;
    }

    // Verify razorpay_order_id matches the one stored on the order
    if (order.razorpayOrderId !== payload.razorpay_order_id) {
      res.status(400).json({
        error: {
          code: "ORDER_MISMATCH",
          message: "The provided razorpay_order_id does not match the stored order.",
        },
      });
      return;
    }

    // Idempotent success if already marked paid with same payment id
    if (
      order.status === "paid" &&
      order.razorpayPaymentId === payload.razorpay_payment_id
    ) {
      res.json({
        verified: true,
        internalOrderId: order.id,
        razorpayPaymentId: payload.razorpay_payment_id,
        status: "paid",
        message: "Payment was previously verified and captured.",
      });
      return;
    }

    // Cryptographic signature verification using timingSafeEqual
    const isValid = verifyPaymentSignature({
      razorpayOrderId: payload.razorpay_order_id,
      razorpayPaymentId: payload.razorpay_payment_id,
      razorpaySignature: payload.razorpay_signature,
      keySecret: env.RAZORPAY_KEY_SECRET,
    });

    if (!isValid) {
      res.status(400).json({
        error: {
          code: "PAYMENT_VERIFICATION_FAILED",
          message: "Cryptographic payment signature mismatch. Payment not verified.",
        },
      });
      return;
    }

    // Update order status to "paid"
    await orderRepository.updateStatus(order.id, "paid", payload.razorpay_payment_id);

    res.json({
      verified: true,
      internalOrderId: order.id,
      razorpayPaymentId: payload.razorpay_payment_id,
      status: "paid" as OrderStatus,
      message: "Payment successfully verified and order marked paid.",
    });
  } catch (err) {
    next(err);
  }
}

export async function getOrderHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orderId = req.params["id"];
    if (!orderId) {
      res.status(400).json({
        error: {
          code: "MISSING_ORDER_ID",
          message: "Order ID path parameter is required.",
        },
      });
      return;
    }

    const order = await orderRepository.findById(orderId);
    if (!order) {
      res.status(404).json({
        error: {
          code: "ORDER_NOT_FOUND",
          message: "Order not found.",
        },
      });
      return;
    }

    // Return sanitized summary for confirmation & receipt display
    res.json({
      order: {
        id: order.id,
        receipt: order.receipt,
        amountPaise: order.amountPaise,
        currency: order.currency,
        status: order.status,
        customer: {
          name: order.customer.name,
          email: order.customer.email,
        },
        shippingAddress: order.shippingAddress,
        quote: order.quote,
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: order.razorpayPaymentId,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}
