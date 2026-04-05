from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os
import joblib

from src.db.database import init_db
from src.auth.routes import router as auth_router
from src.routers.predictions import router as predictions_router
from src.routers.doctors import router as doctors_router
from src.routers.analytics import router as analytics_router

MODELS_DIR = Path(__file__).resolve().parents[2] / "models"
ENSEMBLE_PATH = MODELS_DIR / "ensemble_model.joblib"
LEGACY_RF_PATH = MODELS_DIR / "rf_model.joblib"

# Legacy feature list (used when falling back to the old RF pickle)
_LEGACY_FEATURE_COLS = [
    "age", "sex", "cp", "trestbps", "chol", "fbs",
    "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal",
]

app = FastAPI(
    title="CardioSense API",
    description="Heart disease risk prediction with doctor connect, chat, and payments.",
    version="2.0.0",
)

# Allow the React dev server (port 3000) and any production origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global model reference (accessed by predictions router) ───────────────────
# _model_data is a dict: {model, feature_cols, feature_importances,
#                          feature_stats, metrics, model_type}
_model_data: dict | None = None


def _patch_lr_compatibility(model):
    """Patch LogisticRegression estimators missing 'multi_class' (sklearn < 1.6 pickles)."""
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import Pipeline
    estimators = []
    if hasattr(model, "estimators_"):
        estimators = model.estimators_
    elif hasattr(model, "named_steps"):
        estimators = [model.named_steps.get("clf") or list(model.named_steps.values())[-1]]
    for est in estimators:
        target = est
        if isinstance(est, Pipeline):
            target = est.steps[-1][1]
        if isinstance(target, LogisticRegression) and not hasattr(target, "multi_class"):
            target.multi_class = "auto"


def load_model() -> dict:
    """Load ensemble model (preferred) or legacy RF model (fallback)."""
    if ENSEMBLE_PATH.exists():
        data = joblib.load(ENSEMBLE_PATH)
        if isinstance(data, dict) and "model" in data:
            _patch_lr_compatibility(data["model"])
            return data

    if LEGACY_RF_PATH.exists():
        raw_model = joblib.load(LEGACY_RF_PATH)
        return {
            "model": raw_model,
            "feature_cols": _LEGACY_FEATURE_COLS,
            "feature_importances": {},
            "feature_stats": {},
            "metrics": {},
            "model_type": "RandomForestClassifier (legacy)",
        }

    raise RuntimeError(
        "No model found. Run `python -m src.models.train` first."
    )


@app.on_event("startup")
def startup_event():
    global _model_data
    _model_data = load_model()
    # Only auto-create tables when explicitly enabled (local dev / SQLite).
    # In production, use `alembic upgrade head` instead.
    if os.getenv("AUTO_CREATE_TABLES", "false").lower() in ("1", "true", "yes"):
        init_db()


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api")
app.include_router(predictions_router, prefix="/api")
app.include_router(doctors_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")


# ── Legacy / utility endpoints ────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": _model_data is not None}


@app.get("/api/health")
def api_health():
    return {"status": "ok", "model_loaded": _model_data is not None}
