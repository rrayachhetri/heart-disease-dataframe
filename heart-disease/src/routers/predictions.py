"""
Predictions router — wraps the ML inference endpoint.
Saves predictions to the DB when user is authenticated.
Anonymous predictions are still accepted (user_id=None).
"""
import json
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.db.database import get_db
from src.db.models import Prediction
from src.auth.routes import get_optional_user, get_current_user

router = APIRouter(prefix="/predictions", tags=["predictions"])


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


class PredictionResult(BaseModel):
    id: Optional[str] = None
    probability: float
    prediction: int
    risk_level: str


def _risk_level(prob: float) -> str:
    if prob >= 0.70:
        return "high"
    if prob >= 0.40:
        return "moderate"
    return "low"


@router.post("", response_model=PredictionResult)
def predict(
    features: PatientFeatures,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
    request=None,  # kept for compatibility
):
    # Import the loaded model via the app state (injected at startup)
    from src.api.app import _model
    if _model is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Model not loaded")

    import numpy as np
    X = np.array([[
        features.age, features.sex, features.cp, features.trestbps,
        features.chol, features.fbs, features.restecg, features.thalach,
        features.exang, features.oldpeak, features.slope, features.ca, features.thal,
    ]])
    prob = float(_model.predict_proba(X)[0][1])
    pred = int(_model.predict(X)[0])
    level = _risk_level(prob)

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

    return PredictionResult(id=record_id, probability=prob, prediction=pred, risk_level=level)


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
