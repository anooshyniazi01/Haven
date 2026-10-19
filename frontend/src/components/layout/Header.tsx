import React from "react";

export interface HeaderProps {
  systemStatus?: "ready" | "degraded" | "error" | "loading";
  activeTab?: "vault" | "incidents" | "analysis" | "intake" | "health";
  onTabChange?: (tab: "vault" | "incidents" | "analysis" | "intake" | "health") => void;
}

export const Header: React.FC<HeaderProps> = ({
  systemStatus,
  activeTab = "vault",
  onTabChange,
}) => {
  const getStatusColor = () => {
    switch (systemStatus) {
      case "ready":
        return "var(--color-success)";
      case "degraded":
        return "var(--color-warning)";
      case "error":
        return "var(--color-danger)";
      default:
        return "var(--color-text-muted)";
    }
  };

  const getStatusLabel = () => {
    switch (systemStatus) {
      case "ready":
        return "System Operational";
      case "degraded":
        return "System Degraded";
      case "error":
        return "Backend Offline";
      case "loading":
        return "Checking...";
      default:
        return "Status Unknown";
    }
  };

  return (
    <header
      role="banner"
      style={{
        backgroundColor: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        padding: "var(--space-3) 0",
      }}
    >
      <div
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          padding: "0 var(--space-4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-4)",
        }}
      >
        {/* Brand / Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "var(--font-size-lg)",
            }}
            aria-hidden="true"
          >
            H
          </div>
          <div>
            <h1
              style={{
                fontSize: "var(--font-size-xl)",
                fontWeight: 700,
                color: "var(--color-text)",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              Haven
            </h1>
            <p
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-secondary)",
                fontWeight: 500,
              }}
            >
              Digital Forensics &amp; Blackmail Protection
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        {onTabChange && (
          <nav
            aria-label="Main Navigation"
            role="tablist"
            style={{
              display: "flex",
              backgroundColor: "var(--color-surface-muted)",
              padding: "3px",
              borderRadius: "var(--radius-md)",
              gap: "var(--space-1)",
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "vault"}
              onClick={() => onTabChange("vault")}
              style={{
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--font-size-sm)",
                fontWeight: activeTab === "vault" ? 600 : 500,
                color: activeTab === "vault" ? "var(--color-text)" : "var(--color-text-secondary)",
                backgroundColor: activeTab === "vault" ? "var(--color-surface)" : "transparent",
                boxShadow: activeTab === "vault" ? "var(--shadow-sm)" : "none",
                transition: "all var(--transition-fast)",
                cursor: "pointer",
              }}
            >
              Evidence Vault
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "incidents"}
              onClick={() => onTabChange("incidents")}
              style={{
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--font-size-sm)",
                fontWeight: activeTab === "incidents" ? 600 : 500,
                color: activeTab === "incidents" ? "var(--color-text)" : "var(--color-text-secondary)",
                backgroundColor: activeTab === "incidents" ? "var(--color-surface)" : "transparent",
                boxShadow: activeTab === "incidents" ? "var(--shadow-sm)" : "none",
                transition: "all var(--transition-fast)",
                cursor: "pointer",
              }}
            >
              Incident Tracker
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "analysis"}
              onClick={() => onTabChange("analysis")}
              style={{
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--font-size-sm)",
                fontWeight: activeTab === "analysis" ? 600 : 500,
                color: activeTab === "analysis" ? "var(--color-text)" : "var(--color-text-secondary)",
                backgroundColor: activeTab === "analysis" ? "var(--color-surface)" : "transparent",
                boxShadow: activeTab === "analysis" ? "var(--shadow-sm)" : "none",
                transition: "all var(--transition-fast)",
                cursor: "pointer",
              }}
            >
              Analyze Image
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "intake"}
              onClick={() => onTabChange("intake")}
              style={{
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--font-size-sm)",
                fontWeight: activeTab === "intake" ? 600 : 500,
                color: activeTab === "intake" ? "var(--color-text)" : "var(--color-text-secondary)",
                backgroundColor: activeTab === "intake" ? "var(--color-surface)" : "transparent",
                boxShadow: activeTab === "intake" ? "var(--shadow-sm)" : "none",
                transition: "all var(--transition-fast)",
                cursor: "pointer",
              }}
            >
              Evidence Intake
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "health"}
              onClick={() => onTabChange("health")}
              style={{
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--font-size-sm)",
                fontWeight: activeTab === "health" ? 600 : 500,
                color: activeTab === "health" ? "var(--color-text)" : "var(--color-text-secondary)",
                backgroundColor: activeTab === "health" ? "var(--color-surface)" : "transparent",
                boxShadow: activeTab === "health" ? "var(--shadow-sm)" : "none",
                transition: "all var(--transition-fast)",
                cursor: "pointer",
              }}
            >
              System Health
            </button>
          </nav>
        )}

        {/* Live System Status Indicator */}
        {systemStatus && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              padding: "var(--space-1) var(--space-3)",
              backgroundColor: "var(--color-surface-muted)",
              borderRadius: "var(--radius-pill)",
              fontSize: "var(--font-size-xs)",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: getStatusColor(),
                display: "inline-block",
              }}
              aria-hidden="true"
            />
            <span>{getStatusLabel()}</span>
          </div>
        )}
      </div>
    </header>
  );
};
