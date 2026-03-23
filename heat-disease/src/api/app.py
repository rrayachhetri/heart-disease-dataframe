from fastapi import FastAPI
from pydantic import BaseModel
from pathlib import Path
import joblib
import pandas as pd

MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "rf_model.joblib"

app = FastAPI(title="Heart Disease Risk API")


class Patient(BaseModel):
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


def load_model():
    if not MODEL_PATH.exists():
        raise RuntimeError(f"Model file not found at {MODEL_PATH}. Run training first.")
    return joblib.load(MODEL_PATH)


MODEL = None


@app.on_event("startup")
def startup_event():
    global MODEL
    MODEL = load_model()


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": MODEL is not None}


@app.post("/predict")
def predict(p: Patient):
    global MODEL
    data = pd.DataFrame([p.dict()])
    proba = MODEL.predict_proba(data)[:, 1][0]
    pred = int(proba >= 0.5)
    return {"probability": float(proba), "prediction": pred}
