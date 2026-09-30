import React from "react";
import { Check } from "lucide-react";
import styles from "./Stepper.module.scss";

export interface StepItem {
  id: string;
  label: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStepIndex,
  onStepClick,
}) => {
  return (
    <nav className={styles.stepperNav} aria-label="Checkout Progress">
      <ol className={styles.stepList}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const isClickable = isCompleted && onStepClick;

          const itemClass = [
            styles.stepItem,
            isActive ? styles.isActive : "",
            isCompleted ? styles.isCompleted : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <li
              key={step.id}
              className={itemClass}
              aria-current={isActive ? "step" : undefined}
            >
              <button
                type="button"
                className={styles.stepButton}
                disabled={!isClickable && !isActive}
                onClick={() => {
                  if (isClickable) {
                    onStepClick(index);
                  }
                }}
                aria-label={`Step ${index + 1}: ${step.label}${
                  isCompleted ? " (Completed)" : isActive ? " (Current)" : ""
                }`}
              >
                <div className={styles.stepCircle} aria-hidden="true">
                  {isCompleted ? <Check size={16} strokeWidth={2.5} /> : index + 1}
                </div>
                <span className={styles.stepLabel}>{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
