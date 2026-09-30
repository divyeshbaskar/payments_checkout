import { describe, it, expect, beforeEach } from "vitest";
import cartReducer, {
  addItem,
  updateQuantity,
  incrementQuantity,
  decrementQuantity,
  removeItem,
  setCouponCode,
  removeCoupon,
  clearCart,
} from "./cartSlice";

describe("Cart Slice Reducer", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const emptyState = { items: [], couponCode: null };

  it("adds an item to an empty cart", () => {
    const nextState = cartReducer(
      emptyState,
      addItem({ productId: "prod_felt_mat", quantity: 1 }),
    );
    expect(nextState.items).toHaveLength(1);
    expect(nextState.items[0]).toEqual({ productId: "prod_felt_mat", quantity: 1 });
  });

  it("clamps quantity between 1 and 10 on updateQuantity", () => {
    let state = cartReducer(
      emptyState,
      addItem({ productId: "prod_felt_mat", quantity: 1 }),
    );
    // Try setting to 15 -> should clamp to 10
    state = cartReducer(
      state,
      updateQuantity({ productId: "prod_felt_mat", quantity: 15 }),
    );
    expect(state.items[0]?.quantity).toBe(10);

    // Try setting to 0 -> should clamp to 1
    state = cartReducer(
      state,
      updateQuantity({ productId: "prod_felt_mat", quantity: 0 }),
    );
    expect(state.items[0]?.quantity).toBe(1);

    // Try setting to -5 -> should clamp to 1
    state = cartReducer(
      state,
      updateQuantity({ productId: "prod_felt_mat", quantity: -5 }),
    );
    expect(state.items[0]?.quantity).toBe(1);
  });

  it("incrementQuantity stops at 10", () => {
    let state = {
      items: [{ productId: "prod_felt_mat", quantity: 9 }],
      couponCode: null as string | null,
    };
    state = cartReducer(state, incrementQuantity("prod_felt_mat"));
    expect(state.items[0]?.quantity).toBe(10);

    // Increment again -> stays at 10
    state = cartReducer(state, incrementQuantity("prod_felt_mat"));
    expect(state.items[0]?.quantity).toBe(10);
  });

  it("decrementQuantity stops at 1", () => {
    let state = {
      items: [{ productId: "prod_felt_mat", quantity: 2 }],
      couponCode: null as string | null,
    };
    state = cartReducer(state, decrementQuantity("prod_felt_mat"));
    expect(state.items[0]?.quantity).toBe(1);

    // Decrement again -> stays at 1
    state = cartReducer(state, decrementQuantity("prod_felt_mat"));
    expect(state.items[0]?.quantity).toBe(1);
  });

  it("removes item from cart", () => {
    let state = {
      items: [
        { productId: "prod_felt_mat", quantity: 1 },
        { productId: "prod_walnut_stand", quantity: 2 },
      ],
      couponCode: null as string | null,
    };
    state = cartReducer(state, removeItem("prod_felt_mat"));
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.productId).toBe("prod_walnut_stand");
  });

  it("sets, normalizes and removes coupon code", () => {
    let state = cartReducer(emptyState, setCouponCode("welcome10"));
    expect(state.couponCode).toBe("WELCOME10");

    state = cartReducer(state, removeCoupon());
    expect(state.couponCode).toBeNull();
  });

  it("clears cart completely", () => {
    const state = cartReducer(
      { items: [{ productId: "prod_felt_mat", quantity: 2 }], couponCode: "FLAT200" },
      clearCart(),
    );
    expect(state.items).toHaveLength(0);
    expect(state.couponCode).toBeNull();
  });
});
