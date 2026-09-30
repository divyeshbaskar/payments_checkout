import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { NotFoundPage } from "./NotFoundPage";

describe("NotFoundPage", () => {
  it("renders 404 code and navigation link", () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Page Not Found", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Back to Meridian Checkout/i }),
    ).toBeInTheDocument();
  });
});
