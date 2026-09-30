import React from "react";
import styles from "./ProductTile.module.scss";

export interface ProductTileProps {
  visualType:
    | "felt_mat"
    | "walnut_stand"
    | "aluminum_shelf"
    | "brass_anchor"
    | "orbit_lamp"
    | "charging_dock";
  name: string;
}

export const ProductTile: React.FC<ProductTileProps> = ({ visualType, name }) => {
  const renderVisual = () => {
    switch (visualType) {
      case "felt_mat":
        return (
          <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
            <rect width="80" height="80" fill="#3B3F48" />
            <rect
              x="8"
              y="16"
              width="64"
              height="48"
              rx="4"
              fill="#525866"
              stroke="#687082"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <circle cx="20" cy="28" r="3" fill="#D97706" opacity="0.8" />
            <line
              x1="16"
              y1="52"
              x2="48"
              y2="52"
              stroke="#798296"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        );

      case "walnut_stand":
        return (
          <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
            <rect width="80" height="80" fill="#2E1F16" />
            <rect
              x="12"
              y="24"
              width="56"
              height="32"
              rx="3"
              fill="#4A3425"
              stroke="#78553D"
              strokeWidth="1"
            />
            <path d="M16 32Q40 38 64 32" stroke="#634531" strokeWidth="1.5" />
            <path d="M16 42Q40 48 64 42" stroke="#634531" strokeWidth="1.5" />
            <rect x="28" y="50" width="24" height="3" rx="1.5" fill="#D4AF37" />
          </svg>
        );

      case "aluminum_shelf":
        return (
          <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
            <rect width="80" height="80" fill="#1E232E" />
            <rect x="10" y="28" width="60" height="14" rx="2" fill="#8C94A6" />
            <rect x="12" y="42" width="10" height="18" fill="#5E6678" />
            <rect x="58" y="42" width="10" height="18" fill="#5E6678" />
            <line x1="10" y1="35" x2="70" y2="35" stroke="#C2CAD6" strokeWidth="1" />
          </svg>
        );

      case "brass_anchor":
        return (
          <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
            <rect width="80" height="80" fill="#1C1B18" />
            <circle
              cx="40"
              cy="40"
              r="24"
              fill="#C59B27"
              stroke="#E5B942"
              strokeWidth="1.5"
            />
            <circle cx="40" cy="40" r="16" fill="#997519" />
            <rect x="36" y="16" width="8" height="48" rx="4" fill="#1C1B18" />
            <circle cx="40" cy="40" r="4" fill="#E5B942" />
          </svg>
        );

      case "orbit_lamp":
        return (
          <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
            <rect width="80" height="80" fill="#11141C" />
            <circle cx="40" cy="36" r="18" stroke="#3F51F5" strokeWidth="3" />
            <circle cx="40" cy="36" r="14" fill="#F4F5FF" opacity="0.1" />
            <path
              d="M40 54V66H30H50"
              stroke="#8E95A5"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="40" cy="36" r="4" fill="#F59E0B" />
          </svg>
        );

      case "charging_dock":
        return (
          <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
            <rect width="80" height="80" fill="#171A21" />
            <rect
              x="12"
              y="24"
              width="56"
              height="36"
              rx="8"
              fill="#282C37"
              stroke="#3D4353"
              strokeWidth="1.5"
            />
            <circle
              cx="26"
              cy="42"
              r="8"
              stroke="#3F51F5"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            <circle cx="44" cy="42" r="6" stroke="#0F9D6B" strokeWidth="1.5" />
            <circle cx="58" cy="42" r="4" stroke="#8E95A5" strokeWidth="1" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
            <rect width="80" height="80" fill="#20242D" />
            <circle cx="40" cy="40" r="16" fill="#3F51F5" />
          </svg>
        );
    }
  };

  return (
    <div className={styles.tileContainer} title={name} aria-label={name}>
      {renderVisual()}
    </div>
  );
};
