import rateLimit from "express-rate-limit";

// Rate limiter for order creation: max 30 requests per 15 minutes per IP
export const orderRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many order requests from this IP. Please try again later.",
    },
  },
});

// Rate limiter for payment verification: max 40 requests per 15 minutes per IP
export const verifyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many verification attempts from this IP. Please try again later.",
    },
  },
});
