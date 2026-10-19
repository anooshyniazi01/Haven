/**
 * Utility for triggering browser file downloads with safe filename handling and URL cleanup.
 */

export function triggerPdfDownload(blob: Blob, filename: string): void {
  // Enforce a safe alphanumeric + hyphen + period filename
  const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, "_") || "haven-analysis-report.pdf";

  if (typeof window === "undefined" || !window.URL || typeof window.URL.createObjectURL !== "function") {
    return;
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();

  // Safely clean up DOM and revoke Object URL
  setTimeout(() => {
    if (a.parentNode) {
      a.parentNode.removeChild(a);
    }
    if (window.URL && typeof window.URL.revokeObjectURL === "function") {
      window.URL.revokeObjectURL(url);
    }
  }, 100);
}
