import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "./index.js";

describe("GET /api/health", () => {
  it("returns status ok and timestamp", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("meridian-backend");
    expect(res.body.timestamp).toBeDefined();
  });
});
