import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { PricingError } from "../pricing/pricingEngine.js";

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction,
): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: err.issues.map(i => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
    });
    return;
  }

  if (err instanceof PricingError) {
    res.status(400).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Fallback for unexpected errors (never leak stack trace or internal details)
  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred. Please try again later.",
    },
  });
};
