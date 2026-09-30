import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { z } from "zod";
import { CartItem } from "../../types";

const CART_STORAGE_KEY = "meridian_cart_v1";

const cartStorageSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1).max(10),
    }),
  ),
  couponCode: z.string().nullable().optional(),
});

interface CartState {
  items: CartItem[];
  couponCode: string | null;
}

// Initial default items for previewing the store immediately
const DEFAULT_INITIAL_ITEMS: CartItem[] = [
  { productId: "prod_felt_mat", quantity: 1 },
  { productId: "prod_walnut_stand", quantity: 1 },
];

function loadPersistedCart(): CartState {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return { items: DEFAULT_INITIAL_ITEMS, couponCode: "WELCOME10" };
    }
    const parsedJson = JSON.parse(raw);
    const validated = cartStorageSchema.safeParse(parsedJson);
    if (validated.success) {
      return {
        items: validated.data.items,
        couponCode: validated.data.couponCode ?? null,
      };
    }
    // If corrupt, reset to default gracefully
    return { items: DEFAULT_INITIAL_ITEMS, couponCode: null };
  } catch {
    // If localStorage access throws or fails, return safe default
    return { items: DEFAULT_INITIAL_ITEMS, couponCode: null };
  }
}

function persistCart(state: CartState): void {
  try {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        items: state.items,
        couponCode: state.couponCode,
      }),
    );
  } catch {
    // Storage quota or restricted environment
  }
}

const initialState: CartState = loadPersistedCart();

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<{ productId: string; quantity?: number }>) => {
      const { productId, quantity = 1 } = action.payload;
      const existing = state.items.find(i => i.productId === productId);
      if (existing) {
        existing.quantity = Math.min(10, Math.max(1, existing.quantity + quantity));
      } else {
        state.items.push({
          productId,
          quantity: Math.min(10, Math.max(1, quantity)),
        });
      }
      persistCart(state);
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>,
    ) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find(i => i.productId === productId);
      if (item) {
        // Enforce integer 1 to 10
        item.quantity = Math.min(10, Math.max(1, Math.floor(quantity)));
      }
      persistCart(state);
    },
    incrementQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find(i => i.productId === action.payload);
      if (item && item.quantity < 10) {
        item.quantity += 1;
      }
      persistCart(state);
    },
    decrementQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find(i => i.productId === action.payload);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
      }
      persistCart(state);
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(i => i.productId !== action.payload);
      persistCart(state);
    },
    setCouponCode: (state, action: PayloadAction<string | null>) => {
      state.couponCode = action.payload ? action.payload.trim().toUpperCase() : null;
      persistCart(state);
    },
    removeCoupon: state => {
      state.couponCode = null;
      persistCart(state);
    },
    clearCart: state => {
      state.items = [];
      state.couponCode = null;
      persistCart(state);
    },
    resetToDefault: state => {
      state.items = DEFAULT_INITIAL_ITEMS;
      state.couponCode = "WELCOME10";
      persistCart(state);
    },
  },
});

export const {
  addItem,
  updateQuantity,
  incrementQuantity,
  decrementQuantity,
  removeItem,
  setCouponCode,
  removeCoupon,
  clearCart,
  resetToDefault,
} = cartSlice.actions;

export default cartSlice.reducer;
