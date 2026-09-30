import React from "react";
import styles from "./Card.module.scss";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "subtle";
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  noPadding = false,
  className,
  ...rest
}) => {
  const classNames = [
    styles.card,
    variant === "elevated" ? styles.elevated : variant === "subtle" ? styles.subtle : "",
    noPadding ? styles.noPadding : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
};
