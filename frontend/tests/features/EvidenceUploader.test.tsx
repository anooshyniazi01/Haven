import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

import userEvent from "@testing-library/user-event";
import { EvidenceUploader } from "../../src/features/evidence/EvidenceUploader";
import * as evidenceService from "../../src/services/evidence";

describe("EvidenceUploader Feature Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders upload instructions, supported formats, and size limits", () => {
    render(<EvidenceUploader />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Secure Evidence Intake" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Supports JPEG, PNG, and WEBP formats up to 25 MB/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Upload & Record Evidence/i })
    ).toBeDisabled();
  });

  it("rejects an oversized file with client-side validation error", async () => {
    render(<EvidenceUploader />);

    // Create a 26 MB dummy file
    const oversizedFile = new File([new ArrayBuffer(26 * 1024 * 1024)], "huge.jpg", {
      type: "image/jpeg",
    });

    const fileInput = screen.getByLabelText(/Choose image file/i);
    await userEvent.upload(fileInput, oversizedFile);

    expect(
      screen.getByText(/File exceeds the 25 MB size limit/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Upload & Record Evidence/i })
    ).toBeDisabled();
  });

  it("rejects an unsupported file type with client-side validation error", async () => {
    render(<EvidenceUploader />);

    const textFile = new File(["not an image"], "document.txt", {
      type: "text/plain",
    });

    const fileInput = screen.getByLabelText(/Choose image file/i);
    fireEvent.change(fileInput, { target: { files: [textFile] } });

    expect(
      screen.getByText(/Unsupported format/i)
    ).toBeInTheDocument();
  });


  it("displays selected file summary and enables removal", async () => {
    render(<EvidenceUploader />);

    const validFile = new File(["valid-bytes"], "suspicious.jpg", {
      type: "image/jpeg",
    });

    const fileInput = screen.getByLabelText(/Choose image file/i);
    await userEvent.upload(fileInput, validFile);

    expect(screen.getByText("suspicious.jpg")).toBeInTheDocument();
    const removeBtn = screen.getByRole("button", { name: "Remove" });
    expect(removeBtn).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /Upload & Record Evidence/i });
    expect(submitBtn).toBeEnabled();

    // Click remove
    await userEvent.click(removeBtn);
    expect(screen.queryByText("suspicious.jpg")).not.toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
  });

  it("handles successful upload and displays SHA-256 hash with disclaimer", async () => {
    const mockResult = {
      id: "vault-uuid-1234",
      original_filename: "blackmail_photo.png",
      file_size_bytes: 4096,
      mime_type_detected: "image/png",
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      description: "Threatening image received in chat",
      created_at: "2026-10-17T07:15:00Z",
    };

    const uploadSpy = vi
      .spyOn(evidenceService, "uploadEvidence")
      .mockResolvedValueOnce(mockResult);

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(<EvidenceUploader />);

    const validFile = new File(["image-bytes"], "blackmail_photo.png", {
      type: "image/png",
    });
    const fileInput = screen.getByLabelText(/Choose image file/i);
    await userEvent.upload(fileInput, validFile);

    // Add optional description
    const descInput = screen.getByLabelText(/Evidence Notes or Description/i);
    await userEvent.type(descInput, "Threatening image received in chat");

    const submitBtn = screen.getByRole("button", { name: /Upload & Record Evidence/i });
    await userEvent.click(submitBtn);

    expect(uploadSpy).toHaveBeenCalledWith(validFile, "Threatening image received in chat");

    await waitFor(() => {
      expect(screen.getByText("Evidence Successfully Recorded")).toBeInTheDocument();
      expect(screen.getByText("Vault ID: vault-uuid-1234")).toBeInTheDocument();
      expect(screen.getByText(mockResult.sha256)).toBeInTheDocument();
      expect(screen.getByText("blackmail_photo.png")).toBeInTheDocument();
      expect(screen.getByText("Threatening image received in chat")).toBeInTheDocument();
    });

    // Check mandatory integrity disclaimer
    expect(
      screen.getByText(/SHA-256 identifies these file bytes and can help compare them/i)
    ).toBeInTheDocument();

    // Test Copy Hash button
    const copyBtn = screen.getByRole("button", { name: /Copy SHA-256 digest to clipboard/i });
    await userEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockResult.sha256);
    expect(screen.getByText("Copied to Clipboard!")).toBeInTheDocument();

    // Test Upload Another Image button
    const anotherBtn = screen.getByRole("button", { name: /Upload Another Image/i });
    await userEvent.click(anotherBtn);
    expect(screen.queryByText("Evidence Successfully Recorded")).not.toBeInTheDocument();
  });

  it("handles backend error response and provides retry", async () => {
    vi.spyOn(evidenceService, "uploadEvidence").mockRejectedValueOnce(
      new Error("This image format is not supported (HTTP 415)")
    );

    render(<EvidenceUploader />);

    const validFile = new File(["disguised-content"], "fake.jpg", {
      type: "image/jpeg",
    });
    const fileInput = screen.getByLabelText(/Choose image file/i);
    await userEvent.upload(fileInput, validFile);

    const submitBtn = screen.getByRole("button", { name: /Upload & Record Evidence/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Upload Rejected by Backend")).toBeInTheDocument();
      expect(
        screen.getByText("This image format is not supported (HTTP 415)")
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Retry Upload/i })).toBeInTheDocument();
    });
  });
});
