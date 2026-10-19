import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SystemHealthMonitor } from "../../src/features/health/SystemHealthMonitor";
import * as healthService from "../../src/services/health";

describe("SystemHealthMonitor Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders loading state initially", () => {
    vi.spyOn(healthService, "checkBackendHealth").mockReturnValue(new Promise(() => {}));
    vi.spyOn(healthService, "checkSystemStatus").mockReturnValue(new Promise(() => {}));

    render(<SystemHealthMonitor />);
    expect(screen.getByText("Checking API liveness...")).toBeInTheDocument();
    expect(screen.getByText("Checking database connection...")).toBeInTheDocument();
    expect(screen.getByText("Checking forensics engine...")).toBeInTheDocument();
  });

  it("renders healthy status when backend endpoints respond successfully", async () => {
    vi.spyOn(healthService, "checkBackendHealth").mockResolvedValue({ status: "ok" });
    vi.spyOn(healthService, "checkSystemStatus").mockResolvedValue({
      status: "ready",
      database: "connected",
      analysis_engine: "available",
    });

    const statusChangeMock = vi.fn();
    render(<SystemHealthMonitor onStatusChange={statusChangeMock} />);

    await waitFor(() => {
      expect(screen.getByText("OK")).toBeInTheDocument();
      expect(screen.getByText("CONNECTED")).toBeInTheDocument();
      expect(screen.getByText("AVAILABLE")).toBeInTheDocument();
      expect(screen.getByText("READY")).toBeInTheDocument();
    });

    expect(statusChangeMock).toHaveBeenCalledWith("ready");
  });

  it("renders degraded warning when system status is degraded", async () => {
    vi.spyOn(healthService, "checkBackendHealth").mockResolvedValue({ status: "ok" });
    vi.spyOn(healthService, "checkSystemStatus").mockResolvedValue({
      status: "degraded",
      database: "connected",
      analysis_engine: "unavailable",
    });

    const statusChangeMock = vi.fn();
    render(<SystemHealthMonitor onStatusChange={statusChangeMock} />);

    await waitFor(() => {
      expect(screen.getByText("System Running in Degraded Mode")).toBeInTheDocument();
      expect(screen.getByText("OFFLINE")).toBeInTheDocument();
    });

    expect(statusChangeMock).toHaveBeenCalledWith("degraded");
  });

  it("renders error alert and retry button when backend fails", async () => {
    vi.spyOn(healthService, "checkBackendHealth").mockRejectedValue(
      new Error("Network connection refused")
    );
    vi.spyOn(healthService, "checkSystemStatus").mockRejectedValue(
      new Error("Network connection refused")
    );

    const statusChangeMock = vi.fn();
    render(<SystemHealthMonitor onStatusChange={statusChangeMock} />);

    await waitFor(() => {
      expect(screen.getByText("Backend Service Unreachable")).toBeInTheDocument();
      expect(screen.getByText("Network connection refused")).toBeInTheDocument();
    });

    expect(statusChangeMock).toHaveBeenCalledWith("error");

    // Click retry
    vi.spyOn(healthService, "checkBackendHealth").mockResolvedValue({ status: "ok" });
    vi.spyOn(healthService, "checkSystemStatus").mockResolvedValue({
      status: "ready",
      database: "connected",
      analysis_engine: "available",
    });

    const retryBtn = screen.getByRole("button", { name: /Retry Connection/i });
    await userEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText("OK")).toBeInTheDocument();
      expect(screen.getByText("CONNECTED")).toBeInTheDocument();
    });
  });

  it("allows manual refresh via Refresh Status button", async () => {
    const healthSpy = vi
      .spyOn(healthService, "checkBackendHealth")
      .mockResolvedValue({ status: "ok" });
    const statusSpy = vi.spyOn(healthService, "checkSystemStatus").mockResolvedValue({
      status: "ready",
      database: "connected",
      analysis_engine: "available",
    });

    render(<SystemHealthMonitor />);

    await waitFor(() => {
      expect(screen.getByText("OK")).toBeInTheDocument();
    });

    expect(healthSpy).toHaveBeenCalledTimes(1);
    expect(statusSpy).toHaveBeenCalledTimes(1);

    const refreshBtn = screen.getByRole("button", { name: /Refresh Status/i });
    await userEvent.click(refreshBtn);

    expect(healthSpy).toHaveBeenCalledTimes(2);
    expect(statusSpy).toHaveBeenCalledTimes(2);
  });
});
