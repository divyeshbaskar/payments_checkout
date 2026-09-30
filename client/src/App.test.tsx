import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App & LayoutShell", () => {
  it("renders page title and stepper", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /Meridian Checkout/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Checkout Progress")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByLabelText("Test Mode Notice")).toBeInTheDocument();
  });
});
