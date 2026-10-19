# Haven — API Specification

**Version:** 1.0.0
**Base URL:** `/api/v1`
**Authentication:** Local forensic workspace (no external cloud dependencies)
**Content-Type:** `application/json` (except multipart file uploads and binary PDF exports)

---

## 1. System & Health Endpoints

### `GET /health`
Performs a fast liveness probe for orchestration and container health.
- **Response `200 OK`**:
  ```json
  { "status": "ok" }
  ```

### `GET /api/v1/status`
Returns deep system status including SQLite database connectivity and local AI engine availability.
- **Response `200 OK`**:
  ```json
  {
    "status": "ready",
    "database": "connected",
    "analysis_engine": "available"
  }
  ```

---

## 2. AI Forensics & Image Analysis Endpoints

### `POST /api/v1/analyses`
Registers an image file or references an existing Evidence record for forensic inspection.
- **Request Format:** `multipart/form-data`
  - `file`: Optional binary image file (`image/jpeg`, `image/png`, `image/webp`, max 25 MB).
  - `evidence_id`: Optional UUID string of an existing evidence record.
  - `save_to_vault`: Boolean (`true`/`false`), defaults to `true`.
- **Response `201 Created`**:
  ```json
  {
    "id": "2bbcefd8-28b0-4943-967c-f181c2f27c81",
    "status": "pending",
    "created_at": "2026-10-19T16:40:00Z",
    "evidence_id": "a15a513b-f794-4b2a-bef3-14a95274ba5d"
  }
  ```
- **Errors:**
  - `400 Bad Request`: Empty file or invalid form parameters.
  - `404 Not Found`: Referenced `evidence_id` does not exist.
  - `413 Payload Too Large`: Upload exceeds 25 MB limit.
  - `415 Unsupported Media Type`: Non-image or unsupported image format.
  - `422 Unprocessable Entity`: Corrupt image bytes or neither file nor evidence_id supplied.

---

### `POST /api/v1/analyses/{analysis_id}/run`
Executes technical image property extraction and local ONNX CPU inference for synthetic image detection.
- **Parameters:**
  - `analysis_id` (path, UUID): The analysis record identifier.
- **Response `200 OK`**:
  ```json
  {
    "id": "2bbcefd8-28b0-4943-967c-f181c2f27c81",
    "original_filename": "test_forensic_sample.jpg",
    "file_size_bytes": 78525,
    "mime_type_detected": "image/jpeg",
    "sha256": "5fc5a56006ce05f8b99ca397d475d0bd989cca6ef35d00b1eace2dd82cec9910",
    "status": "completed",
    "analysis_method": "technical_and_ai_synthetic_inspection",
    "model_name": "ai-image-detect-distilled-onnx",
    "model_version": "1.0.0",
    "created_at": "2026-10-19T16:40:00Z",
    "completed_at": "2026-10-19T16:40:01Z",
    "updated_at": "2026-10-19T16:40:01Z",
    "evidence_id": "a15a513b-f794-4b2a-bef3-14a95274ba5d",
    "result": {
      "label": "technical_inspection_completed",
      "score": 0.4822,
      "score_type": "synthetic_likelihood",
      "explanation": "Technical inspection verified a JPEG image with dimensions 720x1280 (9:16, 0.92 MP) in RGB color mode (8-bit, 3 channels).",
      "limitations": [
        "Technical image inspection measures observable digital properties and file encoding.",
        "The presence or absence of EXIF metadata is not proof of authenticity or manipulation.",
        "File byte hashing (SHA-256) verifies that stored bytes match a recorded digest; it does not confirm creator identity or creation time.",
        "No automated forensic tool can independently determine whether an image is authentic or fabricated without corroborating evidence."
      ],
      "technical_inspection": {
        "dimensions": {
          "width": 720,
          "height": 1280,
          "megapixels": 0.92,
          "aspect_ratio": "9:16",
          "total_pixels": 921600
        },
        "format": "JPEG",
        "mime_type": "image/jpeg",
        "mode": "RGB",
        "bit_depth": 8,
        "color_channels": 3,
        "has_transparency": false,
        "color_profile_present": false,
        "file_size_bytes": 78525,
        "compression_ratio": 35.21,
        "metadata_summary": {
          "has_exif": false,
          "tags_present": {},
          "tags_absent": ["Make", "Model", "DateTimeOriginal", "Software", "GPSInfo"],
          "gps_status": "not_present",
          "note": "Standard camera metadata tags are absent. Common when images are shared via messaging platforms, re-saved, or exported by editing software."
        },
        "anomalies": [],
        "ai_model_status": "Local AI model (ai-image-detect-distilled-onnx v1.0.0) executed via ONNX Runtime on CPU."
      },
      "ai_forensics": {
        "task": "AI-Generated Image Detection",
        "model_name": "ai-image-detect-distilled-onnx",
        "model_version": "1.0.0",
        "model_available": true,
        "inference_status": "success",
        "status": "success",
        "raw_score": 0.4822,
        "synthetic_likelihood": 0.4822,
        "score_semantics": "Softmax output probability over [fake, real] classes; index 0 represents synthetic probability on [0.0, 1.0] scale.",
        "label": "inconclusive_synthetic_signals",
        "indicator": "inconclusive",
        "inference_latency_ms": 104.6,
        "latency_ms": 104.6,
        "explanation": "Model inference produced ambiguous or mixed feature signals (synthetic score: 48.2%). The visual evidence does not clearly separate synthetic generation from camera capture.",
        "limitations": [
          "Trained on specific generative models (e.g. Midjourney, Stable Diffusion). Novel architectures or custom fine-tunes may not be reliably detected.",
          "Social media recompression, format transcoding, and downscaling degrade high-frequency synthetic artifacts.",
          "False positives occur on heavily edited, filtered, or CGI images; false negatives occur on highly photorealistic or hybrid content.",
          "Score is a continuous mathematical likelihood estimate, not a legally binding authenticity certification."
        ],
        "evaluation_status": "uncalibrated_raw_model_estimate",
        "error_message": null
      }
    }
  }
  ```
- **Errors:**
  - `404 Not Found`: Analysis record does not exist.
  - `409 Conflict`: Analysis is already completed or currently processing.
  - `422 Unprocessable Entity`: Stored image file is missing, corrupt, or unreadable.

---

### `GET /api/v1/analyses/{analysis_id}`
Retrieves a saved analysis record by ID.
- **Parameters:**
  - `analysis_id` (path, UUID)
- **Response `200 OK`**: Matches canonical `AnalysisResponse` schema above.
- **Errors:**
  - `404 Not Found`: Analysis record not found.

---

### `GET /api/v1/analyses`
Returns a paginated list of all analysis records ordered descending by creation date.
- **Query Parameters:**
  - `limit`: integer (default 20, max 100)
  - `offset`: integer (default 0)
- **Response `200 OK`**:
  ```json
  {
    "items": [ ... ],
    "total": 42,
    "limit": 20,
    "offset": 0
  }
  ```

---

### `GET /api/v1/analyses/{analysis_id}/export`
Generates an in-memory downloadable PDF technical forensic report from persisted records.
- **Parameters:**
  - `analysis_id` (path, UUID)
- **Response `200 OK`**:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="haven-analysis-{analysis_id}.pdf"`
- **Errors:**
  - `404 Not Found`: Analysis record not found.
  - `409 Conflict`: Analysis record is incomplete (`status != "completed"`).

---

### `POST /api/v1/evidence/{evidence_id}/analyze`
Directly triggers or retrieves forensic analysis for a specific evidence item in the Evidence Vault.
- **Parameters:**
  - `evidence_id` (path, UUID)
- **Response `200 OK`**: Matches canonical `AnalysisResponse` schema.
- **Errors:**
  - `404 Not Found`: Evidence record does not exist.
  - `422 Unprocessable Entity`: Evidence item is not an image or stored file is corrupt.

---

## 3. Privacy & Security Constraints

1. **Local Processing Only:** All AI inference and technical inspections run on the local host CPU via ONNX Runtime. Images are never transmitted across the network or sent to external cloud APIs.
2. **GPS Metadata Redaction:** Latitude, longitude, and altitude EXIF coordinates are scrubbed during ingestion and marked `"present_redacted_for_privacy"`. Exact location values are never logged, returned over the API, or embedded in exported PDFs.
3. **Evidence Isolation:** Evidence files are stored in protected backend storage directories outside of web server document roots. File access is mediated exclusively through authenticated application endpoints using cryptographically verified SHA-256 digests.
