import React, { forwardRef, useId } from "react";
import styles from "./Input.module.scss";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id: customId,
      label,
      error,
      helperText,
      leftIcon,
      rightElement,
      required,
      className,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = customId || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedBy = [error ? errorId : null, helperText ? helperId : null]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={styles.fieldGroup}>
        {label && (
          <div className={styles.labelWrapper}>
            <label htmlFor={inputId} className={styles.label}>
              {label}
              {required && (
                <span className={styles.requiredStar} aria-hidden="true">
                  *
                </span>
              )}
            </label>
          </div>
        )}
        <div className={styles.inputWrapper}>
          {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={describedBy || undefined}
            required={required}
            className={[
              styles.input,
              error ? styles.hasError : "",
              leftIcon ? styles.hasLeftIcon : "",
              rightElement ? styles.hasRightElement : "",
              className ?? "",
            ]
              .filter(Boolean)
              .join(" ")}
            {...rest}
          />
          {rightElement && <div className={styles.rightElement}>{rightElement}</div>}
        </div>
        {error && (
          <div id={errorId} role="alert" className={styles.errorMessage}>
            {error}
          </div>
        )}
        {!error && helperText && (
          <div id={helperId} className={styles.helperText}>
            {helperText}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
