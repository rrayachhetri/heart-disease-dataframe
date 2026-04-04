"""
Predictions router — wraps the ML inference endpoint.
Saves predictions to the DB when user is authenticated.
Anonymous predictions are still accepted (user_id=None).
"""
import json
from typing import Any, Dict, List, Optional

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


class FeatureImportanceItem(BaseModel):
    feature: str
    label: str
    importance: float


class ModelInfoResponse(BaseModel):
    model_type: str
    metrics: Dict[str, float]
    feature_importances: List[FeatureImportanceItem]


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

    md = _get_model_data()
    model = md["model"]
    feature_cols = md["feature_cols"]

    row = {f: getattr(features, f) for f in feature_cols}
    X = pd.DataFrame([row], columns=feature_cols)
    prob = float(model.predict_proba(X)[0][1])
    pred = int(model.predict(X)[0])
    level = _risk_level(prob)

    # Per-prediction explainability (only when population stats are available)
    top_factors: List[Dict] = []
    if md.get("feature_stats") and md.get("feature_cols"):
        top_factors = compute_top_factors(
            features=features.model_dump(),
            model=model,
            feature_cols=feature_cols,
            feature_stats=md["feature_stats"],
            top_n=6,
        )

    # Population-percentile benchmarking across all 4 dataset cohorts
    population_percentiles: List[Dict] = []
    quantile_arrays = md.get("quantile_arrays")
    if quantile_arrays:
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

    # Persist when authenticated
    record_id = None
    if current_user:
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

    return PredictionResult(
        id=record_id,
        probability=prob,
        prediction=pred,
        risk_level=level,
        top_factors=top_factors,
        population_percentiles=population_percentiles,
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
    )


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
