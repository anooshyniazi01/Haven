"""PDF Report Export Service for Haven Forensic Workspace.
Generates in-memory downloadable PDF technical inspection reports using ReportLab.
Conforms to docs/API_SPEC.md Section 10, docs/ACCEPTANCE_CRITERIA.md AC-08,
docs/PRIVACY.md Section 12, and docs/SECURITY.md.
"""

from datetime import datetime, timezone
import html
import io
import json
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from sqlalchemy.orm import Session

from app.core.errors import AnalysisStateError
from app.core.logging import get_logger
from app.db.models.analysis import Analysis
from app.db.models.evidence import Evidence
from app.schemas.analysis import AIForensicsResult, TechnicalInspectionResult

logger = get_logger("services.pdf_exporter")


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas for dynamic total page count and running header/footer."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        kwargs["pageCompression"] = 0
        self.report_id: str = kwargs.pop("report_id", "")
        super().__init__(*args, **kwargs)
        self._saved_page_states: List[Dict[str, Any]] = []

    def showPage(self) -> None:
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self) -> None:
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int) -> None:
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Running header on page 2+
        if self._pageNumber > 1:
            self.drawString(45, 755, "Haven Forensic Workspace — Technical Inspection Report")
            short_id = self.report_id[:12] if self.report_id else ""
            self.drawRightString(612 - 45, 755, f"Analysis: {short_id}...")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(45, 747, 612 - 45, 747)

        # Running footer on every page
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(45, 42, 612 - 45, 42)
        self.drawString(
            45,
            30,
            "Confidential — Haven AI Blackmail Protection & Digital Media Forensics",
        )
        self.drawRightString(612 - 45, 30, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


def safe_text(text: Optional[str]) -> str:
    """Sanitize and HTML-escape untrusted text for safe ReportLab rendering."""
    if text is None:
        return ""
    # Strip dangerous ASCII control characters except newline and tab
    clean = "".join(ch for ch in str(text) if ch in ("\n", "\t") or ord(ch) >= 32)
    return html.escape(clean)


def format_bytes(bytes_count: Optional[int]) -> str:
    """Format bytes into readable units."""
    if bytes_count is None:
        return "Unknown"
    if bytes_count < 1024:
        return f"{bytes_count} B"
    elif bytes_count < 1024 * 1024:
        return f"{bytes_count / 1024:.2f} KB"
    else:
        return f"{bytes_count / (1024 * 1024):.2f} MB"


def format_timestamp(dt: Optional[datetime]) -> str:
    """Format datetime in UTC for clear forensic logging."""
    if not dt:
        return "Not recorded"
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def generate_analysis_pdf(analysis: Analysis, db: Session) -> bytes:
    """Generate a forensic-grade PDF report from persisted analysis data.

    Raises:
        AnalysisStateError: If the analysis is not in 'completed' status.
    """
    if analysis.status != "completed":
        raise AnalysisStateError(
            f"Analysis '{analysis.id}' is in status '{analysis.status}'. "
            "Only completed analyses can be exported as PDF reports."
        )

    # Deserialize technical inspection result and AI forensics if available
    inspection: Optional[TechnicalInspectionResult] = None
    ai_forensics: Optional[AIForensicsResult] = None
    if analysis.technical_details_json:
        try:
            raw_details = json.loads(analysis.technical_details_json)
            if isinstance(raw_details, dict) and "technical_inspection" in raw_details:
                inspection = TechnicalInspectionResult.model_validate(raw_details["technical_inspection"])
                if "ai_forensics" in raw_details and raw_details["ai_forensics"]:
                    ai_forensics = AIForensicsResult.model_validate(raw_details["ai_forensics"])
            else:
                inspection = TechnicalInspectionResult.model_validate(raw_details)
        except Exception as e:
            logger.warning(
                "Could not deserialize technical_details_json for analysis %s: %s",
                analysis.id,
                str(e),
            )


    # Deserialize limitations
    limitations: List[str] = []
    if analysis.limitations_json:
        try:
            parsed = json.loads(analysis.limitations_json)
            if isinstance(parsed, list):
                limitations = [str(item) for item in parsed]
        except Exception:
            limitations = []

    # In-memory byte buffer
    buffer = io.BytesIO()

    # Document setup: Letter size with 45pt (~0.625in) margins
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=45,
        rightMargin=45,
        topMargin=45,
        bottomMargin=50,
        pageCompression=0,
    )

    # Typography & Styles
    base_styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=base_styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0F172A"),
        alignment=0,
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=base_styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#0D9488"),
        textTransform="uppercase",
        spaceAfter=10,
    )

    section_heading_style = ParagraphStyle(
        "SectionHeading",
        parent=base_styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "ReportBody",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155"),
    )

    body_muted = ParagraphStyle(
        "ReportBodyMuted",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#64748B"),
    )

    mono_style = ParagraphStyle(
        "ReportMono",
        parent=base_styles["Code"],
        fontName="Courier",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0F172A"),
        wordWrap="CJK",
    )

    notice_title_style = ParagraphStyle(
        "NoticeTitle",
        parent=base_styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=2,
    )

    notice_body_style = ParagraphStyle(
        "NoticeBody",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#475569"),
    )

    disclaimer_style = ParagraphStyle(
        "DisclaimerStyle",
        parent=base_styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#065F46"),
    )

    story: List[Any] = []

    # 1. Header Banner
    story.append(Paragraph("HAVEN FORENSIC WORKSPACE", subtitle_style))
    story.append(
        Paragraph("Technical Image Inspection Report", title_style)
    )
    story.append(
        Paragraph(
            f"Report Generated: {format_timestamp(datetime.now(timezone.utc))}  •  "
            f"Analysis ID: {safe_text(analysis.id)}",
            body_muted,
        )
    )
    story.append(Spacer(1, 8))
    story.append(
        HRFlowable(
            width="100%",
            thickness=1.5,
            color=colors.HexColor("#0D9488"),
            spaceBefore=2,
            spaceAfter=10,
        )
    )

    # 2. Prominent Notice Callout Box
    notice_text = (
        "<b>Notice — Automated Technical Image Inspection:</b><br/>"
        "This report was automatically produced by Haven to document verifiable technical measurements, "
        "encoding structures, and metadata observations extracted from an uploaded image. It distinguishes "
        "reproducible technical findings from unverified conclusions. It does NOT constitute a legal verdict, "
        "definitive proof of origin, or a guaranteed detection of manipulation."
    )
    notice_table = Table(
        [[Paragraph(notice_text, notice_body_style)]],
        colWidths=[522],
    )
    notice_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(notice_table)
    story.append(Spacer(1, 10))

    # 3. Section 1: Evidence Record & Cryptographic Hash
    story.append(
        Paragraph("1. Preserved Evidence Record & Cryptographic Hash", section_heading_style)
    )

    evidence_data = [
        [
            Paragraph("<b>Display Filename:</b>", body_style),
            Paragraph(safe_text(analysis.original_filename), body_style),
            Paragraph("<b>Detected MIME Type:</b>", body_style),
            Paragraph(safe_text(analysis.mime_type_detected), body_style),
        ],
        [
            Paragraph("<b>File Size:</b>", body_style),
            Paragraph(
                f"{format_bytes(analysis.file_size_bytes)} ({analysis.file_size_bytes:,} bytes)",
                body_style,
            ),
            Paragraph("<b>Intake Timestamp:</b>", body_style),
            Paragraph(format_timestamp(analysis.created_at), body_style),
        ],
        [
            Paragraph("<b>Inspection Completed:</b>", body_style),
            Paragraph(format_timestamp(analysis.completed_at), body_style),
            Paragraph("<b>Lifecycle Status:</b>", body_style),
            Paragraph(f"<b>{safe_text(analysis.status).upper()}</b>", body_style),
        ],
    ]

    ev_table = Table(evidence_data, colWidths=[110, 151, 110, 151])
    ev_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(ev_table)
    story.append(Spacer(1, 6))

    # Cryptographic SHA-256 Callout
    hash_box = Table(
        [
            [
                Paragraph("<b>Recorded SHA-256 Digest:</b>", notice_title_style),
            ],
            [
                Paragraph(safe_text(analysis.sha256), mono_style),
            ],
            [
                Paragraph(
                    "<b>Cryptographic Disclaimer:</b> A matching SHA-256 digest indicates that the file "
                    "bytes match the recorded digest. It does not prove authenticity, original provenance, "
                    "who created the image, when it was created, or whether it was edited before intake.",
                    disclaimer_style,
                )
            ],
        ],
        colWidths=[522],
    )
    hash_box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ECFDF5")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#A7F3D0")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(hash_box)
    story.append(Spacer(1, 10))

    # 4. Section 2: Technical Inspection Findings
    story.append(
        Paragraph("2. Verifiable Technical Measurements & Structure", section_heading_style)
    )

    if inspection:
        dims = inspection.dimensions
        tech_data = [
            [
                Paragraph("<b>Image Dimensions:</b>", body_style),
                Paragraph(f"{dims.width} × {dims.height} pixels", body_style),
                Paragraph("<b>Megapixels / Total:</b>", body_style),
                Paragraph(f"{dims.megapixels:.2f} MP ({dims.total_pixels:,} px)", body_style),
            ],
            [
                Paragraph("<b>Aspect Ratio:</b>", body_style),
                Paragraph(safe_text(dims.aspect_ratio), body_style),
                Paragraph("<b>Decoded Format:</b>", body_style),
                Paragraph(safe_text(inspection.format), body_style),
            ],
            [
                Paragraph("<b>Color Mode:</b>", body_style),
                Paragraph(safe_text(inspection.mode), body_style),
                Paragraph("<b>Color Channels:</b>", body_style),
                Paragraph(f"{inspection.color_channels} channels ({inspection.bit_depth}-bit)", body_style),
            ],
            [
                Paragraph("<b>Transparency (Alpha):</b>", body_style),
                Paragraph("Present" if inspection.has_transparency else "None", body_style),
                Paragraph("<b>Color Profile (ICC):</b>", body_style),
                Paragraph("Embedded profile present" if inspection.color_profile_present else "Standard / None", body_style),
            ],
            [
                Paragraph("<b>Compression Ratio:</b>", body_style),
                Paragraph(f"{inspection.compression_ratio:.2f}:1", body_style),
                Paragraph("<b>Encoding Sanity:</b>", body_style),
                Paragraph("Valid structural bitstream", body_style),
            ],
        ]

        tech_table = Table(tech_data, colWidths=[110, 151, 110, 151])
        tech_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(tech_table)
    else:
        story.append(
            Paragraph("Detailed technical measurements are not recorded for this analysis.", body_muted)
        )

    story.append(Spacer(1, 10))

    # 5. Section 3: Metadata & EXIF Observations (GPS Excluded)
    story.append(
        Paragraph("3. Metadata & EXIF Analysis (Privacy Protected)", section_heading_style)
    )

    if inspection and inspection.metadata_summary:
        meta = inspection.metadata_summary
        meta_rows = [
            [
                Paragraph("<b>EXIF Metadata Status:</b>", body_style),
                Paragraph("Readable EXIF present" if meta.has_exif else "No EXIF metadata found", body_style),
            ],
            [
                Paragraph("<b>Geolocation Data:</b>", body_style),
                Paragraph("<b>Redacted / Excluded.</b> For safety and privacy, raw GPS coordinates are never exported.", body_style),
            ],
            [
                Paragraph("<b>Platform Context Note:</b>", body_style),
                Paragraph(safe_text(meta.note), body_muted),
            ],
        ]

        # Include safe tags if present
        if meta.tags_present:
            tag_strings = [f"<b>{safe_text(k)}:</b> {safe_text(str(v))}" for k, v in meta.tags_present.items()]
            meta_rows.append(
                [
                    Paragraph("<b>Extracted Safe Tags:</b>", body_style),
                    Paragraph("<br/>".join(tag_strings), body_style),
                ]
            )

        meta_table = Table(meta_rows, colWidths=[120, 402])
        meta_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(meta_table)
    else:
        story.append(
            Paragraph("No metadata summary recorded for this analysis.", body_muted)
        )

    story.append(Spacer(1, 10))

    # 6. Section 4: AI Model Findings & Synthetic Media Assessment
    story.append(
        Paragraph("4. AI Model Findings & Synthetic Media Assessment", section_heading_style)
    )

    ai_method = analysis.analysis_method or "Automated Image Inspector"
    ai_model = analysis.model_name or (ai_forensics.model_name if ai_forensics else None)
    ai_version = analysis.model_version or (ai_forensics.model_version if ai_forensics else "N/A")

    if ai_model and analysis.result_score is not None:
        score_pct = f"{analysis.result_score:.1%} ({analysis.result_score:.4f})"
        latency_str = f"{ai_forensics.inference_latency_ms:.1f} ms (local CPU)" if ai_forensics and ai_forensics.inference_latency_ms else "Measured on CPU"
        eval_status = ai_forensics.evaluation_status if ai_forensics else "Uncalibrated Raw Model Estimate"

        ai_table = Table(
            [
                [
                    Paragraph("<b>Forensic Task:</b>", body_style),
                    Paragraph("AI-Generated Image Detection (Synthetic Media)", body_style),
                    Paragraph("<b>AI Model & Version:</b>", body_style),
                    Paragraph(f"{safe_text(ai_model)} (v{safe_text(ai_version)})", body_style),
                ],
                [
                    Paragraph("<b>Synthetic Likelihood:</b>", body_style),
                    Paragraph(f"<b>{score_pct}</b>", body_style),
                    Paragraph("<b>Indicator Assessment:</b>", body_style),
                    Paragraph(f"<b>{safe_text(analysis.result_label)}</b>", body_style),
                ],
                [
                    Paragraph("<b>Score Semantics:</b>", body_style),
                    Paragraph(safe_text(analysis.score_type or "raw_model_score_synthetic_probability"), body_style),
                    Paragraph("<b>Inference Latency:</b>", body_style),
                    Paragraph(latency_str, body_style),
                ],
                [
                    Paragraph("<b>Evaluation Status:</b>", body_style),
                    Paragraph(
                        f"<b>{safe_text(eval_status)}:</b> Direct model output probability. "
                        "Not a verified Bayesian probability or guaranteed proof of authenticity.",
                        body_muted,
                    ),
                    Paragraph("", body_style),
                    Paragraph("", body_style),
                ],
            ],
            colWidths=[115, 146, 115, 146],
        )
    else:
        ai_status_notice = (
            "<b>No validated model-based AI synthetic classification was performed for this analysis.</b> "
            "The inspection pipeline evaluated structural file properties, encoding consistency, and metadata indicators only. "
            "Haven does not produce simulated or unverified AI detection scores."
        )
        ai_table = Table(
            [
                [
                    Paragraph("<b>Inspection Method:</b>", body_style),
                    Paragraph(safe_text(ai_method), body_style),
                    Paragraph("<b>AI Model / Version:</b>", body_style),
                    Paragraph(f"{safe_text(ai_model or 'None / Technical inspection only')} ({safe_text(ai_version)})", body_style),
                ],
                [
                    Paragraph("<b>Classification Status:</b>", body_style),
                    Paragraph(ai_status_notice, body_muted),
                    Paragraph("", body_style),
                    Paragraph("", body_style),
                ],
            ],
            colWidths=[110, 151, 110, 151],
        )

    ai_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("SPAN", (1, 1), (3, 1)) if not (ai_model and analysis.result_score is not None) else ("SPAN", (1, 3), (3, 3)),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(ai_table)
    story.append(Spacer(1, 10))

    # 7. Section 5: Technical Anomaly Indicators
    story.append(
        Paragraph("5. Technical Anomaly Indicators", section_heading_style)
    )

    if inspection and inspection.anomalies:
        anomaly_rows = [
            [
                Paragraph("<b>Category</b>", body_style),
                Paragraph("<b>Severity</b>", body_style),
                Paragraph("<b>Observation Description</b>", body_style),
            ]
        ]
        for a in inspection.anomalies:
            sev_color = "#D97706" if a.severity == "warning" else "#64748B"
            anomaly_rows.append(
                [
                    Paragraph(safe_text(a.category), body_style),
                    Paragraph(f"<font color='{sev_color}'><b>{safe_text(a.severity).upper()}</b></font>", body_style),
                    Paragraph(safe_text(a.description), body_style),
                ]
            )

        anom_table = Table(anomaly_rows, colWidths=[110, 70, 342])
        anom_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(anom_table)
    else:
        story.append(
            Paragraph("No structural, dimension, or encoding anomalies detected during automated inspection.", body_style)
        )

    story.append(Spacer(1, 10))

    # 8. Section 6: Forensic Limitations & Methodology
    story.append(
        Paragraph("6. Forensic Limitations & Disclaimers", section_heading_style)
    )

    limitation_items = limitations.copy() if limitations else []
    if not limitation_items:
        limitation_items = [
            "Technical inspection examines file structure, bitstream consistency, and headers; it does not evaluate semantic plausibility or assess human intent.",
            "Legitimate imagery distributed via messaging applications or social media platforms frequently undergoes compression, resolution reduction, and metadata stripping.",
            "AI-generated, deepfake, or digitally edited media can be synthesized without introducing detectable structural file anomalies.",
            "SHA-256 hash verification confirms byte-level immutability from the exact moment of intake forward; it cannot verify pre-intake custody or chain of events.",
        ]

    bullet_paragraphs = [
        Paragraph(f"• {safe_text(item)}", body_style) for item in limitation_items
    ]
    lim_table = Table([[bp] for bp in bullet_paragraphs], colWidths=[522])
    lim_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(lim_table)

    # Build PDF with two-pass canvas
    def canvas_maker(*args: Any, **kwargs: Any) -> canvas.Canvas:
        kwargs["report_id"] = analysis.id
        return NumberedCanvas(*args, **kwargs)

    doc.build(story, canvasmaker=canvas_maker)

    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
