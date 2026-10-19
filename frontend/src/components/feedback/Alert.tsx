import React from "react";

export type AlertType = "info" | "warning" | "error" | "danger" | "success";

export interface AlertProps {
  type?: AlertType;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  type = "info",
  title,
  children,
  action,
}) => {
  const getStyles = () => {
    switch (type) {
      case "danger":
      case "error":
        return {
          bg: "var(--color-danger-soft)",
          border: "var(--color-danger)",
          text: "var(--color-danger)",
        };

      case "warning":
        return {
          bg: "var(--color-warning-soft)",
          border: "var(--color-warning)",
          text: "var(--color-warning)",
        };
      case "success":
        return {
          bg: "var(--color-success-soft)",
          border: "var(--color-success)",
          text: "var(--color-success)",
        };
      case "info":
      default:
        return {
          bg: "var(--color-info-soft)",
          border: "var(--color-info)",
          text: "var(--color-info)",
        };
    }
  };

  const colors = getStyles();

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      style={{
        padding: "var(--space-4)",
        borderRadius: "var(--radius-md)",
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
      }}
    >
      {title && (
        <strong
          style={{
            color: colors.text,
            fontSize: "var(--font-size-base)",
            fontWeight: 600,
          }}
        >
          {title}
        </strong>
      )}
      <div style={{ color: "var(--color-text)", fontSize: "var(--font-size-sm)" }}>
        {children}
      </div>
      {action && <div style={{ marginTop: "var(--space-2)" }}>{action}</div>}
    </div>
  );
};
