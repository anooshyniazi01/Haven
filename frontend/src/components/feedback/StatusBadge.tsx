import React from "react";

export type StatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "ready"
  | "degraded"
  | "error"
  | (string & {});


export interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const getColors = () => {
    switch (status) {
      case "ready":
      case "success":
        return {
          bg: "var(--color-success-soft)",
          text: "var(--color-success)",
          dot: "var(--color-success)",
          defaultLabel: "READY",
        };
      case "degraded":
      case "warning":
        return {
          bg: "var(--color-warning-soft)",
          text: "var(--color-warning)",
          dot: "var(--color-warning)",
          defaultLabel: "DEGRADED",
        };
      case "error":
      case "danger":
        return {
          bg: "var(--color-danger-soft)",
          text: "var(--color-danger)",
          dot: "var(--color-danger)",
          defaultLabel: "ERROR",
        };
      case "info":
        return {
          bg: "var(--color-info-soft)",
          text: "var(--color-info)",
          dot: "var(--color-info)",
          defaultLabel: "INFO",
        };
      case "neutral":
      default:
        return {
          bg: "var(--color-surface-muted)",
          text: "var(--color-text-secondary)",
          dot: "var(--color-border-strong)",
          defaultLabel: "UNKNOWN",
        };
    }
  };

  const config = getColors();
  const displayLabel = label ?? config.defaultLabel;

  return (
    <span
      role="status"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "var(--space-1) var(--space-3)",
        borderRadius: "var(--radius-pill)",
        backgroundColor: config.bg,
        color: config.text,
        fontSize: "var(--font-size-xs)",
        fontWeight: 600,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: config.dot,
        }}
      />
      {displayLabel}
    </span>
  );
};
