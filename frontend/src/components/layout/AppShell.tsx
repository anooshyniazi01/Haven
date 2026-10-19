import React from "react";
import { Header } from "./Header";

export interface AppShellProps {
  children: React.ReactNode;
  systemStatus?: "ready" | "degraded" | "error" | "loading";
  activeTab?: "vault" | "incidents" | "analysis" | "intake" | "health";
  onTabChange?: (tab: "vault" | "incidents" | "analysis" | "intake" | "health") => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  systemStatus,
  activeTab,
  onTabChange,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "var(--color-background)",
      }}
    >
      {/* Accessible skip link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Global Header */}
      <Header
        systemStatus={systemStatus}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      {/* Main Content Area */}
      <main
        id="main-content"
        role="main"
        tabIndex={-1}
        style={{
          flex: 1,
          maxWidth: "1080px",
          width: "100%",
          margin: "0 auto",
          padding: "var(--space-8) var(--space-4)",
        }}
      >
        {children}
      </main>

      {/* Footer with Forensics & Privacy Integrity Notice */}
      <footer
        role="contentinfo"
        style={{
          backgroundColor: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          padding: "var(--space-6) var(--space-4)",
          fontSize: "var(--font-size-xs)",
          color: "var(--color-text-muted)",
          lineHeight: "var(--line-height-relaxed)",
        }}
      >
        <div
          style={{
            maxWidth: "1080px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "var(--space-2)",
            }}
          >
            <span>Haven Forensic Safety &copy; 2026. Local MVP Foundation.</span>
            <span>API Specification v1.0.0 &bull; SQLite Storage</span>
          </div>
          <p>
            <strong>Evidence Integrity Disclosure:</strong> Cryptographic hashes (SHA-256) verify
            that file bytes have not altered since recording; they do not attest to prior authenticity or origin.
            Media uploaded to Haven remains local and private.
          </p>
        </div>
      </footer>
    </div>
  );
};
