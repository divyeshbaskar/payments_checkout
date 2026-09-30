import "@testing-library/jest-dom/vitest";

// Ensure Node.js 22+ undici globals align with jsdom environment
if (typeof window !== "undefined" && typeof globalThis.fetch !== "undefined") {
  // Silence unhandled fetch base query abort in headless test runner if api server is not running
}
