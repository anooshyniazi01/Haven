import React, { useState, useEffect } from "react";
import { Alert } from "../../components/feedback/Alert";
import { StatusBadge } from "../../components/feedback/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import {
  analyzeEvidence,
  createAnalysisFromUpload,
  exportAnalysisPdf,
  runAnalysis,
} from "../../services/analysis";
import { AnalysisResponse } from "../../types/analysis";
import { triggerPdfDownload } from "../../utils/download";
import { formatBytes, formatTimestamp } from "../../utils/formatters";

export interface ImageAnalyzerProps {
  initialEvidenceId?: string | null;
  onNavigateToIntake?: () => void;
  onNavigateToVault?: () => void;
}

type ProcessingStage =
  | "idle"
  | "validating"
  | "uploading"
  | "inspecting"
  | "inferring"
  | "saving";

export const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({
  initialEvidenceId,
  onNavigateToIntake,
  onNavigateToVault,
}) => {
  const [mode, setMode] = useState<"evidence" | "upload">(
    initialEvidenceId ? "evidence" : "evidence"
  );
  const [evidenceId, setEvidenceId] = useState<string>(initialEvidenceId || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);
  const [saveToVault, setSaveToVault] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>("idle");
  const [analysisReport, setAnalysisReport] = useState<AnalysisResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [copiedEvidenceId, setCopiedEvidenceId] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  const [exportingPdf, setExportingPdf] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Auto-run if initialEvidenceId is provided from Evidence Intake or Vault
  useEffect(() => {
    if (initialEvidenceId) {
      setEvidenceId(initialEvidenceId);
      setMode("evidence");
      handleAnalyzeEvidence(initialEvidenceId);
    }
  }, [initialEvidenceId]);

  // Handle object URL lifecycle for uploaded file preview
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileValidationError(null);
    setErrorMessage(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Size limit: 25 MB
    const maxBytes = 25 * 1024 * 1024;
    if (file.size > maxBytes) {
      setFileValidationError(`File size (${formatBytes(file.size)}) exceeds the maximum allowed limit of 25 MB.`);
      setSelectedFile(null);
      return;
    }

    // Extension / MIME validation
    const validExts = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const validMimes = ["image/jpeg", "image/png", "image/webp"];

    if (!validExts.includes(ext) && (file.type && !validMimes.includes(file.type))) {
      setFileValidationError(
        `Unsupported format (${ext || file.type || "unknown"}). Only JPEG, PNG, and WEBP images are supported.`
      );
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleAnalyzeEvidence = async (targetId: string) => {
    if (!targetId.trim()) {
      setErrorMessage("Please enter an Evidence ID to analyze.");
      return;
    }

    setLoading(true);
    setProcessingStage("inspecting");
    setErrorMessage(null);

    try {
      const response = await analyzeEvidence(targetId.trim());
      setAnalysisReport(response);
    } catch (err: unknown) {
      const errObj = err as { message?: string; details?: { message?: string } };
      setErrorMessage(
        errObj.message || "Failed to execute technical image inspection. Please check the Evidence ID."
      );
    } finally {
      setLoading(false);
      setProcessingStage("idle");
    }
  };

  const handleAnalyzeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage("Please choose a valid image file to analyze.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Step 1: Validate & Upload
      setProcessingStage("uploading");
      const uploadRes = await createAnalysisFromUpload(selectedFile, saveToVault);

      // Step 2: Technical Inspection & AI Inference
      setProcessingStage("inspecting");
      const fullReport = await runAnalysis(uploadRes.id);

      setProcessingStage("saving");
      setAnalysisReport(fullReport);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMessage(
        errObj.message || "Failed to analyze uploaded image. Please ensure it is a valid JPEG, PNG, or WEBP file."
      );
    } finally {
      setLoading(false);
      setProcessingStage("idle");
    }
  };

  const handleExportPdf = async () => {
    if (!analysisReport || analysisReport.status !== "completed") {
      setExportError("Only completed inspection reports can be exported to PDF.");
      return;
    }

    setExportingPdf(true);
    setExportError(null);

    try {
      const blob = await exportAnalysisPdf(analysisReport.id);
      const safeId = analysisReport.id.replace(/[^a-zA-Z0-9-]/g, "");
      triggerPdfDownload(blob, `haven-analysis-${safeId}.pdf`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to export PDF report. Please try again.";
      setExportError(msg);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleCopy = (text: string, type: "id" | "evidence" | "hash") => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === "id") {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2500);
      } else if (type === "evidence") {
        setCopiedEvidenceId(true);
        setTimeout(() => setCopiedEvidenceId(false), 2500);
      } else {
        setCopiedHash(true);
        setTimeout(() => setCopiedHash(false), 2500);
      }
    });
  };

  const handleReset = () => {
    setAnalysisReport(null);
    setErrorMessage(null);
    setExportError(null);
    setSelectedFile(null);
    setFileValidationError(null);
  };

  const ti = analysisReport?.result?.technical_inspection;
  const ai = analysisReport?.result?.ai_forensics;

  const getProcessingMessage = (stage: ProcessingStage): string => {
    switch (stage) {
      case "validating":
        return "Validating file format and size limits...";
      case "uploading":
        return "Uploading and registering image in storage...";
      case "inspecting":
        return "Executing technical inspection and local CPU AI detection...";
      case "inferring":
        return "Running local distilled ViT model on CPU...";
      case "saving":
        return "Persisting structured analysis findings to database...";
      default:
        return "Processing analysis request...";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Intro and Mode Header */}
      <div>
        <h1 style={{ margin: "0 0 var(--space-1) 0", fontSize: "var(--font-size-2xl)", fontWeight: 600 }}>
          Technical Image Inspection
        </h1>
        <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--font-size-base)" }}>
          Perform verifiable technical inspection of image geometry, metadata, and local ONNX AI synthetic-image detection without fabricated scores.
        </p>
      </div>

      {/* Analysis Result Display */}
      {analysisReport && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {/* Summary Card */}
          <Card
            title={analysisReport.original_filename}
            subtitle={`Analysis ID: ${analysisReport.id} • Inspected: ${formatTimestamp(analysisReport.completed_at || analysisReport.created_at)}`}
            headerAction={
              <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
                {analysisReport.status === "completed" && (
                  <Button
                    variant="primary"
                    disabled={exportingPdf}
                    onClick={handleExportPdf}
                    aria-label="Export PDF Report"
                  >
                    {exportingPdf ? "Exporting PDF..." : "Export PDF Report"}
                  </Button>
                )}
                {analysisReport.evidence_id && onNavigateToVault && (
                  <Button variant="secondary" onClick={onNavigateToVault} aria-label="View in Evidence Vault">
                    View in Evidence Vault
                  </Button>
                )}
                <Button variant="secondary" onClick={handleReset} disabled={exportingPdf}>
                  Inspect Another Image
                </Button>
              </div>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              {exportError && (
                <Alert type="error" title="Export Failed">
                  {exportError}
                </Alert>
              )}

              {/* Optional Client-Side Image Preview Thumbnail */}
              {previewUrl && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-4)",
                    padding: "var(--space-3)",
                    backgroundColor: "var(--color-surface-muted)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <img
                    src={previewUrl}
                    alt={analysisReport.original_filename}
                    style={{
                      maxHeight: "140px",
                      maxWidth: "200px",
                      borderRadius: "var(--radius-sm)",
                      objectFit: "contain",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  />
                  <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", lineHeight: "1.6" }}>
                    <div style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "var(--font-size-sm)" }}>
                      Analyzed Image Preview
                    </div>
                    <div>File: {analysisReport.original_filename}</div>
                    <div>Size: {formatBytes(analysisReport.file_size_bytes)}</div>
                    <div>MIME: {analysisReport.mime_type_detected}</div>
                  </div>
                </div>
              )}

              {/* Badges and Findings */}
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
                <StatusBadge
                  status={analysisReport.result?.label === "format_anomalies_detected" ? "warning" : "success"}
                  label={analysisReport.result?.label === "format_anomalies_detected" ? "Anomalies Noted" : "Inspection Complete"}
                />
                <StatusBadge
                  status="neutral"
                  label={
                    analysisReport.analysis_method === "technical_and_ai_synthetic_inspection"
                      ? "Method: Technical & AI Inspection"
                      : analysisReport.analysis_method === "technical_image_inspection"
                      ? "Method: Technical Inspection"
                      : (analysisReport.analysis_method || "Technical Inspection")
                  }
                />
                {ai && (ai.status === "success" || ai.inference_status === "success") ? (
                  <StatusBadge
                    status={
                      ai.indicator === "elevated_synthetic_signal" || ai.indicator === "elevated_synthetic_indicators" || ai.label === "elevated_synthetic_indicators"
                        ? "warning"
                        : ai.indicator === "low_synthetic_signal" || ai.indicator === "low_synthetic_indicators" || ai.label === "low_synthetic_indicators"
                        ? "success"
                        : "neutral"
                    }
                    label={`AI Detection: ${
                      ai.synthetic_likelihood !== null
                        ? `${(ai.synthetic_likelihood * 100).toFixed(1)}% Synthetic Likelihood`
                        : "Completed"
                    }`}
                  />
                ) : ai && (ai.status === "failed" || ai.inference_status === "failed") ? (
                  <StatusBadge status="error" label="AI Detection: Failed" />
                ) : (
                  <StatusBadge
                    status="neutral"
                    label="AI Manipulation Model: Unavailable"
                  />
                )}
                {analysisReport.evidence_id && (
                  <StatusBadge status="info" label="Preserved in Evidence Vault" />
                )}
              </div>

              {/* Plain-English Observation */}
              <div
                style={{
                  padding: "var(--space-4)",
                  backgroundColor: "var(--color-surface-muted)",
                  borderRadius: "var(--radius-md)",
                  borderLeft: "4px solid var(--color-primary)",
                  fontSize: "var(--font-size-sm)",
                  lineHeight: "1.6",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: "var(--space-1)", color: "var(--color-text)" }}>
                  Observed Findings Summary
                </div>
                <div>{analysisReport.result?.explanation}</div>
              </div>

              {/* Cryptographic Hash and Identity */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "var(--space-4)",
                  padding: "var(--space-4)",
                  backgroundColor: "var(--color-surface-muted)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                    Analysis UUID
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                    <code style={{ fontSize: "var(--font-size-xs)", wordBreak: "break-all" }}>
                      {analysisReport.id}
                    </code>
                    <Button
                      variant="secondary"
                      style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-xs)" }}
                      onClick={() => handleCopy(analysisReport.id, "id")}
                      aria-label="Copy Analysis ID"
                    >
                      {copiedId ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>

                {analysisReport.evidence_id && (
                  <div>
                    <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                      Evidence Vault UUID
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                      <code style={{ fontSize: "var(--font-size-xs)", wordBreak: "break-all" }}>
                        {analysisReport.evidence_id}
                      </code>
                      <Button
                        variant="secondary"
                        style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-xs)" }}
                        onClick={() => handleCopy(analysisReport.evidence_id!, "evidence")}
                        aria-label="Copy Evidence ID"
                      >
                        {copiedEvidenceId ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                    SHA-256 Digest of Stored Bytes
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                    <code style={{ fontSize: "var(--font-size-xs)", wordBreak: "break-all" }}>
                      {analysisReport.sha256}
                    </code>
                    <Button
                      variant="secondary"
                      style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-xs)" }}
                      onClick={() => handleCopy(analysisReport.sha256, "hash")}
                      aria-label="Copy SHA-256 Digest"
                    >
                      {copiedHash ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* AI-Generated Image Detection Card */}
          {ai && (
            <Card
              title="AI-Generated Image Detection"
              subtitle={`Model: ${ai.model_name || "ai-image-detect-distilled-onnx"} (${ai.model_version || "1.0.0"}) • Local CPU Inference`}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {ai.status === "success" || ai.inference_status === "success" ? (
                  <>
                    <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
                      <StatusBadge
                        status={
                          ai.indicator === "elevated_synthetic_signal" || ai.indicator === "elevated_synthetic_indicators" || ai.label === "elevated_synthetic_indicators"
                            ? "warning"
                            : ai.indicator === "low_synthetic_signal" || ai.indicator === "low_synthetic_indicators" || ai.label === "low_synthetic_indicators"
                            ? "success"
                            : "neutral"
                        }
                        label={
                          ai.indicator === "elevated_synthetic_signal" || ai.indicator === "elevated_synthetic_indicators" || ai.label === "elevated_synthetic_indicators"
                            ? "Elevated Synthetic Signal (>=75%)"
                            : ai.indicator === "low_synthetic_signal" || ai.indicator === "low_synthetic_indicators" || ai.label === "low_synthetic_indicators"
                            ? "Low Synthetic Signal (<25%)"
                            : "Inconclusive Signal (25% - 75%)"
                        }
                      />
                      <StatusBadge
                        status="neutral"
                        label={`Evaluation: ${ai.evaluation_status || "Uncalibrated Raw Estimate"}`}
                      />
                      {(ai.latency_ms !== null || ai.inference_latency_ms !== null) && (
                        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                          CPU Latency: {(ai.inference_latency_ms ?? ai.latency_ms)?.toFixed(1)} ms
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "var(--space-3)",
                      }}
                    >
                      <div style={{ padding: "var(--space-3)", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-sm)" }}>
                        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Synthetic Likelihood Estimate</span>
                        <div style={{ fontWeight: 600, fontSize: "var(--font-size-lg)", marginTop: "var(--space-1)" }}>
                          {ai.synthetic_likelihood !== null
                            ? `${(ai.synthetic_likelihood * 100).toFixed(1)}%`
                            : "N/A"}
                        </div>
                        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                          Raw output score: {(ai.raw_score ?? ai.synthetic_likelihood)?.toFixed(4) ?? "N/A"}
                        </span>
                      </div>

                      <div style={{ padding: "var(--space-3)", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-sm)" }}>
                        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Score Semantics</span>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text)", marginTop: "var(--space-1)", lineHeight: "1.4" }}>
                          {ai.score_semantics || "Softmax probability of synthetic class from binary ViT classifier."}
                        </div>
                      </div>

                      <div style={{ padding: "var(--space-3)", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-sm)" }}>
                        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Model Architecture</span>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text)", marginTop: "var(--space-1)", lineHeight: "1.4" }}>
                          Distilled Vision Transformer (ViT-small, 224x224 RGB, Bilinear interpolation, ONNX quantized)
                        </div>
                      </div>
                    </div>

                    {/* Explanation */}
                    {ai.explanation && (
                      <div
                        style={{
                          padding: "var(--space-3)",
                          backgroundColor: "var(--color-surface-muted)",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "var(--font-size-xs)",
                          color: "var(--color-text)",
                          lineHeight: "1.5",
                        }}
                      >
                        <strong>Model Interpretation:</strong> {ai.explanation}
                      </div>
                    )}

                    {ai.limitations && ai.limitations.length > 0 && (
                      <div>
                        <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
                          Model Limitations & Evaluation Context
                        </div>
                        <ul style={{ margin: 0, paddingLeft: "var(--space-4)", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", lineHeight: "1.5" }}>
                          {ai.limitations.map((lim, idx) => (
                            <li key={idx}>{lim}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <Alert
                    type={ai.status === "failed" || ai.inference_status === "failed" ? "error" : "info"}
                    title={ai.status === "failed" || ai.inference_status === "failed" ? "AI Detection Failed" : "AI Detection Unavailable"}
                  >
                    {ai.error_message ||
                      "Local AI model inference is unavailable or failed to execute."}
                  </Alert>
                )}
              </div>
            </Card>
          )}

          {/* Technical Measurements Card */}
          {ti && (
            <Card
              title="Image Dimensions & Encoding Properties"
              subtitle="Verifiable measurements parsed directly from image binary headers"
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "var(--space-4)",
                }}
              >
                <div style={{ padding: "var(--space-3)", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-sm)" }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Dimensions</span>
                  <div style={{ fontWeight: 600, fontSize: "var(--font-size-base)", marginTop: "var(--space-1)" }}>
                    {ti.dimensions.width} × {ti.dimensions.height} px
                  </div>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                    {ti.dimensions.megapixels} MP ({ti.dimensions.total_pixels.toLocaleString()} pixels)
                  </span>
                </div>

                <div style={{ padding: "var(--space-3)", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-sm)" }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Aspect Ratio</span>
                  <div style={{ fontWeight: 600, fontSize: "var(--font-size-base)", marginTop: "var(--space-1)" }}>
                    {ti.dimensions.aspect_ratio}
                  </div>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                    Standard photo/display ratio
                  </span>
                </div>

                <div style={{ padding: "var(--space-3)", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-sm)" }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Format & Media Type</span>
                  <div style={{ fontWeight: 600, fontSize: "var(--font-size-base)", marginTop: "var(--space-1)" }}>
                    {ti.format}
                  </div>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                    {ti.mime_type}
                  </span>
                </div>

                <div style={{ padding: "var(--space-3)", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-sm)" }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Color Mode & Channels</span>
                  <div style={{ fontWeight: 600, fontSize: "var(--font-size-base)", marginTop: "var(--space-1)" }}>
                    {ti.mode} ({ti.bit_depth}-bit)
                  </div>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                    {ti.color_channels} channels • {ti.has_transparency ? "Alpha transparency present" : "No alpha channel"}
                  </span>
                </div>

                <div style={{ padding: "var(--space-3)", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-sm)" }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Stored File Size</span>
                  <div style={{ fontWeight: 600, fontSize: "var(--font-size-base)", marginTop: "var(--space-1)" }}>
                    {formatBytes(ti.file_size_bytes)}
                  </div>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                    {ti.file_size_bytes.toLocaleString()} bytes on disk
                  </span>
                </div>

                <div style={{ padding: "var(--space-3)", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-sm)" }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Compression Ratio</span>
                  <div style={{ fontWeight: 600, fontSize: "var(--font-size-base)", marginTop: "var(--space-1)" }}>
                    {ti.compression_ratio}:1
                  </div>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                    Raw raster vs stored bytes
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Metadata & EXIF Findings Card */}
          {ti && (
            <Card
              title="Metadata & EXIF Inspection"
              subtitle="Analysis of camera, software, timestamp, and geolocation headers"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {/* Status overview */}
                <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
                  <StatusBadge
                    status={ti.metadata_summary.has_exif ? "info" : "neutral"}
                    label={ti.metadata_summary.has_exif ? "EXIF Metadata Present" : "No EXIF Metadata Found"}
                  />
                  <StatusBadge
                    status={ti.metadata_summary.gps_status === "present_redacted_for_privacy" ? "warning" : "neutral"}
                    label={
                      ti.metadata_summary.gps_status === "present_redacted_for_privacy"
                        ? "GPS Data: Present (Redacted for Privacy)"
                        : "GPS Data: Not Present"
                    }
                  />
                  {ti.color_profile_present && (
                    <StatusBadge status="neutral" label="Embedded ICC Profile Present" />
                  )}
                </div>

                {/* Present Tags Grid */}
                {ti.metadata_summary.has_exif && Object.keys(ti.metadata_summary.tags_present).length > 0 ? (
                  <div>
                    <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "var(--space-2)" }}>
                      Recorded Metadata Tags
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "var(--space-3)",
                      }}
                    >
                      {Object.entries(ti.metadata_summary.tags_present).map(([tag, val]) => (
                        <div
                          key={tag}
                          style={{
                            padding: "var(--space-2) var(--space-3)",
                            backgroundColor: "var(--color-surface-muted)",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>{tag}</div>
                          <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 500, marginTop: "var(--space-1)" }}>
                            {String(val)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                    No camera or editing metadata tags were found in the file headers.
                  </div>
                )}

                {/* Absent Tags */}
                {ti.metadata_summary.tags_absent.length > 0 && (
                  <div>
                    <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
                      Standard Tags Not Present
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                      {ti.metadata_summary.tags_absent.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: "var(--font-size-xs)",
                            padding: "2px 8px",
                            backgroundColor: "var(--color-surface-muted)",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Crucial Metadata Educational Note */}
                <div
                  style={{
                    padding: "var(--space-3)",
                    backgroundColor: "var(--color-surface-muted)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-muted)",
                    lineHeight: "1.5",
                  }}
                >
                  <strong>Forensic Context:</strong> {ti.metadata_summary.note}
                </div>
              </div>
            </Card>
          )}

          {/* Technical Anomalies Card (if any) */}
          {ti && ti.anomalies.length > 0 && (
            <Card
              title="Structural Observations & Anomaly Signals"
              subtitle="Observable file structure flags detected during decoding"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {ti.anomalies.map((a, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: "var(--space-3)",
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--color-surface-muted)",
                      borderLeft: a.severity === "warning" ? "3px solid var(--color-warning)" : "3px solid var(--color-primary)",
                    }}
                  >
                    <StatusBadge
                      status={a.severity === "warning" ? "warning" : "info"}
                      label={a.category}
                    />
                    <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}>
                      {a.description}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Forensic Limitations & Disclaimers Box */}
          <Card
            title="Analysis Limitations & Disclaimers"
            subtitle="Understand what this analysis can and cannot establish"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {analysisReport.result?.limitations.map((lim, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    gap: "var(--space-2)",
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text)",
                    lineHeight: "1.5",
                  }}
                >
                  <span style={{ color: "var(--color-text-muted)", fontWeight: 700 }}>•</span>
                  <span>{lim}</span>
                </div>
              ))}

              <div
                style={{
                  marginTop: "var(--space-2)",
                  padding: "var(--space-3)",
                  backgroundColor: "var(--color-surface-muted)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-muted)",
                }}
              >
                <strong>AI Capability Disclosure:</strong> {ti?.ai_model_status || "AI synthetic detection evaluated using local quantized distilled ViT model on CPU."}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Intake / Input Form (shown when not viewing an active report) */}
      {!analysisReport && (
        <Card
          title="Start Technical Image Inspection"
          subtitle="Choose an existing evidence record or upload an image directly for verification"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            {/* Mode Selector */}
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <Button
                variant={mode === "evidence" ? "primary" : "secondary"}
                onClick={() => setMode("evidence")}
                type="button"
                disabled={loading}
              >
                Analyze Existing Evidence
              </Button>
              <Button
                variant={mode === "upload" ? "primary" : "secondary"}
                onClick={() => setMode("upload")}
                type="button"
                disabled={loading}
              >
                Upload New Image
              </Button>
            </div>

            {/* Error banners */}
            {fileValidationError && (
              <Alert type="warning" title="Invalid Image File">
                {fileValidationError}
              </Alert>
            )}

            {errorMessage && (
              <Alert type="error" title="Analysis Request Failed">
                {errorMessage}
              </Alert>
            )}

            {/* Honest Processing Status Indicator */}
            {loading && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  padding: "var(--space-4)",
                  backgroundColor: "var(--color-surface-muted)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <StatusBadge status="info" label="In Progress" />
                <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text)" }}>
                  {getProcessingMessage(processingStage)}
                </span>
              </div>
            )}

            {/* Mode A: Existing Evidence */}
            {mode === "evidence" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div>
                  <label
                    htmlFor="evidence-id-input"
                    style={{ display: "block", fontSize: "var(--font-size-sm)", fontWeight: 500, marginBottom: "var(--space-1)" }}
                  >
                    Evidence Record UUID
                  </label>
                  <input
                    id="evidence-id-input"
                    type="text"
                    value={evidenceId}
                    onChange={(e) => setEvidenceId(e.target.value)}
                    placeholder="e.g. e8a94fd3-670d-45bf-a75e-9a1b94ea9c07"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "var(--space-3)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "var(--font-size-sm)",
                      backgroundColor: "var(--color-surface)",
                      color: "var(--color-text)",
                    }}
                  />
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)", display: "block" }}>
                    Paste an Evidence UUID recorded during evidence intake to reuse its stored file and hash.
                  </span>
                </div>

                <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
                  <Button
                    variant="primary"
                    disabled={loading || !evidenceId.trim()}
                    onClick={() => handleAnalyzeEvidence(evidenceId)}
                  >
                    {loading ? "Analyzing Properties..." : "Run Technical Inspection"}
                  </Button>
                  {onNavigateToIntake && (
                    <Button variant="secondary" onClick={onNavigateToIntake} disabled={loading}>
                      Go to Evidence Intake
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Mode B: Direct Upload */}
            {mode === "upload" && (
              <form onSubmit={handleAnalyzeUpload} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div>
                  <label
                    htmlFor="direct-file-input"
                    style={{ display: "block", fontSize: "var(--font-size-sm)", fontWeight: 500, marginBottom: "var(--space-1)" }}
                  >
                    Choose Image (JPEG, PNG, WEBP • Max 25 MB)
                  </label>
                  <input
                    id="direct-file-input"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    disabled={loading}
                    style={{
                      display: "block",
                      fontSize: "var(--font-size-sm)",
                      marginTop: "var(--space-1)",
                    }}
                  />
                </div>

                {/* File Preview and Information */}
                {selectedFile && previewUrl && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-4)",
                      padding: "var(--space-3)",
                      backgroundColor: "var(--color-surface-muted)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt="Selected image preview"
                      style={{
                        maxHeight: "120px",
                        maxWidth: "160px",
                        borderRadius: "var(--radius-sm)",
                        objectFit: "contain",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--color-surface)",
                      }}
                    />
                    <div style={{ fontSize: "var(--font-size-xs)", lineHeight: "1.6" }}>
                      <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>{selectedFile.name}</div>
                      <div style={{ color: "var(--color-text-muted)" }}>
                        Size: {formatBytes(selectedFile.size)} ({selectedFile.size.toLocaleString()} bytes)
                      </div>
                      <div style={{ color: "var(--color-text-muted)" }}>
                        MIME type: {selectedFile.type || "image/unknown"}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <input
                    id="save-vault-checkbox"
                    type="checkbox"
                    checked={saveToVault}
                    onChange={(e) => setSaveToVault(e.target.checked)}
                    disabled={loading}
                  />
                  <label htmlFor="save-vault-checkbox" style={{ fontSize: "var(--font-size-sm)", cursor: "pointer" }}>
                    Also preserve this image in the Evidence Vault
                  </label>
                </div>

                <div>
                  <Button variant="primary" type="submit" disabled={loading || !selectedFile || !!fileValidationError}>
                    {loading ? "Analyzing Image..." : "Upload & Run Technical Inspection"}
                  </Button>
                </div>
              </form>
            )}

            {/* Privacy note */}
            <div
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-muted)",
                lineHeight: "1.5",
                borderTop: "1px solid var(--color-border)",
                paddingTop: "var(--space-3)",
              }}
            >
              <strong>Privacy Assurance:</strong> Processing executes locally on your Haven server. Uploaded images are never sent to external cloud APIs or unverified third-party machine learning services.
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
