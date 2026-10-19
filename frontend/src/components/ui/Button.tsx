import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  loading = false,
  disabled,
  children,
  style,
  ...props
}) => {
  const getBackgroundColor = () => {
    if (disabled || loading) return "var(--color-surface-muted)";
    switch (variant) {
      case "primary":
        return "var(--color-brand)";
      case "danger":
        return "var(--color-danger)";
      case "secondary":
      default:
        return "var(--color-surface)";
    }
  };

  const getTextColor = () => {
    if (disabled || loading) return "var(--color-text-muted)";
    switch (variant) {
      case "primary":
      case "danger":
        return "var(--color-surface)";
      case "secondary":
      default:
        return "var(--color-text)";
    }
  };

  const getBorder = () => {
    if (variant === "secondary") {
      return "1px solid var(--color-border)";
    }
    return "1px solid transparent";
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-2)",
        padding: "var(--space-2) var(--space-4)",
        borderRadius: "var(--radius-md)",
        fontWeight: 500,
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        border: getBorder(),
        transition: "background-color var(--transition-fast), border-color var(--transition-fast)",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {loading && (
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            border: "2px solid currentColor",
            borderRightColor: "transparent",
            animation: "spin 0.75s linear infinite",
          }}
        />
      )}
      {children}
    </button>
  );
};
