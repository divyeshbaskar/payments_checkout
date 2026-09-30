import React, { forwardRef, useId } from "react";
import styles from "./Input.module.scss";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  required?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { id: customId, label, error, helperText, options, required, className, ...rest },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = customId || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const describedBy = [error ? errorId : null, helperText ? helperId : null]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={styles.fieldGroup}>
        {label && (
          <div className={styles.labelWrapper}>
            <label htmlFor={selectId} className={styles.label}>
              {label}
              {required && (
                <span className={styles.requiredStar} aria-hidden="true">
                  *
                </span>
              )}
            </label>
          </div>
        )}
        <div className={styles.selectWrapper}>
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            aria-describedby={describedBy || undefined}
            required={required}
            className={[styles.select, error ? styles.hasError : "", className ?? ""]
              .filter(Boolean)
              .join(" ")}
            {...rest}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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

Select.displayName = "Select";
