import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  description?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  description,
  headerAction,
  footer,
  children,
  style,
  ...props
}) => {
  return (
    <div
      {...props}
      style={{
        backgroundColor: "var(--color-surface)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        padding: "var(--space-6)",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {(title || subtitle || description || headerAction) && (
        <div
          style={{
            marginBottom: "var(--space-4)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "var(--space-3)",
            flexWrap: "wrap",
          }}
        >
          <div>
            {title && (
              <h2
                style={{
                  fontSize: "var(--font-size-lg)",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  lineHeight: "var(--line-height-tight)",
                }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <div
                style={{
                  marginTop: "var(--space-1)",
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-muted)",
                  fontFamily: "var(--font-family-mono)",
                }}
              >
                {subtitle}
              </div>
            )}
            {description && (
              <p
                style={{
                  marginTop: "var(--space-1)",
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {description}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      <div style={{ flex: 1 }}>{children}</div>

      {footer && (
        <div
          style={{
            marginTop: "var(--space-4)",
            paddingTop: "var(--space-3)",
            borderTop: "1px solid var(--color-surface-muted)",
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};
