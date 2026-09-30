import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { LayoutShell } from "./components/layout";
import { CheckoutPage } from "./pages/CheckoutPage/CheckoutPage";

const OrderSuccessPage = lazy(() =>
  import("./pages/OrderSuccessPage/OrderSuccessPage").then(m => ({
    default: m.OrderSuccessPage,
  })),
);

const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage/NotFoundPage").then(m => ({
    default: m.NotFoundPage,
  })),
);

const RouteLoadingFallback: React.FC = () => (
  <div
    style={{
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
    role="status"
    aria-live="polite"
  >
    <div
      style={{
        width: 36,
        height: 36,
        border: "3px solid var(--color-border)",
        borderRightColor: "var(--color-accent)",
        borderRadius: "50%",
        animation: "spin 0.65s linear infinite",
      }}
      aria-hidden="true"
    />
    <span className="sr-only">Loading page content...</span>
  </div>
);

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            <LayoutShell>
              <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>
                  <Route path="/" element={<CheckoutPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order/:id" element={<OrderSuccessPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </LayoutShell>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
