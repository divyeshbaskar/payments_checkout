import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { getProductsHandler } from "./controllers/catalogController.js";
import { createQuoteHandler } from "./controllers/quoteController.js";
import {
  createOrderHandler,
  verifyPaymentHandler,
  getOrderHandler,
} from "./controllers/orderController.js";
import { razorpayWebhookHandler } from "./controllers/webhookController.js";
import { orderRateLimiter, verifyRateLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (requestOrigin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!requestOrigin) return callback(null, true);
      if (
        requestOrigin === env.CLIENT_ORIGIN ||
        requestOrigin.endsWith(".vercel.app") ||
        process.env["NODE_ENV"] !== "production"
      ) {
        return callback(null, true);
      }
      return callback(null, env.CLIENT_ORIGIN);
    },
    credentials: true,
  }),
);

// Stretch Webhook: RAW body parser mounted specifically for Razorpay Webhook route
app.post(
  ["/api/webhooks/razorpay", "/webhooks/razorpay"],
  express.raw({ type: "application/json" }),
  razorpayWebhookHandler,
);

// Enforce standard JSON body limit for all standard API routes
app.use(express.json({ limit: "100kb" }));

// Health check
app.get(["/api/health", "/health"], (_req, res) => {
  res.json({
    status: "ok",
    service: "meridian-backend",
    timestamp: new Date().toISOString(),
  });
});

// Catalog routes
app.get(["/api/products", "/products"], getProductsHandler);

// Pricing and quote route
app.post(["/api/quote", "/quote"], createQuoteHandler);

// Order creation with rate limiter
app.post(["/api/orders", "/orders"], orderRateLimiter, createOrderHandler);

// Payment verification with rate limiter
app.post(
  ["/api/payments/verify", "/payments/verify"],
  verifyRateLimiter,
  verifyPaymentHandler,
);

// Order confirmation summary
app.get(["/api/orders/:id", "/orders/:id"], getOrderHandler);

// Centralized error handler
app.use(errorHandler);

if (process.env["NODE_ENV"] !== "test" && !process.env["VERCEL"]) {
  app.listen(env.PORT, () => {
    // Server running on configured port
  });
}

export default app;
