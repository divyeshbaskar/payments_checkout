import React, { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  CreditCard,
  Smartphone,
  Building,
  Copy,
  Check,
} from "lucide-react";
import styles from "./TestModeBanner.module.scss";

export const TestModeBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (isDismissed) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <aside className={styles.banner} aria-label="Test Mode Notice">
      <div className={styles.container}>
        <div className={styles.mainRow}>
          <div className={styles.badgeAndMessage}>
            <span className={styles.badge}>
              <AlertTriangle
                size={12}
                style={{ marginRight: 4, verticalAlign: "middle" }}
              />
              Test Mode
            </span>
            <span className={styles.message}>
              Simulator active. No real money or payment method is charged.
            </span>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setIsOpen(prev => !prev)}
              aria-expanded={isOpen}
              aria-controls="test-credentials-drawer"
            >
              <span>Test payment details</span>
              {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              type="button"
              className={styles.dismissButton}
              onClick={() => setIsDismissed(true)}
              aria-label="Dismiss test mode banner"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {isOpen && (
          <div id="test-credentials-drawer" className={styles.detailsDrawer}>
            <div className={styles.detailsGrid}>
              <div className={styles.detailCard}>
                <h4>
                  <CreditCard size={14} color="var(--color-accent)" />
                  Standard Test Card
                </h4>
                <p>Card number (valid test card):</p>
                <button
                  type="button"
                  className={styles.codeBadge}
                  onClick={() => copyToClipboard("4111111111111111", "card")}
                  aria-label="Copy card number 4111 1111 1111 1111"
                >
                  <span>4111 1111 1111 1111</span>
                  {copiedKey === "card" ? (
                    <Check size={12} color="var(--color-success)" />
                  ) : (
                    <Copy size={12} className={styles.copyIcon} />
                  )}
                </button>
                <p style={{ marginTop: 6 }}>
                  Expiry: Any future date (e.g. 12/28) &bull; CVV: Any 3 digits (e.g. 123)
                </p>
              </div>

              <div className={styles.detailCard}>
                <h4>
                  <Smartphone size={14} color="var(--color-accent)" />
                  UPI Test VPA
                </h4>
                <p>Success Virtual Address:</p>
                <button
                  type="button"
                  className={styles.codeBadge}
                  onClick={() => copyToClipboard("success@razorpay", "upi_success")}
                  aria-label="Copy success UPI address"
                >
                  <span>success@razorpay</span>
                  {copiedKey === "upi_success" ? (
                    <Check size={12} color="var(--color-success)" />
                  ) : (
                    <Copy size={12} className={styles.copyIcon} />
                  )}
                </button>
                <p style={{ marginTop: 6 }}>Failure VPA for testing failure states:</p>
                <button
                  type="button"
                  className={styles.codeBadge}
                  onClick={() => copyToClipboard("failure@razorpay", "upi_failure")}
                  aria-label="Copy failure UPI address"
                >
                  <span>failure@razorpay</span>
                  {copiedKey === "upi_failure" ? (
                    <Check size={12} color="var(--color-success)" />
                  ) : (
                    <Copy size={12} className={styles.copyIcon} />
                  )}
                </button>
              </div>

              <div className={styles.detailCard}>
                <h4>
                  <Building size={14} color="var(--color-accent)" />
                  Netbanking Test Flow
                </h4>
                <p>
                  Select any bank in Checkout. Razorpay will open an interactive mock bank
                  page with distinct &ldquo;Success&rdquo; and &ldquo;Failure&rdquo;
                  simulation buttons.
                </p>
              </div>

              <div className={styles.note}>
                <strong>Note on Razorpay Test Mode:</strong> In test mode a cancelled UPI
                payment may be recorded as successful by the simulator, so checkout
                cancellation is best tested using the card flow or by closing the modal
                using the top-right &times; icon.
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
