"""
Haven AI Forensics - Offline Model Evaluation Runner & Metrics Engine
Evaluates AI synthetic-image detection models against structured, labelled benchmark datasets.
Calculates confusion matrix, accuracy, precision, recall (sensitivity), specificity,
F1 score, ROC-AUC (Wilcoxon-Mann-Whitney rank statistic), and error rates.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
import json
import os
import platform
import sys
from typing import Any, Dict, List, Optional, Tuple

from app.services.ai_forensics import AIForensicsService


@dataclass
class EvaluationSample:
    """A single labelled image for forensic model evaluation."""
    image_path: str
    ground_truth: int  # 0 = Authentic/Genuine, 1 = Synthetic/AI-Generated
    sample_id: Optional[str] = None
    generator: Optional[str] = None  # e.g., "Midjourney", "SDXL", "Camera_Raw", etc.
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class DatasetManifest:
    """Metadata describing a sourced, labelled forensic benchmark dataset."""
    dataset_name: str
    dataset_version: str
    license: str
    provenance: str
    description: str
    samples: List[EvaluationSample] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DatasetManifest":
        samples = [
            EvaluationSample(
                image_path=s["image_path"],
                ground_truth=int(s["ground_truth"]),
                sample_id=s.get("sample_id"),
                generator=s.get("generator"),
                metadata=s.get("metadata", {}),
            )
            for s in data.get("samples", [])
        ]
        return cls(
            dataset_name=data.get("dataset_name", "Unknown Dataset"),
            dataset_version=data.get("dataset_version", "1.0.0"),
            license=data.get("license", "Unknown License"),
            provenance=data.get("provenance", "Local Benchmark Fixture"),
            description=data.get("description", ""),
            samples=samples,
        )


@dataclass
class ConfusionMatrix:
    """Contingency table metrics for binary synthetic detection."""
    true_positives: int  # GT=1, Pred=1 (Correctly identified synthetic)
    false_positives: int  # GT=0, Pred=1 (Genuine misclassified as synthetic)
    true_negatives: int  # GT=0, Pred=0 (Correctly identified authentic)
    false_negatives: int  # GT=1, Pred=0 (Synthetic missed as authentic)
    total_samples: int

    def to_dict(self) -> Dict[str, int]:
        return {
            "true_positives": self.true_positives,
            "false_positives": self.false_positives,
            "true_negatives": self.true_negatives,
            "false_negatives": self.false_negatives,
            "total_samples": self.total_samples,
        }


@dataclass
class EvaluationMetrics:
    """Diagnostic performance metrics derived from confusion matrix and continuous scores."""
    decision_threshold: float
    accuracy: float
    precision: float
    recall: float
    specificity: float
    f1_score: float
    false_positive_rate: float
    false_negative_rate: float
    roc_auc: Optional[float]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "decision_threshold": round(self.decision_threshold, 4),
            "accuracy": round(self.accuracy, 4),
            "precision": round(self.precision, 4),
            "recall": round(self.recall, 4),
            "specificity": round(self.specificity, 4),
            "f1_score": round(self.f1_score, 4),
            "false_positive_rate": round(self.false_positive_rate, 4),
            "false_negative_rate": round(self.false_negative_rate, 4),
            "roc_auc": round(self.roc_auc, 4) if self.roc_auc is not None else None,
        }


@dataclass
class EvaluationReport:
    """Comprehensive evaluation record complying with Haven AI Spec & Model Evaluation Plan."""
    report_id: str
    evaluation_date: str
    model_name: str
    model_version: str
    dataset_name: str
    dataset_version: str
    provenance: str
    license: str
    execution_environment: str
    total_samples_evaluated: int
    excluded_or_corrupt_samples: int
    confusion_matrix: ConfusionMatrix
    metrics: EvaluationMetrics
    evaluation_status: str
    limitations: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "report_id": self.report_id,
            "evaluation_date": self.evaluation_date,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "dataset_name": self.dataset_name,
            "dataset_version": self.dataset_version,
            "provenance": self.provenance,
            "license": self.license,
            "execution_environment": self.execution_environment,
            "total_samples_evaluated": self.total_samples_evaluated,
            "excluded_or_corrupt_samples": self.excluded_or_corrupt_samples,
            "confusion_matrix": self.confusion_matrix.to_dict(),
            "metrics": self.metrics.to_dict(),
            "evaluation_status": self.evaluation_status,
            "limitations": self.limitations,
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)


def compute_roc_auc(ground_truth: List[int], scores: List[float]) -> Optional[float]:
    """
    Computes Area Under the ROC Curve (ROC-AUC) using the Mann-Whitney U rank statistic.
    Does not require external dependencies like scikit-learn.
    Returns None if dataset does not contain both positive (1) and negative (0) samples.
    """
    n_pos = sum(1 for y in ground_truth if y == 1)
    n_neg = len(ground_truth) - n_pos

    if n_pos == 0 or n_neg == 0:
        return None

    # Pair scores with labels and sort ascending by score
    paired = sorted(zip(scores, ground_truth), key=lambda x: x[0])

    # Assign average ranks for ties (1-based ranking)
    ranks = [0.0] * len(paired)
    i = 0
    while i < len(paired):
        j = i
        while j < len(paired) and paired[j][0] == paired[i][0]:
            j += 1
        # Average rank for indices i to j-1
        avg_rank = (i + 1 + j) / 2.0
        for k in range(i, j):
            ranks[k] = avg_rank
        i = j

    # Sum of ranks for positive class
    sum_ranks_pos = sum(r for r, (_, y) in zip(ranks, paired) if y == 1)

    # Mann-Whitney U statistic: U = R1 - n1*(n1 + 1)/2
    u_stat = sum_ranks_pos - (n_pos * (n_pos + 1)) / 2.0
    auc = u_stat / (n_pos * n_neg)

    return max(0.0, min(1.0, float(auc)))


def compute_evaluation_metrics(
    ground_truth: List[int],
    scores: List[float],
    threshold: float = 0.5,
) -> Tuple[ConfusionMatrix, EvaluationMetrics]:
    """
    Computes confusion matrix, standard binary classification metrics, and ROC-AUC.
    """
    if len(ground_truth) != len(scores):
        raise ValueError("ground_truth and scores must have the same length.")

    tp = 0
    fp = 0
    tn = 0
    fn = 0

    for gt, score in zip(ground_truth, scores):
        pred = 1 if score >= threshold else 0
        if gt == 1 and pred == 1:
            tp += 1
        elif gt == 0 and pred == 1:
            fp += 1
        elif gt == 0 and pred == 0:
            tn += 1
        elif gt == 1 and pred == 0:
            fn += 1

    total = len(ground_truth)
    accuracy = (tp + tn) / total if total > 0 else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0  # Sensitivity / TPR
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0  # TNR
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0.0

    roc_auc = compute_roc_auc(ground_truth, scores)

    cm = ConfusionMatrix(
        true_positives=tp,
        false_positives=fp,
        true_negatives=tn,
        false_negatives=fn,
        total_samples=total,
    )

    metrics = EvaluationMetrics(
        decision_threshold=threshold,
        accuracy=accuracy,
        precision=precision,
        recall=recall,
        specificity=specificity,
        f1_score=f1,
        false_positive_rate=fpr,
        false_negative_rate=fnr,
        roc_auc=roc_auc,
    )

    return cm, metrics


class ModelEvaluator:
    """
    Execution engine that runs inference over dataset manifests and generates
    reproducible, non-fabricated forensic evaluation reports.
    """

    def __init__(self, ai_service: Optional[AIForensicsService] = None):
        self.ai_service = ai_service or AIForensicsService()

    def evaluate_manifest(
        self,
        manifest: DatasetManifest,
        threshold: float = 0.5,
        evaluation_status_override: Optional[str] = None,
    ) -> EvaluationReport:
        """
        Executes model inference on all valid samples in a dataset manifest.
        Tracks excluded/corrupt images and computes full evaluation metrics.
        """
        import uuid

        valid_ground_truths: List[int] = []
        valid_scores: List[float] = []
        excluded_count = 0

        for sample in manifest.samples:
            if not os.path.exists(sample.image_path):
                excluded_count += 1
                continue

            try:
                res = self.ai_service.analyze_image(sample.image_path)
                if res.get("status") == "success" and res.get("synthetic_likelihood") is not None:
                    score = float(res["synthetic_likelihood"])
                    valid_ground_truths.append(sample.ground_truth)
                    valid_scores.append(score)
                else:
                    excluded_count += 1
            except Exception:
                excluded_count += 1

        if not valid_ground_truths:
            # Handle empty or completely excluded dataset
            cm = ConfusionMatrix(0, 0, 0, 0, 0)
            metrics = EvaluationMetrics(
                decision_threshold=threshold,
                accuracy=0.0,
                precision=0.0,
                recall=0.0,
                specificity=0.0,
                f1_score=0.0,
                false_positive_rate=0.0,
                false_negative_rate=0.0,
                roc_auc=None,
            )
        else:
            cm, metrics = compute_evaluation_metrics(
                valid_ground_truths, valid_scores, threshold=threshold
            )

        status = evaluation_status_override or (
            "pipeline_verification_fixture"
            if "fixture" in manifest.provenance.lower()
            else "evaluated_on_benchmark"
        )

        env_str = f"Python {sys.version.split()[0]} on {platform.system()} {platform.machine()}"

        limitations = [
            "Model evaluated exclusively on local CPU using INT8 quantized ONNX weights.",
            "Evaluation metrics reflect the specific distribution and generative pipelines present in the evaluation manifest.",
            "Detector accuracy may degrade significantly on out-of-distribution generator architectures, adversarial perturbations, or severe recompression.",
            "A high synthetic likelihood does not constitute legal proof of generative origin.",
        ]

        report = EvaluationReport(
            report_id=f"eval-{uuid.uuid4().hex[:12]}",
            evaluation_date=datetime.now(timezone.utc).isoformat(),
            model_name=self.ai_service.model_id,
            model_version=self.ai_service.model_version,
            dataset_name=manifest.dataset_name,
            dataset_version=manifest.dataset_version,
            provenance=manifest.provenance,
            license=manifest.license,
            execution_environment=env_str,
            total_samples_evaluated=len(valid_ground_truths),
            excluded_or_corrupt_samples=excluded_count,
            confusion_matrix=cm,
            metrics=metrics,
            evaluation_status=status,
            limitations=limitations,
        )

        return report
