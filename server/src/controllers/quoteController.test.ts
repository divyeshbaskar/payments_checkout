import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../index.js";

describe("Catalog & Quote API Integration", () => {
  describe("GET /api/products", () => {
    it("returns seeded products list", async () => {
      const res = await request(app).get("/api/products");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBe(6);

      const firstProduct = res.body.products[0];
      expect(firstProduct).toHaveProperty("id");
      expect(firstProduct).toHaveProperty("name");
      expect(firstProduct).toHaveProperty("pricePaise");
      expect(firstProduct.pricePaise).toBeGreaterThanOrEqual(49900);
      expect(firstProduct.pricePaise).toBeLessThanOrEqual(1499900);
    });
  });

  describe("POST /api/quote", () => {
    it("calculates accurate quote for valid items", async () => {
      const res = await request(app)
        .post("/api/quote")
        .send({
          items: [{ productId: "prod_felt_mat", quantity: 1 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.subtotalPaise).toBe(349900);
      expect(res.body.totalPaise).toBe(349900);
      expect(res.body.shippingPaise).toBe(0); // >= 99900 is free shipping
      expect(res.body.taxNote).toBe("Inclusive of all taxes");
      expect(res.body.items).toHaveLength(1);
    });

    it("evaluates WELCOME10 coupon correctly", async () => {
      const res = await request(app)
        .post("/api/quote")
        .send({
          items: [{ productId: "prod_felt_mat", quantity: 1 }],
          couponCode: "WELCOME10",
        });

      expect(res.status).toBe(200);
      expect(res.body.coupon.applied).toBe(true);
      expect(res.body.discountPaise).toBe(34990); // 10% of 349900
      expect(res.body.totalPaise).toBe(349900 - 34990);
    });

    it("returns 400 VALIDATION_ERROR when quantity exceeds 10", async () => {
      const res = await request(app)
        .post("/api/quote")
        .send({
          items: [{ productId: "prod_felt_mat", quantity: 15 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 VALIDATION_ERROR when quantity is less than 1", async () => {
      const res = await request(app)
        .post("/api/quote")
        .send({
          items: [{ productId: "prod_felt_mat", quantity: 0 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 PRODUCT_NOT_FOUND when product id does not exist", async () => {
      const res = await request(app)
        .post("/api/quote")
        .send({
          items: [{ productId: "non_existent_product", quantity: 1 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("PRODUCT_NOT_FOUND");
    });
  });
});
