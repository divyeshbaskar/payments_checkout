import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();
// In monorepo root or serverless cwd, also attempt to load from server/.env if present
try {
  dotenv.config({ path: "server/.env" });
} catch {
  // Ignore if path not found
}

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required and must not be empty"),
  RAZORPAY_KEY_SECRET: z
    .string()
    .min(1, "RAZORPAY_KEY_SECRET is required and must not be empty"),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadEnv(): EnvConfig {
  const isTestOrVercel =
    process.env["NODE_ENV"] === "test" || Boolean(process.env["VERCEL"]);

  // If in test mode or on Vercel without configured credentials yet, provide safe dummy test credentials
  const rawEnv = {
    PORT: process.env["PORT"] ?? (process.env["NODE_ENV"] === "test" ? 5001 : undefined),
    CLIENT_ORIGIN: process.env["CLIENT_ORIGIN"] ?? "http://localhost:5173",
    RAZORPAY_KEY_ID:
      process.env["RAZORPAY_KEY_ID"] ??
      (isTestOrVercel ? "rzp_test_dummy_key_id" : undefined),
    RAZORPAY_KEY_SECRET:
      process.env["RAZORPAY_KEY_SECRET"] ??
      (isTestOrVercel ? "dummy_razorpay_secret_do_not_commit" : undefined),
    RAZORPAY_WEBHOOK_SECRET: process.env["RAZORPAY_WEBHOOK_SECRET"],
    NODE_ENV: process.env["NODE_ENV"] ?? "development",
  };

  const parsed = envSchema.safeParse(rawEnv);

  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map(issue => ` - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `[FATAL] Server environment validation failed:\n${errorDetails}\n` +
        `Please check your .env file or refer to server/.env.example.`,
    );
  }

  return parsed.data;
}

export const env = loadEnv();
