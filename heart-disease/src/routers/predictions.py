"""
Predictions router — wraps the ML inference endpoint.
Saves predictions to the DB when user is authenticated.
Anonymous predictions are still accepted (user_id=None).
"""
import json
import os
import time
from typing import Any, Dict, List, Optional

try:
    import psutil
except ImportError:  # Optional runtime telemetry dependency.
    psutil = None
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.db.database import get_db
from src.db.models import Prediction
from src.auth.routes import get_optional_user, get_current_user

router = APIRouter(prefix="/predictions", tags=["predictions"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class PatientFeatures(BaseModel):
    age: float
    sex: float
    cp: float
    trestbps: float
    chol: float
    fbs: float
    restecg: float
    thalach: float
    exang: float
    oldpeak: float
    slope: float
    ca: float
    thal: float


class TopFactor(BaseModel):
    feature: str
    label: str
    value: float
    population_mean: float
    unit: str
    contribution: float      # probability delta; positive = increases risk
    direction: str           # "increases_risk" | "decreases_risk"


class FeaturePercentile(BaseModel):
    feature: str
    label: str
    value: float
    percentiles: Dict[str, float]   # {"combined": 72.0, "cleveland": 68.0, ...}
    interpretation: str


class PredictionResult(BaseModel):
    id: Optional[str] = None
    probability: float
    prediction: int
    risk_level: str
    top_factors: List[TopFactor] = []
    population_percentiles: List[FeaturePercentile] = []
    processing_time_ms: float
    processing_metrics: Dict[str, float]


class FeatureImportanceItem(BaseModel):
    feature: str
    label: str
    importance: float


class ModelInfoResponse(BaseModel):
    model_type: str
    metrics: Dict[str, float]
    feature_importances: List[FeatureImportanceItem]
    model_memory_mb: float
    processing_steps: List[str]
    runtime_ram_mb: float
    cpu_cores: int


def _runtime_ram_mb() -> float:
    """Return process RSS when psutil is installed, otherwise report unavailable."""
    if psutil is None:
        return 0.0
    return psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _risk_level(prob: float) -> str:
    if prob >= 0.70:
        return "high"
    if prob >= 0.40:
        return "moderate"
    return "low"


def _get_model_data() -> Dict[str, Any]:
    from src.api.app import _model_data
    if _model_data is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Model not loaded")
    return _model_data


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("", response_model=PredictionResult)
def predict(
    features: PatientFeatures,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    import pandas as pd
    from src.models.explain import compute_top_factors
    from src.models.data_loader import percentile_of_value, FEATURE_COLS as _FEAT_COLS
    from src.models.explain import FEATURE_LABELS

    started_at = time.perf_counter()
    cpu_started_at = time.process_time()
    stage_started_at = started_at
    stage_times: Dict[str, float] = {}
    md = _get_model_data()
    model = md["model"]
    feature_cols = md["feature_cols"]

    row = {f: getattr(features, f) for f in feature_cols}
    X = pd.DataFrame([row], columns=feature_cols)
    stage_times["feature_frame_ms"] = (time.perf_counter() - stage_started_at) * 1000
    stage_started_at = time.perf_counter()
    prob = float(model.predict_proba(X)[0][1])
    pred = int(model.predict(X)[0])
    level = _risk_level(prob)
    stage_times["model_inference_ms"] = (time.perf_counter() - stage_started_at) * 1000

    # Per-prediction explainability (only when population stats are available)
    top_factors: List[Dict] = []
    if md.get("feature_stats") and md.get("feature_cols"):
        stage_started_at = time.perf_counter()
        top_factors = compute_top_factors(
            features=features.model_dump(),
            model=model,
            feature_cols=feature_cols,
            feature_stats=md["feature_stats"],
            top_n=6,
        )
        stage_times["explainability_ms"] = (time.perf_counter() - stage_started_at) * 1000

    # Population-percentile benchmarking across all 4 dataset cohorts
    population_percentiles: List[Dict] = []
    quantile_arrays = md.get("quantile_arrays")
    if quantile_arrays:
        stage_started_at = time.perf_counter()
        patient_dict = features.model_dump()
        for feat in _FEAT_COLS:
            value = patient_dict.get(feat)
            if value is None or feat not in quantile_arrays:
                continue
            feat_quantiles = quantile_arrays[feat]
            percentiles = {
                scope: percentile_of_value(value, q_array)
                for scope, q_array in feat_quantiles.items()
            }
            combined_pct = percentiles.get("combined", 50.0)
            label = FEATURE_LABELS.get(feat, feat)
            direction = "higher" if combined_pct >= 50 else "lower"
            rank = combined_pct if combined_pct >= 50 else (100 - combined_pct)
            population_percentiles.append({
                "feature": feat,
                "label": label,
                "value": value,
                "percentiles": percentiles,
                "interpretation": (
                    f"Your {label} ({value:g}) is {direction} than "
                    f"{rank:.0f}% of the combined population."
                ),
            })
            stage_times["benchmarking_ms"] = (time.perf_counter() - stage_started_at) * 1000

    # Persist when authenticated
    record_id = None
    if current_user:
        stage_started_at = time.perf_counter()
        record = Prediction(
            user_id=current_user.id,
            risk_score=prob,
            risk_level=level,
            prediction=pred,
            features_json=json.dumps(features.model_dump()),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        record_id = record.id
        stage_times["database_persistence_ms"] = (time.perf_counter() - stage_started_at) * 1000

    processing_time_ms = (time.perf_counter() - started_at) * 1000
    processing_metrics = {
        **{name: round(value, 2) for name, value in stage_times.items()},
        "wall_time_ms": round(processing_time_ms, 2),
        "cpu_time_ms": round((time.process_time() - cpu_started_at) * 1000, 2),
        "runtime_ram_mb": round(_runtime_ram_mb(), 2),
    }

    return PredictionResult(
        id=record_id,
        probability=prob,
        prediction=pred,
        risk_level=level,
        top_factors=top_factors,
        population_percentiles=population_percentiles,
        processing_time_ms=round(processing_time_ms, 2),
        processing_metrics=processing_metrics,
    )


@router.get("/model-info", response_model=ModelInfoResponse)
def model_info():
    """Return model performance metrics and global feature importances.
    This endpoint is public — no authentication required."""
    from src.models.explain import FEATURE_LABELS

    md = _get_model_data()
    raw_importances = md.get("feature_importances", {})

    importance_list = [
        FeatureImportanceItem(
            feature=feat,
            label=FEATURE_LABELS.get(feat, feat),
            importance=round(imp, 4),
        )
        for feat, imp in sorted(raw_importances.items(), key=lambda x: -x[1])
    ]

    return ModelInfoResponse(
        model_type=md.get("model_type", "Unknown"),
        metrics={k: round(v, 4) for k, v in md.get("metrics", {}).items()},
        feature_importances=importance_list,
        model_memory_mb=round(_model_memory_mb(), 2),
        processing_steps=[
            "Validate 13 clinical inputs",
            "Build a single-row feature frame",
            "Run ensemble probability and classification",
            "Compute feature explanations and cohort percentiles",
            "Persist prediction when authenticated",
        ],
        runtime_ram_mb=round(_runtime_ram_mb(), 2),
        cpu_cores=os.cpu_count() or 1,
    )


def _model_memory_mb() -> float:
    """Return the serialized model footprint used by the running API."""
    from src.api.app import ENSEMBLE_PATH, LEGACY_RF_PATH

    model_path = ENSEMBLE_PATH if ENSEMBLE_PATH.exists() else LEGACY_RF_PATH
    return model_path.stat().st_size / (1024 * 1024) if model_path.exists() else 0.0


@router.get("")
def get_predictions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return the authenticated user's prediction history. Requires authentication."""
    total = db.query(Prediction).filter(Prediction.user_id == current_user.id).count()
    records = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {
        "predictions": [
            {
                "id": r.id,
                "risk_score": r.risk_score,
                "risk_level": r.risk_level,
                "prediction": r.prediction,
                "features": json.loads(r.features_json),
                "created_at": r.created_at.isoformat(),
            }
            for r in records
        ],
        "total": total,
    }


@router.delete("/{prediction_id}", status_code=204)
def delete_prediction(
    prediction_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    from fastapi import HTTPException
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    record = (
        db.query(Prediction)
        .filter(Prediction.id == prediction_id, Prediction.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Prediction not found")
    db.delete(record)
    db.commit()
