import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import checkoutReducer from "../../../../store/slices/checkoutSlice";
import cartReducer from "../../../../store/slices/cartSlice";
import { DetailsStep } from "./DetailsStep";

function renderWithStore(ui: React.ReactElement) {
  const testStore = configureStore({
    reducer: {
      checkout: checkoutReducer,
      cart: cartReducer,
    },
  });

  return render(<Provider store={testStore}>{ui}</Provider>);
}

describe("DetailsStep Component", () => {
  it("renders form fields with accessible labels and buttons", () => {
    renderWithStore(<DetailsStep onBack={vi.fn()} onNextStep={vi.fn()} />);

    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mobile Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Address Line 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/State/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/PIN Code/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Continue to Payment/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Back to Bag/i })).toBeInTheDocument();
  });

  it("shows validation error on invalid phone input on blur", async () => {
    const user = userEvent.setup();
    renderWithStore(<DetailsStep onBack={vi.fn()} onNextStep={vi.fn()} />);

    const phoneInput = screen.getByLabelText(/Mobile Number/i);
    await user.clear(phoneInput);
    await user.type(phoneInput, "12345");
    await user.tab(); // trigger blur

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /10-digit Indian mobile number/i,
      );
    });
  });

  it("advances to next step when form is valid and submitted", async () => {
    const user = userEvent.setup();
    const handleNext = vi.fn();
    renderWithStore(<DetailsStep onBack={vi.fn()} onNextStep={handleNext} />);

    const submitBtn = screen.getByRole("button", { name: /Continue to Payment/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(handleNext).toHaveBeenCalledTimes(1);
    });
  });
});
