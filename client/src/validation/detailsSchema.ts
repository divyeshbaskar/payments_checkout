import { z } from "zod";

export const detailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(80, "Full name cannot exceed 80 characters")
    .regex(/^[a-zA-Z\s.'-]+$/, "Please enter a valid full name"),
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Please enter a valid email address (e.g. name@example.com)"),
  phone: z
    .string()
    .trim()
    .regex(
      /^[6-9]\d{9}$/,
      "Please enter a valid 10-digit Indian mobile number starting with 6-9",
    ),
  line1: z
    .string()
    .trim()
    .min(5, "Address line 1 must be at least 5 characters")
    .max(120, "Address line 1 cannot exceed 120 characters"),
  line2: z
    .string()
    .trim()
    .max(120, "Address line 2 cannot exceed 120 characters")
    .optional(),
  city: z
    .string()
    .trim()
    .min(2, "City name must be at least 2 characters")
    .max(50, "City cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s.'-]+$/, "Please enter a valid city name"),
  state: z.string().trim().min(1, "Please select your state or union territory"),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, "Please enter a valid 6-digit PIN code (cannot start with 0)"),
});

export type DetailsFormData = z.infer<typeof detailsSchema>;
