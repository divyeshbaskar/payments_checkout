import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { meridianApi } from "./api/meridianApi";
import cartReducer from "./slices/cartSlice";
import checkoutReducer from "./slices/checkoutSlice";
import paymentReducer from "./slices/paymentSlice";

export const store = configureStore({
  reducer: {
    [meridianApi.reducerPath]: meridianApi.reducer,
    cart: cartReducer,
    checkout: checkoutReducer,
    payment: paymentReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(meridianApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
