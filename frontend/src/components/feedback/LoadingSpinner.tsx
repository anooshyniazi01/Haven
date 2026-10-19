import React from "react";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  label = "Loading...",
  color = "var(--color-brand)",
}) => {
  const sizeMap = {
    sm: "16px",
    md: "24px",
    lg: "36px",
  };

  const borderWidthMap = {
    sm: "2px",
    md: "3px",
    lg: "4px",
  };

  const dimension = sizeMap[size];
  const borderWidth = borderWidthMap[size];

  return (
    <div
      role="status"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: dimension,
          height: dimension,
          borderRadius: "50%",
          border: `${borderWidth} solid var(--color-border)`,
          borderTopColor: color,
          animation: "spin 0.8s linear infinite",
        }}
      />
      <span
        style={{
          border: 0,
          clip: "rect(0 0 0 0)",
          height: "1px",
          margin: "-1px",
          overflow: "hidden",
          padding: 0,
          position: "absolute",
          width: "1px",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
};
