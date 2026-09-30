import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button component", () => {
  it("renders with label and handles click", async () => {
    let clicked = false;
    render(<Button onClick={() => (clicked = true)}>Pay Now</Button>);
    const button = screen.getByRole("button", { name: "Pay Now" });
    expect(button).toBeInTheDocument();
    await userEvent.click(button);
    expect(clicked).toBe(true);
  });

  it("disables button when loading and shows spinner", () => {
    render(
      <Button isLoading loadingText="Processing...">
        Pay Now
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Processing..." });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
