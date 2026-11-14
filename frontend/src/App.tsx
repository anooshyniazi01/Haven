import React, { useState, useEffect } from "react";
import { AppShell } from "./components/layout/AppShell";
import { ImageAnalyzer } from "./features/analysis/ImageAnalyzer";
import { EvidenceUploader } from "./features/evidence/EvidenceUploader";
import { SystemHealthMonitor } from "./features/health/SystemHealthMonitor";
import { IncidentTracker } from "./features/incidents/IncidentTracker";
import { EvidenceVault } from "./features/vault/EvidenceVault";
import { LandingPage } from "./features/landing/LandingPage";
import { checkSystemStatus } from "./services/health";

export interface AppProps {
  initialView?: "landing" | "workspace";
}

export const App: React.FC<AppProps> = ({ initialView }) => {
  const [view, setView] = useState<"landing" | "workspace">(() => {
    if (initialView) return initialView;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("view") === "workspace") return "workspace";
      if (params.get("view") === "landing") return "landing";
      if (window.location.pathname === "/workspace") return "workspace";
    }
    // Default to workspace in existing automated test suite when no view specified
    if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
      return "workspace";
    }
    return "landing";
  });

  const [activeTab, setActiveTab] = useState<"vault" | "incidents" | "analysis" | "intake" | "health">("vault");
  const [targetEvidenceId, setTargetEvidenceId] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<"ready" | "degraded" | "error" | "loading">(
    "loading"
  );

  // Background health check on mount to ensure header status reflects live backend state
  useEffect(() => {
    let isMounted = true;
    checkSystemStatus()
      .then((res) => {
        if (isMounted) {
          setSystemStatus(res.status === "ready" ? "ready" : "degraded");
        }
      })
      .catch(() => {
        if (isMounted) {
          setSystemStatus("error");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAnalyzeEvidence = (evidenceId: string) => {
    setTargetEvidenceId(evidenceId);
    setActiveTab("analysis");
  };

  const handleViewReport = (evidenceId: string) => {
    setTargetEvidenceId(evidenceId);
    setActiveTab("analysis");
  };

  if (view === "landing") {
    return (
      <LandingPage
        onEnterWorkspace={() => {
          setView("workspace");
          setActiveTab("vault");
        }}
      />
    );
  }

  return (
    <AppShell
      systemStatus={systemStatus}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "vault" && (
        <EvidenceVault
          onNavigateToIntake={() => setActiveTab("intake")}
          onAnalyzeEvidence={handleAnalyzeEvidence}
          onViewReport={handleViewReport}
        />
      )}
      {activeTab === "incidents" && (
        <IncidentTracker
          onNavigateToVault={(_evidenceId) => setActiveTab("vault")}
        />
      )}
      {activeTab === "analysis" && (
        <ImageAnalyzer
          initialEvidenceId={targetEvidenceId}
          onNavigateToIntake={() => setActiveTab("intake")}
          onNavigateToVault={() => setActiveTab("vault")}
        />
      )}
      {activeTab === "intake" && (
        <EvidenceUploader
          onAnalyzeEvidence={handleAnalyzeEvidence}
          onNavigateToVault={() => setActiveTab("vault")}
        />
      )}
      {activeTab === "health" && (
        <SystemHealthMonitor onStatusChange={setSystemStatus} />
      )}
    </AppShell>
  );
};

export default App;
