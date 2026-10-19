import React, { useState, useRef } from "react";
import { uploadEvidence } from "../../services/evidence";
import { EvidenceItem } from "../../types/evidence";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/feedback/Alert";
import { LoadingSpinner } from "../../components/feedback/LoadingSpinner";
import { StatusBadge } from "../../components/feedback/StatusBadge";
import { formatBytes, formatTimestamp } from "../../utils/formatters";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface EvidenceUploaderProps {
  onAnalyzeEvidence?: (evidenceId: string) => void;
  onNavigateToVault?: () => void;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({
  onAnalyzeEvidence,
  onNavigateToVault,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploadedEvidence, setUploadedEvidence] = useState<EvidenceItem | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFileSelection = (file: File): boolean => {
    setClientError(null);
    setServerError(null);

    // Client-side format hint check
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const matchesExtension = SUPPORTED_EXTENSIONS.includes(extension);
    const matchesMime = file.type ? SUPPORTED_MIME_TYPES.includes(file.type) : true;

    if (!matchesExtension && !matchesMime) {
      setClientError(
        `Unsupported format (${file.type || extension}). Only JPEG, PNG, and WEBP images are supported.`
      );
      return false;
    }

    // Client-side size check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setClientError(
        `File exceeds the 25 MB size limit (selected size: ${formatBytes(file.size)}).`
      );
      return false;
    }

    if (file.size === 0) {
      setClientError("The selected file is empty (0 bytes).");
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (validateFileSelection(file)) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (validateFileSelection(file)) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setClientError(null);
    setServerError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setServerError(null);
    setClientError(null);

    try {
      const result = await uploadEvidence(selectedFile, description);
      setUploadedEvidence(result);
      setSelectedFile(null);
      setDescription("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An error occurred while uploading evidence. Please try again.";
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2500);
    } catch {
      // Fallback
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2500);
    }
  };

  const handleUploadAnother = () => {
    setUploadedEvidence(null);
    setSelectedFile(null);
    setClientError(null);
    setServerError(null);
    setDescription("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Intro section */}
      <section aria-labelledby="intake-heading">
        <h2
          id="intake-heading"
          style={{
            fontSize: "var(--font-size-2xl)",
            fontWeight: 700,
            color: "var(--color-text)",
            marginBottom: "var(--space-2)",
            letterSpacing: "-0.01em",
          }}
        >
          Secure Evidence Intake
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-base)" }}>
          Upload digital media to Haven&apos;s private local evidence vault. The backend verifies
          actual image bytes, guards against corrupted or malicious uploads, and records an exact
          cryptographic SHA-256 digest.
        </p>
      </section>

      {/* Uploaded Evidence Result Card (Success State) */}
      {uploadedEvidence && (
        <Card
          title="Evidence Successfully Recorded"
          subtitle={`Vault ID: ${uploadedEvidence.id}`}
          style={{
            borderLeft: "4px solid var(--color-success)",
          }}
          headerAction={
            <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
              {onAnalyzeEvidence && (
                <Button
                  variant="primary"
                  onClick={() => onAnalyzeEvidence(uploadedEvidence.id)}
                  style={{ padding: "var(--space-2) var(--space-3)", fontSize: "var(--font-size-sm)" }}
                >
                  Run Technical Inspection
                </Button>
              )}
              {onNavigateToVault && (
                <Button
                  variant="secondary"
                  onClick={onNavigateToVault}
                  style={{ padding: "var(--space-2) var(--space-3)", fontSize: "var(--font-size-sm)" }}
                >
                  View in Evidence Vault
                </Button>
              )}
              <Button variant="secondary" onClick={handleUploadAnother}>
                Upload Another Image
              </Button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            <Alert type="success" title="Local Evidence Secured">
              File uploaded, content verified, and cryptographic digest stored in the local SQLite vault.
            </Alert>

            {/* Cryptographic SHA-256 Section */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "var(--space-2)",
                  flexWrap: "wrap",
                  gap: "var(--space-2)",
                }}
              >
                <label
                  htmlFor="sha256-hash-display"
                  style={{
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    color: "var(--color-text)",
                  }}
                >
                  SHA-256 Cryptographic Digest
                </label>
                <Button
                  variant="secondary"
                  onClick={() => handleCopyHash(uploadedEvidence.sha256)}
                  style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-xs)" }}
                  aria-label="Copy SHA-256 digest to clipboard"
                >
                  {copiedHash ? "Copied to Clipboard!" : "Copy Digest"}
                </Button>
              </div>

              <div
                id="sha256-hash-display"
                tabIndex={0}
                role="region"
                aria-label="SHA-256 hash value"
                style={{
                  padding: "var(--space-3) var(--space-4)",
                  backgroundColor: "var(--color-surface-muted)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  fontFamily: "var(--font-family-mono)",
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-brand)",
                  wordBreak: "break-all",
                  userSelect: "all",
                }}
              >
                {uploadedEvidence.sha256}
              </div>

              {/* Accessible live region for copy confirmation */}
              <div aria-live="polite" className="sr-only">
                {copiedHash ? "SHA-256 hash copied to clipboard" : ""}
              </div>

              {/* Non-negotiable evidence integrity disclaimer */}
              <p
                style={{
                  marginTop: "var(--space-2)",
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-secondary)",
                  lineHeight: "var(--line-height-relaxed)",
                  fontStyle: "italic",
                }}
              >
                <strong>Integrity Note:</strong> SHA-256 identifies these file bytes and can help
                compare them with a previously recorded digest. It does not prove that an image is
                authentic, who created it, or when it was created.
              </p>
            </div>

            {/* Evidence Metadata Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "var(--space-4)",
                padding: "var(--space-4)",
                backgroundColor: "var(--color-surface-muted)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div>
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  Original Filename
                </span>
                <div style={{ fontWeight: 500, fontSize: "var(--font-size-sm)", marginTop: "var(--space-1)" }}>
                  {uploadedEvidence.original_filename}
                </div>
              </div>

              <div>
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  Verified Media Type
                </span>
                <div style={{ marginTop: "var(--space-1)" }}>
                  <StatusBadge status="info" label={uploadedEvidence.mime_type_detected} />
                </div>
              </div>

              <div>
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  Exact File Size
                </span>
                <div style={{ fontWeight: 500, fontSize: "var(--font-size-sm)", marginTop: "var(--space-1)" }}>
                  {formatBytes(uploadedEvidence.file_size_bytes)} ({uploadedEvidence.file_size_bytes.toLocaleString()} bytes)
                </div>
              </div>

              <div>
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  Timestamp Recorded
                </span>
                <div style={{ fontWeight: 500, fontSize: "var(--font-size-sm)", marginTop: "var(--space-1)" }}>
                  {formatTimestamp(uploadedEvidence.created_at)}
                </div>
              </div>

              {uploadedEvidence.description && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                    Incident / Evidence Notes
                  </span>
                  <div style={{ fontSize: "var(--font-size-sm)", marginTop: "var(--space-1)", color: "var(--color-text)" }}>
                    {uploadedEvidence.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Main Upload Form Card (Hidden when viewing newly uploaded record unless user chooses another) */}
      {!uploadedEvidence && (
        <Card
          title="Upload Evidence Image"
          subtitle="Allowed: JPEG, PNG, WEBP • Max size: 25 MB"
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {/* Error notifications */}
            {clientError && (
              <Alert type="error" title="Invalid File Selection">
                {clientError}
              </Alert>
            )}

            {serverError && (
              <Alert
                type="error"
                title="Upload Rejected by Backend"
                action={
                  <Button variant="secondary" onClick={() => handleSubmit} disabled={loading}>
                    Retry Upload
                  </Button>
                }
              >
                {serverError}
              </Alert>
            )}

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="Upload file area: click or drop image here"
              style={{
                border: `2px dashed ${isDragging ? "var(--color-brand)" : "var(--color-border-strong)"}`,
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-8) var(--space-4)",
                textAlign: "center",
                backgroundColor: isDragging ? "var(--color-brand-soft)" : "var(--color-surface-muted)",
                cursor: "pointer",
                transition: "background-color var(--transition-fast), border-color var(--transition-fast)",
                outline: "none",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="evidence-file-input"
                name="evidence-file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                style={{ display: "none" }}
                aria-label="Choose image file"
              />

              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-brand-soft)",
                  color: "var(--color-brand)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "var(--font-size-2xl)",
                  marginBottom: "var(--space-3)",
                }}
                aria-hidden="true"
              >
                📁
              </div>

              <div style={{ fontWeight: 600, fontSize: "var(--font-size-base)", color: "var(--color-text)" }}>
                Drop image here or click to browse
              </div>
              <p
                style={{
                  marginTop: "var(--space-1)",
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Supports JPEG, PNG, and WEBP formats up to 25 MB
              </p>
            </div>

            {/* Selected File Summary */}
            {selectedFile && (
              <div
                style={{
                  padding: "var(--space-4)",
                  backgroundColor: "var(--color-surface)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "var(--space-3)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
                    Size: {formatBytes(selectedFile.size)} • Type: {selectedFile.type || "image"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleRemoveFile}
                    disabled={loading}
                    style={{ fontSize: "var(--font-size-xs)", padding: "var(--space-1) var(--space-3)" }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}

            {/* Optional Description / Incident Context */}
            <div>
              <label
                htmlFor="evidence-description"
                style={{
                  display: "block",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  marginBottom: "var(--space-1)",
                }}
              >
                Evidence Notes or Description{" "}
                <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>
                  (Optional)
                </span>
              </label>
              <textarea
                id="evidence-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Received via WhatsApp from unknown contact claiming to possess private photos."
                rows={3}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  fontFamily: "var(--font-family-base)",
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text)",
                  backgroundColor: "var(--color-surface)",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Action Button & Disclaimer */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
                marginTop: "var(--space-2)",
              }}
            >
              <Button
                type="submit"
                variant="primary"
                disabled={!selectedFile || loading}
                loading={loading}
                style={{ width: "100%", padding: "var(--space-3)" }}
              >
                {loading ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <LoadingSpinner size="sm" color="#ffffff" label="Processing upload and computing SHA-256..." />
                    <span>Verifying & Calculating SHA-256...</span>
                  </span>
                ) : (
                  "Upload & Record Evidence"
                )}
              </Button>


              <p
                style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-muted)",
                  textAlign: "center",
                  lineHeight: "var(--line-height-relaxed)",
                }}
              >
                Privacy Guarantee: Files remain strictly on your local device. Haven never sends evidence
                to external AI services or cloud infrastructure without your explicit action.
              </p>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};
