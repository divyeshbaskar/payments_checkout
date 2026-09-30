import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CustomerDetails, ShippingAddress, QuoteResult } from "../../types";

const DETAILS_STORAGE_KEY = "meridian_details_v1";

interface CheckoutState {
  currentStepIndex: number;
  customer: CustomerDetails;
  shippingAddress: ShippingAddress;
  currentQuote: QuoteResult | null;
  isQuoting: boolean;
}

const DEFAULT_CUSTOMER: CustomerDetails = {
  name: "Arjun Mehta",
  email: "arjun.mehta@example.com",
  phone: "9876543210",
};

const DEFAULT_ADDRESS: ShippingAddress = {
  line1: "42, Horizon Heights, Indiranagar",
  line2: "100 Feet Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560038",
};

function loadPersistedDetails(): {
  customer: CustomerDetails;
  shippingAddress: ShippingAddress;
} {
  try {
    const raw = localStorage.getItem(DETAILS_STORAGE_KEY);
    if (!raw) return { customer: DEFAULT_CUSTOMER, shippingAddress: DEFAULT_ADDRESS };
    const parsed = JSON.parse(raw);
    if (parsed && parsed.customer && parsed.shippingAddress) {
      return {
        customer: parsed.customer,
        shippingAddress: parsed.shippingAddress,
      };
    }
  } catch {
    // Storage unavailable
  }
  return { customer: DEFAULT_CUSTOMER, shippingAddress: DEFAULT_ADDRESS };
}

const persisted = loadPersistedDetails();

const initialState: CheckoutState = {
  currentStepIndex: 0,
  customer: persisted.customer,
  shippingAddress: persisted.shippingAddress,
  currentQuote: null,
  isQuoting: false,
};

export const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    setCurrentStepIndex: (state, action: PayloadAction<number>) => {
      state.currentStepIndex = Math.max(0, Math.min(2, action.payload));
    },
    setCustomerDetails: (state, action: PayloadAction<CustomerDetails>) => {
      state.customer = action.payload;
      try {
        localStorage.setItem(
          DETAILS_STORAGE_KEY,
          JSON.stringify({
            customer: state.customer,
            shippingAddress: state.shippingAddress,
          }),
        );
      } catch {
        // Storage fail
      }
    },
    setShippingAddress: (state, action: PayloadAction<ShippingAddress>) => {
      state.shippingAddress = action.payload;
      try {
        localStorage.setItem(
          DETAILS_STORAGE_KEY,
          JSON.stringify({
            customer: state.customer,
            shippingAddress: state.shippingAddress,
          }),
        );
      } catch {
        // Storage fail
      }
    },
    setFullDetails: (
      state,
      action: PayloadAction<{
        customer: CustomerDetails;
        shippingAddress: ShippingAddress;
      }>,
    ) => {
      state.customer = action.payload.customer;
      state.shippingAddress = action.payload.shippingAddress;
      try {
        localStorage.setItem(
          DETAILS_STORAGE_KEY,
          JSON.stringify({
            customer: state.customer,
            shippingAddress: state.shippingAddress,
          }),
        );
      } catch {
        // Storage fail
      }
    },
    setCurrentQuote: (state, action: PayloadAction<QuoteResult | null>) => {
      state.currentQuote = action.payload;
    },
    setIsQuoting: (state, action: PayloadAction<boolean>) => {
      state.isQuoting = action.payload;
    },
  },
});

export const {
  setCurrentStepIndex,
  setCustomerDetails,
  setShippingAddress,
  setFullDetails,
  setCurrentQuote,
  setIsQuoting,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
