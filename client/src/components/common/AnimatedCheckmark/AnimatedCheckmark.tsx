import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import styles from "./AnimatedCheckmark.module.scss";

export const AnimatedCheckmark: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const circleVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.45,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const checkVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.35,
        delay: shouldReduceMotion ? 0 : 0.2,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <div className={styles.checkmarkWrapper} aria-hidden="true">
      <svg viewBox="0 0 72 72" fill="none">
        <motion.circle
          cx="36"
          cy="36"
          r="32"
          stroke="var(--color-success)"
          strokeWidth="3.5"
          variants={circleVariants}
          initial="hidden"
          animate="visible"
        />
        <motion.path
          d="M23 37L32 46L49 26"
          stroke="var(--color-success)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={checkVariants}
          initial="hidden"
          animate="visible"
        />
      </svg>
    </div>
  );
};
