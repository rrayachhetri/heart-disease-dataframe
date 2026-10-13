"""
Input validation tests for chat endpoints.
Ensures that oversized questions and context are rejected to prevent DoS.
"""

import pytest
from pydantic import ValidationError

from src.routers.chat import ChatRequest, PredictionContext


def test_valid_short_question():
    """Test that normal questions are accepted."""
    req = ChatRequest(question="What does my risk score mean?")
    assert req.question == "What does my risk score mean?"


def test_question_length_limit():
    """Test that oversized questions are rejected."""
    oversized = "x" * 1001
    with pytest.raises(ValidationError) as exc_info:
        ChatRequest(question=oversized)
    assert "question must be 1-1000 characters" in str(exc_info.value)


def test_empty_question_rejected():
    """Test that empty questions are rejected."""
    with pytest.raises(ValidationError):
        ChatRequest(question="")


def test_question_stripped():
    """Test that questions are trimmed of whitespace."""
    req = ChatRequest(question="  Why is my risk high?  ")
    assert req.question == "Why is my risk high?"


def test_valid_context():
    """Test that valid prediction context is accepted."""
    ctx = PredictionContext(
        probability=0.65,
        prediction=1,
        risk_level="high",
        top_factors=[{"label": "age", "direction": "increases_risk"}],
    )
    assert ctx.probability == 0.65
    assert len(ctx.top_factors) == 1


def test_probability_range_validation():
    """Test that probability must be 0-1."""
    with pytest.raises(ValidationError):
        PredictionContext(
            probability=1.5,
            prediction=1,
            risk_level="high",
        )
    with pytest.raises(ValidationError):
        PredictionContext(
            probability=-0.1,
            prediction=1,
            risk_level="high",
        )


def test_oversized_features_rejected():
    """Test that oversized features context is rejected."""
    huge_features = {f"feature_{i}": float(i) for i in range(500)}
    with pytest.raises(ValidationError) as exc_info:
        PredictionContext(
            probability=0.65,
            prediction=1,
            risk_level="high",
            features=huge_features,
        )
    assert "features context too large" in str(exc_info.value)
