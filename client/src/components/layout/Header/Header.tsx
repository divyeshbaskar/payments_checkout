import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Moon, Sun } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import styles from "./Header.module.scss";

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.brandLink} aria-label="Meridian Home">
          <div className={styles.logoMark} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 18V6L12 14L20 6V18"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className={styles.brandName}>Meridian</span>
          <span className={styles.brandTagline}>Workspace Essentials</span>
        </Link>

        <div className={styles.navActions}>
          <div className={styles.trustBadge}>
            <ShieldCheck size={16} color="var(--color-success)" aria-hidden="true" />
            <span>256-bit SSL Secure Checkout</span>
          </div>

          <button
            type="button"
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          >
            {theme === "light" ? (
              <Moon size={18} aria-hidden="true" />
            ) : (
              <Sun size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
