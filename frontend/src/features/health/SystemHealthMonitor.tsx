import React, { useState, useEffect, useCallback } from "react";
import { checkBackendHealth, checkSystemStatus } from "../../services/health";
import { HealthResponse, StatusResponse } from "../../types/health";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/feedback/StatusBadge";
import { Alert } from "../../components/feedback/Alert";
import { LoadingSpinner } from "../../components/feedback/LoadingSpinner";

export interface SystemHealthMonitorProps {
  onStatusChange?: (status: "ready" | "degraded" | "error" | "loading") => void;
}

export const SystemHealthMonitor: React.FC<SystemHealthMonitorProps> = ({ onStatusChange }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    onStatusChange?.("loading");

    try {
      // Execute genuine HTTP requests to both backend health endpoints
      const [health, status] = await Promise.all([
        checkBackendHealth(),
        checkSystemStatus(),
      ]);

      setHealthData(health);
      setStatusData(status);
      setLastChecked(new Date());

      const systemState = status.status === "ready" ? "ready" : "degraded";
      onStatusChange?.(systemState);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to connect to Haven backend services. Please ensure the server is running.";
      setError(message);
      setHealthData(null);
      setStatusData(null);
      setLastChecked(new Date());
      onStatusChange?.("error");
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const apiBaseUrl =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
    "http://localhost:8000";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Intro Header */}
      <section aria-labelledby="foundation-title">
        <h2
          id="foundation-title"
          style={{
            fontSize: "var(--font-size-2xl)",
            fontWeight: 700,
            color: "var(--color-text)",
            marginBottom: "var(--space-2)",
            letterSpacing: "-0.01em",
          }}
        >
          System Health &amp; Readiness
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-base)" }}>
          Verification of Haven&apos;s core operational infrastructure: API gateway, live database
          connection, and digital forensics analysis pipeline.
        </p>
      </section>

      {/* Error state */}
      {error && (
        <Alert
          type="danger"
          title="Backend Service Unreachable"
          action={
            <Button variant="secondary" onClick={fetchHealth} disabled={loading}>
              Retry Connection
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Degraded warning if backend is reachable but reporting degraded */}
      {!error && statusData && statusData.status !== "ready" && (
        <Alert
          type="warning"
          title="System Running in Degraded Mode"
          action={
            <Button variant="secondary" onClick={fetchHealth} disabled={loading}>
              Re-check Status
            </Button>
          }
        >
          One or more subsystem components reported degraded availability. Review subsystem statuses below.
        </Alert>
      )}

      {/* Main Subsystem Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--space-4)",
        }}
      >
        {/* Backend API Health */}
        <Card
          title="Backend API Liveness"
          subtitle="Endpoint: GET /health"
          footer={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                FastAPI Gateway
              </span>
              {loading ? (
                <LoadingSpinner size="sm" label="Checking API liveness..." />
              ) : healthData ? (
                <StatusBadge status="ready" label={healthData.status.toUpperCase()} />
              ) : (
                <StatusBadge status="error" label="UNREACHABLE" />
              )}
            </div>
          }
        >
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
            Verifies basic HTTP reachability, server event loop availability, and CORS headers.
          </p>
        </Card>

        {/* Database Connection */}
        <Card
          title="Storage &amp; Database"
          subtitle="Endpoint: GET /api/v1/status"
          footer={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                SQLite / SQLAlchemy
              </span>
              {loading ? (
                <LoadingSpinner size="sm" label="Checking database connection..." />
              ) : statusData?.database === "connected" ? (
                <StatusBadge status="ready" label="CONNECTED" />
              ) : (
                <StatusBadge status="error" label="DISCONNECTED" />
              )}
            </div>
          }
        >
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
            Live query ping (<code>SELECT 1</code>) to SQLite engine and verified Alembic schema migration state.
          </p>
        </Card>

        {/* Forensics Analysis Engine */}
        <Card
          title="Forensics Engine"
          subtitle="Endpoint: GET /api/v1/status"
          footer={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                Local Inference
              </span>
              {loading ? (
                <LoadingSpinner size="sm" label="Checking forensics engine..." />
              ) : statusData?.analysis_engine === "available" ? (
                <StatusBadge status="ready" label="AVAILABLE" />
              ) : (
                <StatusBadge status="warning" label="OFFLINE" />
              )}
            </div>
          }
        >
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
            Ready state for digital media analysis, cryptographic evidence hashing, and EXIF metadata extraction.
          </p>
        </Card>
      </div>

      {/* Control Actions & Diagnostics Card */}
      <Card
        title="Connection Diagnostics"
        headerAction={
          <Button
            variant="primary"
            onClick={fetchHealth}
            loading={loading}
            disabled={loading}
          >
            {loading ? "Checking System..." : "Refresh Status"}
          </Button>

        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "var(--space-4)",
            fontSize: "var(--font-size-sm)",
          }}
        >
          <div>
            <div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-xs)" }}>
              API Base URL
            </div>
            <code
              style={{
                fontFamily: "var(--font-family-mono)",
                color: "var(--color-brand)",
                wordBreak: "break-all",
              }}
            >
              {apiBaseUrl}
            </code>
          </div>

          <div>
            <div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-xs)" }}>
              Overall System State
            </div>
            <div style={{ marginTop: "var(--space-1)" }}>
              {loading ? (
                <span style={{ color: "var(--color-text-muted)" }}>Evaluating...</span>
              ) : statusData ? (
                <StatusBadge status={statusData.status} />
              ) : (
                <StatusBadge status="error" label="OFFLINE" />
              )}
            </div>
          </div>

          <div>
            <div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-xs)" }}>
              Last Verified
            </div>
            <div style={{ color: "var(--color-text)", fontWeight: 500, marginTop: "var(--space-1)" }}>
              {lastChecked ? lastChecked.toLocaleTimeString() : "Never"}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
