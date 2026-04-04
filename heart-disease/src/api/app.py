from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os
import joblib

from src.db.database import init_db
from src.auth.routes import router as auth_router
from src.routers.predictions import router as predictions_router
from src.routers.doctors import router as doctors_router

MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "rf_model.joblib"

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
_model = None


def load_model():
    if not MODEL_PATH.exists():
        raise RuntimeError(f"Model not found at {MODEL_PATH}. Run training first.")
    return joblib.load(MODEL_PATH)


@app.on_event("startup")
def startup_event():
    global _model
    _model = load_model()
    # Only auto-create tables when explicitly enabled (local dev / SQLite).
    # In production, use `alembic upgrade head` instead.
    if os.getenv("AUTO_CREATE_TABLES", "false").lower() in ("1", "true", "yes"):
        init_db()


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api")
app.include_router(predictions_router, prefix="/api")
app.include_router(doctors_router, prefix="/api")


# ── Legacy / utility endpoints ────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": _model is not None}


@app.get("/api/health")
def api_health():
    return {"status": "ok", "model_loaded": _model is not None}
