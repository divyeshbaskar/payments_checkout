import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { calculateQuote } from "../pricing/pricingEngine.js";

export const quoteSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1, "Product ID is required"),
      quantity: z
        .number()
        .int("Quantity must be an integer")
        .min(1, "Quantity must be at least 1")
        .max(10, "Quantity cannot exceed 10"),
    }),
  ),
  couponCode: z.string().trim().optional().nullable(),
});

export type QuoteInput = z.infer<typeof quoteSchema>;

export function createQuoteHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const validated = quoteSchema.parse(req.body);
    const quote = calculateQuote(validated.items, validated.couponCode);
    res.json(quote);
  } catch (err) {
    next(err);
  }
}
