import os
import pytest
from app.services.evaluator import (
    compute_roc_auc,
    compute_evaluation_metrics,
    ConfusionMatrix,
    DatasetManifest,
    EvaluationSample,
    ModelEvaluator,
)


def test_confusion_matrix_and_metrics_calculation():
    # Ground truth: 2 positive, 2 negative
    # Scores: 0.9 (TP), 0.8 (TP), 0.7 (FP), 0.2 (TN) at threshold 0.5
    gt = [1, 1, 0, 0]
    scores = [0.9, 0.8, 0.7, 0.2]

    cm, metrics = compute_evaluation_metrics(gt, scores, threshold=0.5)

    assert cm.true_positives == 2
    assert cm.false_positives == 1
    assert cm.true_negatives == 1
    assert cm.false_negatives == 0
    assert cm.total_samples == 4

    assert metrics.accuracy == 0.75
    assert metrics.recall == 1.0
    assert metrics.precision == pytest.approx(2 / 3, rel=1e-3)
    assert metrics.specificity == 0.5
    assert metrics.false_positive_rate == 0.5
    assert metrics.false_negative_rate == 0.0
    assert metrics.roc_auc is not None
    assert metrics.roc_auc > 0.5


def test_roc_auc_perfect_and_edge_cases():
    # Perfect ranking: all positives have higher scores than negatives
    gt = [1, 1, 0, 0]
    scores = [0.95, 0.85, 0.2, 0.1]
    auc = compute_roc_auc(gt, scores)
    assert auc == 1.0

    # Inverted ranking
    scores_inv = [0.1, 0.2, 0.85, 0.95]
    auc_inv = compute_roc_auc(gt, scores_inv)
    assert auc_inv == 0.0

    # All positive or all negative -> returns None
    assert compute_roc_auc([1, 1, 1], [0.5, 0.6, 0.7]) is None
    assert compute_roc_auc([0, 0, 0], [0.1, 0.2, 0.3]) is None


def test_division_by_zero_handling():
    # All predicted as negative (scores below threshold)
    gt = [1, 1, 0, 0]
    scores = [0.1, 0.2, 0.1, 0.05]

    cm, metrics = compute_evaluation_metrics(gt, scores, threshold=0.5)

    assert cm.true_positives == 0
    assert cm.false_positives == 0
    assert metrics.precision == 0.0
    assert metrics.recall == 0.0
    assert metrics.f1_score == 0.0


def test_dataset_manifest_deserialization():
    data = {
        "dataset_name": "Test Forensic Benchmark",
        "dataset_version": "1.0",
        "license": "CC-BY-4.0",
        "provenance": "Synthetic pipeline validation fixture",
        "description": "Validation manifest for evaluator unit test.",
        "samples": [
            {"image_path": "test1.jpg", "ground_truth": 1, "sample_id": "s1"},
            {"image_path": "test2.jpg", "ground_truth": 0, "sample_id": "s2"},
        ],
    }

    manifest = DatasetManifest.from_dict(data)
    assert manifest.dataset_name == "Test Forensic Benchmark"
    assert len(manifest.samples) == 2
    assert manifest.samples[0].ground_truth == 1
    assert manifest.samples[1].sample_id == "s2"


def test_model_evaluator_with_mock_service(tmp_path):
    # Create temporary dummy files
    f1 = tmp_path / "img1.png"
    f1.write_bytes(b"dummy image 1")
    f2 = tmp_path / "img2.png"
    f2.write_bytes(b"dummy image 2")
    missing_f = tmp_path / "missing.png"

    manifest = DatasetManifest(
        dataset_name="Unit Test Fixture Dataset",
        dataset_version="1.0.0",
        license="MIT",
        provenance="Unit Test Fixture",
        description="Dataset for testing evaluator execution",
        samples=[
            EvaluationSample(image_path=str(f1), ground_truth=1),
            EvaluationSample(image_path=str(f2), ground_truth=0),
            EvaluationSample(image_path=str(missing_f), ground_truth=1),
        ],
    )

    class MockAIService:
        model_id = "test-model-onnx"
        model_version = "1.0.0"

        def analyze_image(self, path):
            if "img1" in path:
                return {"status": "success", "synthetic_likelihood": 0.88}
            elif "img2" in path:
                return {"status": "success", "synthetic_likelihood": 0.12}
            return {"status": "failed", "synthetic_likelihood": None}

    evaluator = ModelEvaluator(ai_service=MockAIService())
    report = evaluator.evaluate_manifest(manifest, threshold=0.5)

    assert report.total_samples_evaluated == 2
    assert report.excluded_or_corrupt_samples == 1
    assert report.metrics.accuracy == 1.0
    assert report.confusion_matrix.true_positives == 1
    assert report.confusion_matrix.true_negatives == 1
    assert report.evaluation_status == "pipeline_verification_fixture"
    assert "INT8 quantized" in report.limitations[0]

    report_json = report.to_json()
    assert "Unit Test Fixture Dataset" in report_json
    assert "accuracy" in report_json
