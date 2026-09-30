import React from "react";
import { Header } from "../Header/Header";
import { Footer } from "../Footer/Footer";
import { TestModeBanner } from "../../common/TestModeBanner";
import styles from "./LayoutShell.module.scss";

export interface LayoutShellProps {
  children: React.ReactNode;
}

export const LayoutShell: React.FC<LayoutShellProps> = ({ children }) => {
  return (
    <div className={styles.shell}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <TestModeBanner />
      <Header />
      <main id="main-content" className={styles.mainContent}>
        {children}
      </main>
      <Footer />
    </div>
  );
};
