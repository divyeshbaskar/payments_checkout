import React from "react";
import { Lock, Shield, RefreshCw } from "lucide-react";
import styles from "./Footer.module.scss";

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topRow}>
          <div className={styles.securityList}>
            <div className={styles.securityItem}>
              <Lock size={15} color="var(--color-accent)" aria-hidden="true" />
              <span>Payments processed securely by Razorpay</span>
            </div>
            <div className={styles.securityItem}>
              <Shield size={15} color="var(--color-accent)" aria-hidden="true" />
              <span>End-to-End Cryptographic Verification</span>
            </div>
            <div className={styles.securityItem}>
              <RefreshCw size={15} color="var(--color-accent)" aria-hidden="true" />
              <span>30-Day Hassle-Free Returns</span>
            </div>
          </div>
        </div>

        <div className={styles.bottomRow}>
          <div>
            &copy; {new Date().getFullYear()} Meridian Accessories Inc. All rights
            reserved.
          </div>
          <div className={styles.links}>
            <span>Test Mode Simulation Environment</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
