import React, { useState, useEffect, useCallback } from "react";
import { Alert } from "../../components/feedback/Alert";
import { StatusBadge } from "../../components/feedback/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import {
  getEvidenceById,
  listEvidence,
  verifyEvidenceIntegrity,
} from "../../services/evidence";
import { exportAnalysisPdf } from "../../services/analysis";
import {
  EvidenceDetailResponse,
  EvidenceItem,
  EvidenceVerificationResponse,
} from "../../types/evidence";
import { triggerPdfDownload } from "../../utils/download";
import { formatBytes, formatTimestamp, truncateHash } from "../../utils/formatters";

export interface EvidenceVaultProps {
  onNavigateToIntake?: () => void;
  onAnalyzeEvidence?: (evidenceId: string) => void;
  onViewReport?: (evidenceId: string) => void;
}

export const EvidenceVault: React.FC<EvidenceVaultProps> = ({
  onNavigateToIntake,
  onAnalyzeEvidence,
  onViewReport,
}) => {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [appliedSearch, setAppliedSearch] = useState<string>("");
  const [filterAnalysis, setFilterAnalysis] = useState<"all" | "analyzed" | "pending">("all");
  const [offset, setOffset] = useState<number>(0);
  const limit = 10;

  // Selected item detail state
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<EvidenceDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Verification state (mapped by evidenceId)
  const [verifications, setVerifications] = useState<Record<string, EvidenceVerificationResponse>>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Copy notification state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleExportPdf = async (analysisId: string) => {
    if (!analysisId) {
      setExportError("No completed analysis report ID is associated with this evidence.");
      return;
    }
    setExportingPdf(true);
    setExportError(null);
    try {
      const blob = await exportAnalysisPdf(analysisId);
      const safeId = analysisId.replace(/[^a-zA-Z0-9-]/g, "");
      triggerPdfDownload(blob, `haven-analysis-${safeId}.pdf`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to export PDF report. Please try again.";
      setExportError(msg);
    } finally {
      setExportingPdf(false);
    }
  };

  const fetchEvidence = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let hasAnalysisParam: boolean | undefined = undefined;
      if (filterAnalysis === "analyzed") hasAnalysisParam = true;
      if (filterAnalysis === "pending") hasAnalysisParam = false;

      const res = await listEvidence({
        limit,
        offset,
        search: appliedSearch || undefined,
        hasAnalysis: hasAnalysisParam,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load evidence records.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [limit, offset, appliedSearch, filterAnalysis]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setAppliedSearch(searchTerm.trim());
  };

  const handleFilterChange = (filter: "all" | "analyzed" | "pending") => {
    setFilterAnalysis(filter);
    setOffset(0);
  };

  const handleOpenDetail = async (id: string) => {
    setSelectedEvidenceId(id);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const data = await getEvidenceById(id);
      setDetailData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to retrieve evidence details.";
      setDetailError(msg);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedEvidenceId(null);
    setDetailData(null);
    setDetailError(null);
    setExportError(null);
  };

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      const res = await verifyEvidenceIntegrity(id);
      setVerifications((prev) => ({ ...prev, [id]: res }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Integrity check failed.";
      setVerifications((prev) => ({
        ...prev,
        [id]: {
          evidence_id: id,
          status: "unavailable",
          recorded_sha256: "",
          computed_sha256: null,
          verified_at: new Date().toISOString(),
          message: msg,
          disclaimer:
            "A matching hash confirms byte preservation since intake. It does not prove original authenticity.",
        },
      }));
    } finally {
      setVerifyingId(null);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "var(--space-4)",
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 var(--space-1) 0",
              fontSize: "var(--font-size-2xl)",
              fontWeight: 600,
              color: "var(--color-text)",
            }}
          >
            Evidence Vault
          </h1>
          <p
            style={{
              margin: 0,
              color: "var(--color-text-muted)",
              fontSize: "var(--font-size-base)",
              maxWidth: "680px",
            }}
          >
            Review preserved evidence items, verify cryptographic SHA-256 byte integrity, and inspect associated forensic analysis reports.
          </p>
        </div>

        {onNavigateToIntake && (
          <Button variant="primary" onClick={onNavigateToIntake} aria-label="Upload New Evidence">
            + Preserve New Evidence
          </Button>
        )}
      </div>

      {/* Global Error Banner */}
      {error && (
        <Alert
          type="error"
          title="Vault Error"
        >
          {error}
        </Alert>
      )}

      {/* Search and Filters Toolbar */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-3)",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "var(--color-surface)",
          padding: "var(--space-4)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
        }}
      >
        <form
          onSubmit={handleSearchSubmit}
          style={{ display: "flex", gap: "var(--space-2)", flex: "1 1 280px" }}
        >
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by filename, description, or UUID..."
            aria-label="Search evidence records"
            style={{
              flex: 1,
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              fontSize: "var(--font-size-sm)",
              backgroundColor: "var(--color-background)",
              color: "var(--color-text)",
            }}
          />
          <Button variant="secondary" type="submit" aria-label="Submit search">
            Search
          </Button>
          {appliedSearch && (
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setSearchTerm("");
                setAppliedSearch("");
                setOffset(0);
              }}
              aria-label="Clear search"
            >
              Clear
            </Button>
          )}
        </form>

        {/* Filter buttons */}
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
            Filter:
          </span>
          <Button
            variant={filterAnalysis === "all" ? "primary" : "secondary"}
            onClick={() => handleFilterChange("all")}
            style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-xs)" }}
            aria-label="Filter all records"
          >
            All ({total})
          </Button>
          <Button
            variant={filterAnalysis === "analyzed" ? "primary" : "secondary"}
            onClick={() => handleFilterChange("analyzed")}
            style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-xs)" }}
            aria-label="Filter with report"
          >
            With Report
          </Button>
          <Button
            variant={filterAnalysis === "pending" ? "primary" : "secondary"}
            onClick={() => handleFilterChange("pending")}
            style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-xs)" }}
            aria-label="Filter pending report"
          >
            No Report
          </Button>
        </div>
      </div>

      {/* Selected Item Detail View (Drawer / Modal) */}
      {selectedEvidenceId && (
        <Card
          title={detailData ? `Evidence Details: ${detailData.original_filename}` : "Loading Details..."}
          subtitle={detailData ? `ID: ${detailData.id}` : undefined}
          headerAction={
            <Button variant="secondary" onClick={handleCloseDetail} aria-label="Close details">
              Close Details
            </Button>
          }
        >
          {detailLoading && (
            <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-muted)" }}>
              Loading evidence details from vault...
            </div>
          )}

          {detailError && (
            <Alert type="error" title="Failed to Load Details">
              {detailError}
            </Alert>
          )}

          {detailData && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              {/* Status and Identity Row */}
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
                <StatusBadge
                  status={detailData.file_exists ? "success" : "danger"}
                  label={detailData.file_exists ? "File Stored Securely" : "Storage File Missing"}
                />
                <StatusBadge
                  status={detailData.has_analysis ? "success" : "neutral"}
                  label={detailData.has_analysis ? "Inspection Completed" : "No Inspection Report"}
                />
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginLeft: "auto" }}>
                  Preserved: {formatTimestamp(detailData.created_at)}
                </span>
              </div>

              {/* Attributes Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "var(--space-4)",
                  backgroundColor: "var(--color-surface-muted)",
                  padding: "var(--space-4)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Format & MIME</span>
                  <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", marginTop: "var(--space-1)" }}>
                    {detailData.mime_type_detected}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Preserved Size</span>
                  <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", marginTop: "var(--space-1)" }}>
                    {formatBytes(detailData.file_size_bytes)} ({detailData.file_size_bytes.toLocaleString()} bytes)
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Evidence UUID</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                    <code style={{ fontSize: "var(--font-size-xs)" }}>{detailData.id}</code>
                    <Button
                      variant="secondary"
                      style={{ padding: "2px 8px", fontSize: "var(--font-size-xs)" }}
                      onClick={() => handleCopy(detailData.id, `detail-id-${detailData.id}`)}
                      aria-label="Copy Evidence UUID"
                    >
                      {copiedKey === `detail-id-${detailData.id}` ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* User Description / Notes */}
              {detailData.description && (
                <div
                  style={{
                    padding: "var(--space-3) var(--space-4)",
                    backgroundColor: "var(--color-surface-muted)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "var(--font-size-sm)",
                  }}
                >
                  <strong style={{ display: "block", marginBottom: "var(--space-1)", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                    Preservation Note / User Description:
                  </strong>
                  {detailData.description}
                </div>
              )}

              {/* Cryptographic SHA-256 Integrity Verification Box */}
              <div
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-4)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "var(--font-size-base)", fontWeight: 600 }}>
                      Cryptographic SHA-256 Digest
                    </h3>
                    <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                      Calculated directly from stored file bytes upon intake
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    loading={verifyingId === detailData.id}
                    onClick={() => handleVerify(detailData.id)}
                    aria-label="Verify File Integrity"
                  >
                    Verify Stored Bytes Integrity
                  </Button>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    backgroundColor: "var(--color-background)",
                    padding: "var(--space-3)",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-family-mono)",
                    fontSize: "var(--font-size-xs)",
                    wordBreak: "break-all",
                  }}
                >
                  <span style={{ flex: 1 }}>{detailData.sha256}</span>
                  <Button
                    variant="secondary"
                    style={{ padding: "2px 8px", fontSize: "var(--font-size-xs)" }}
                    onClick={() => handleCopy(detailData.sha256, `hash-${detailData.id}`)}
                    aria-label="Copy SHA-256 Hash"
                  >
                    {copiedKey === `hash-${detailData.id}` ? "Copied" : "Copy"}
                  </Button>
                </div>

                {/* Verification Outcome */}
                {verifications[detailData.id] && (
                  <div
                    style={{
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor:
                        verifications[detailData.id].status === "match"
                          ? "var(--color-success-soft)"
                          : "var(--color-warning-soft)",
                      borderLeft: `4px solid ${
                        verifications[detailData.id].status === "match"
                          ? "var(--color-success)"
                          : "var(--color-warning)"
                      }`,
                      fontSize: "var(--font-size-sm)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-1)",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>
                      {verifications[detailData.id].status === "match"
                        ? "✓ Integrity Verified — Hash Matches"
                        : "⚠ Integrity Warning"}
                    </div>
                    <div>{verifications[detailData.id].message}</div>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
                      Verified on: {formatTimestamp(verifications[detailData.id].verified_at)}
                    </div>
                  </div>
                )}

                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                  <strong>Scope Limitation:</strong> A matching SHA-256 hash confirms that the stored file bytes have not changed since intake. It does not prove that the image is authentic, unedited before upload, or depicts real events.
                </div>
              </div>

              {/* Linked Inspection Report Section */}
              <div
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-4)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "var(--font-size-base)", fontWeight: 600 }}>
                      Technical Inspection Report
                    </h3>
                    <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                      Verifiable file measurements, EXIF parsing, and format markers
                    </span>
                  </div>

                  {detailData.has_analysis ? (
                    <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
                      <Button
                        variant="secondary"
                        disabled={exportingPdf}
                        onClick={() =>
                          handleExportPdf(
                            detailData.analysis_summary?.id || detailData.analysis_id || ""
                          )
                        }
                        aria-label="Export PDF Report"
                      >
                        {exportingPdf ? "Exporting PDF..." : "Export PDF Report"}
                      </Button>
                      {onViewReport && (
                        <Button
                          variant="primary"
                          onClick={() => onViewReport(detailData.id)}
                          aria-label="View Full Inspection Report"
                        >
                          View Full Inspection Report →
                        </Button>
                      )}
                    </div>
                  ) : (
                    onAnalyzeEvidence && (
                      <Button
                        variant="primary"
                        onClick={() => onAnalyzeEvidence(detailData.id)}
                        aria-label="Run Technical Inspection"
                      >
                        Run Technical Inspection
                      </Button>
                    )
                  )}
                </div>

                {exportError && (
                  <Alert type="error" title="Export Failed">
                    {exportError}
                  </Alert>
                )}

                {detailData.analysis_summary ? (
                  <div
                    style={{
                      backgroundColor: "var(--color-surface-muted)",
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "var(--font-size-sm)",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: "var(--space-1)" }}>
                      Observed Findings Summary
                    </div>
                    <div style={{ color: "var(--color-text)" }}>
                      {detailData.analysis_summary.explanation || "Inspection completed."}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                    No technical inspection report has been generated yet for this evidence item. Run inspection to examine image geometry, compression, and EXIF metadata.
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Main Evidence Listing */}
      <Card
        title="Preserved Evidence Items"
        subtitle={`Showing ${items.length} of ${total} total records`}
      >
        {loading && (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)" }}>
            Loading vault records...
          </div>
        )}

        {!loading && items.length === 0 && (
          <div
            style={{
              padding: "var(--space-8)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--space-3)",
            }}
          >
            <div style={{ fontSize: "var(--font-size-xl)", fontWeight: 600, color: "var(--color-text)" }}>
              {appliedSearch ? "No Evidence Found Matching Search" : "Evidence Vault is Empty"}
            </div>
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", maxWidth: "480px" }}>
              {appliedSearch
                ? `No evidence items matched the search term "${appliedSearch}". Clear your search query or view all items.`
                : "No media has been preserved in the Evidence Vault yet. Upload an image to calculate its SHA-256 hash and preserve its metadata."}
            </p>
            {appliedSearch ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm("");
                  setAppliedSearch("");
                  setOffset(0);
                }}
                aria-label="Reset Search"
              >
                Reset Search
              </Button>
            ) : (
              onNavigateToIntake && (
                <Button variant="primary" onClick={onNavigateToIntake} aria-label="Upload Evidence Now">
                  Upload Evidence Now
                </Button>
              )
            )}
          </div>
        )}

        {!loading && items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                  padding: "var(--space-4)",
                  backgroundColor: "var(--color-surface)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  transition: "border-color var(--transition-fast)",
                }}
              >
                {/* Item Top Row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "var(--space-2)",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "var(--font-size-base)",
                        fontWeight: 600,
                        color: "var(--color-text)",
                      }}
                    >
                      {item.original_filename}
                    </h2>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                        marginTop: "var(--space-1)",
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      <span>UUID: {item.id}</span>
                      <span>•</span>
                      <span>{formatBytes(item.file_size_bytes)}</span>
                      <span>•</span>
                      <span>Preserved: {formatTimestamp(item.created_at)}</span>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                    <StatusBadge
                      status="neutral"
                      label={item.mime_type_detected.replace("image/", "").toUpperCase()}
                    />
                    <StatusBadge
                      status={item.has_analysis ? "success" : "neutral"}
                      label={item.has_analysis ? "Report Available" : "No Report"}
                    />
                  </div>
                </div>

                {/* Description if present */}
                {item.description && (
                  <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                    {item.description}
                  </div>
                )}

                {/* Hash Row and Quick Actions */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "var(--space-3)",
                    paddingTop: "var(--space-2)",
                    borderTop: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                      SHA-256:
                    </span>
                    <code style={{ fontSize: "var(--font-size-xs)" }}>
                      {truncateHash(item.sha256)}
                    </code>
                    <Button
                      variant="secondary"
                      style={{ padding: "2px 6px", fontSize: "11px" }}
                      onClick={() => handleCopy(item.sha256, `item-hash-${item.id}`)}
                      aria-label={`Copy SHA-256 for ${item.original_filename}`}
                    >
                      {copiedKey === `item-hash-${item.id}` ? "Copied" : "Copy"}
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                    <Button
                      variant="secondary"
                      style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-xs)" }}
                      onClick={() => handleOpenDetail(item.id)}
                      aria-label={`View details of ${item.original_filename}`}
                    >
                      View Details
                    </Button>

                    <Button
                      variant="secondary"
                      loading={verifyingId === item.id}
                      style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-xs)" }}
                      onClick={() => handleVerify(item.id)}
                      aria-label={`Verify integrity of ${item.original_filename}`}
                    >
                      Verify Integrity
                    </Button>

                    {item.has_analysis ? (
                      onViewReport && (
                        <Button
                          variant="primary"
                          style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-xs)" }}
                          onClick={() => onViewReport(item.id)}
                          aria-label={`View report for ${item.original_filename}`}
                        >
                          View Report
                        </Button>
                      )
                    ) : (
                      onAnalyzeEvidence && (
                        <Button
                          variant="secondary"
                          style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-xs)" }}
                          onClick={() => onAnalyzeEvidence(item.id)}
                          aria-label={`Run inspection on ${item.original_filename}`}
                        >
                          Inspect Image
                        </Button>
                      )
                    )}
                  </div>
                </div>

                {/* Verification result snippet if verified inline */}
                {verifications[item.id] && (
                  <div
                    style={{
                      fontSize: "var(--font-size-xs)",
                      padding: "var(--space-2) var(--space-3)",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor:
                        verifications[item.id].status === "match"
                          ? "var(--color-success-soft)"
                          : "var(--color-warning-soft)",
                      color:
                        verifications[item.id].status === "match"
                          ? "var(--color-success)"
                          : "var(--color-warning)",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                    }}
                  >
                    <span>
                      {verifications[item.id].status === "match"
                        ? "✓ SHA-256 Match Verified:"
                        : "⚠ Integrity Status:"}
                    </span>
                    <span>{verifications[item.id].message}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && total > limit && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "var(--space-4)",
              paddingTop: "var(--space-4)",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
              Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
            </span>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <Button
                variant="secondary"
                disabled={offset === 0}
                onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-xs)" }}
                aria-label="Previous page"
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={offset + limit >= total}
                onClick={() => setOffset((prev) => prev + limit)}
                style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-xs)" }}
                aria-label="Next page"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
