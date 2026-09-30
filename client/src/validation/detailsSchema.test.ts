import { describe, it, expect } from "vitest";
import { detailsSchema } from "./detailsSchema";

describe("Details Schema Validation", () => {
  const validData = {
    name: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    phone: "9876543210",
    line1: "Flat 402, Lotus Residency",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560038",
  };

  it("passes with valid Indian contact and address details", () => {
    const result = detailsSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  describe("Phone validation (10-digit Indian mobile starting with 6-9)", () => {
    it("accepts valid numbers starting with 6, 7, 8, or 9", () => {
      expect(detailsSchema.safeParse({ ...validData, phone: "6123456789" }).success).toBe(
        true,
      );
      expect(detailsSchema.safeParse({ ...validData, phone: "7987654321" }).success).toBe(
        true,
      );
      expect(detailsSchema.safeParse({ ...validData, phone: "8888888888" }).success).toBe(
        true,
      );
      expect(detailsSchema.safeParse({ ...validData, phone: "9999999999" }).success).toBe(
        true,
      );
    });

    it("rejects numbers starting with 0-5", () => {
      expect(detailsSchema.safeParse({ ...validData, phone: "5123456789" }).success).toBe(
        false,
      );
      expect(detailsSchema.safeParse({ ...validData, phone: "0987654321" }).success).toBe(
        false,
      );
      expect(detailsSchema.safeParse({ ...validData, phone: "1234567890" }).success).toBe(
        false,
      );
    });

    it("rejects numbers with fewer or more than 10 digits", () => {
      expect(detailsSchema.safeParse({ ...validData, phone: "987654321" }).success).toBe(
        false,
      );
      expect(
        detailsSchema.safeParse({ ...validData, phone: "98765432100" }).success,
      ).toBe(false);
      expect(detailsSchema.safeParse({ ...validData, phone: "98765abcde" }).success).toBe(
        false,
      );
    });
  });

  describe("PIN code validation (6-digit, cannot start with 0)", () => {
    it("accepts valid 6-digit PIN codes", () => {
      expect(detailsSchema.safeParse({ ...validData, pincode: "110001" }).success).toBe(
        true,
      );
      expect(detailsSchema.safeParse({ ...validData, pincode: "400001" }).success).toBe(
        true,
      );
      expect(detailsSchema.safeParse({ ...validData, pincode: "560038" }).success).toBe(
        true,
      );
    });

    it("rejects PIN code starting with 0", () => {
      const result = detailsSchema.safeParse({ ...validData, pincode: "010001" });
      expect(result.success).toBe(false);
    });

    it("rejects PIN codes that are not exactly 6 digits", () => {
      expect(detailsSchema.safeParse({ ...validData, pincode: "56003" }).success).toBe(
        false,
      );
      expect(detailsSchema.safeParse({ ...validData, pincode: "5600388" }).success).toBe(
        false,
      );
      expect(detailsSchema.safeParse({ ...validData, pincode: "ABCDEF" }).success).toBe(
        false,
      );
    });
  });

  describe("Email validation", () => {
    it("accepts valid email format", () => {
      expect(
        detailsSchema.safeParse({ ...validData, email: "user@domain.co.in" }).success,
      ).toBe(true);
    });

    it("rejects malformed email addresses", () => {
      expect(detailsSchema.safeParse({ ...validData, email: "notanemail" }).success).toBe(
        false,
      );
      expect(
        detailsSchema.safeParse({ ...validData, email: "@domain.com" }).success,
      ).toBe(false);
      expect(detailsSchema.safeParse({ ...validData, email: "user@" }).success).toBe(
        false,
      );
    });
  });

  describe("Address Line 1 validation", () => {
    it("rejects addresses shorter than 5 characters", () => {
      expect(detailsSchema.safeParse({ ...validData, line1: "Apt" }).success).toBe(false);
    });
  });
});
