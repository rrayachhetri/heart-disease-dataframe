"""
Analytics router — multi-dataset population insights.

Endpoints
---------
GET  /api/analytics/datasets
    Per-dataset descriptive statistics (record counts, disease rate, feature
    distributions) loaded from the trained model's embedded dataset_stats.

POST /api/analytics/population-benchmark
    Given a patient's 13 feature values, returns the percentile rank of each
    feature against the combined population AND against each individual dataset
    cohort (Cleveland, Hungarian, Switzerland, VA).
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from src.models.explain import FEATURE_LABELS

router = APIRouter(prefix="/analytics", tags=["analytics"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_model_data() -> Dict[str, Any]:
    from src.api.app import _model_data
    if _model_data is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Model not loaded")
    return _model_data


# ── Schemas ───────────────────────────────────────────────────────────────────

class FeatureStats(BaseModel):
    mean: float
    std: float
    median: float
    q1: float
    q3: float
    min: float
    max: float
    count: int


class DatasetMeta(BaseModel):
    total_records: int
    disease_rate: float


class DatasetSummary(BaseModel):
    name: str
    meta: DatasetMeta
    features: Dict[str, FeatureStats]


class DatasetComparisonResponse(BaseModel):
    datasets: List[DatasetSummary]


class BenchmarkFeatureInput(BaseModel):
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


class FeaturePercentile(BaseModel):
    feature: str
    label: str
    value: float
    percentiles: Dict[str, float]   # e.g. {"combined": 72.0, "cleveland": 68.0, ...}
    interpretation: str             # human-readable summary sentence


class PopulationBenchmarkResponse(BaseModel):
    feature_percentiles: List[FeaturePercentile]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/datasets", response_model=DatasetComparisonResponse)
def dataset_comparison():
    """
    Return per-dataset and combined descriptive statistics for all 13 features.

    This endpoint is public — no authentication required.
    """
    md = _get_model_data()
    raw_stats: Optional[Dict] = md.get("dataset_stats")

    if not raw_stats:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=503,
            detail=(
                "Dataset statistics not available. "
                "Retrain the model with `python -m src.models.train`."
            ),
        )

    summaries: List[DatasetSummary] = []
    for scope_name, scope_data in raw_stats.items():
        meta_raw = scope_data.get("_meta", {})
        meta = DatasetMeta(
            total_records=meta_raw.get("total_records", 0),
            disease_rate=meta_raw.get("disease_rate", 0.0),
        )
        features: Dict[str, FeatureStats] = {}
        for feat in FEATURE_LABELS:
            if feat in scope_data:
                fd = scope_data[feat]
                features[feat] = FeatureStats(
                    mean=fd["mean"],
                    std=fd["std"],
                    median=fd["median"],
                    q1=fd["q1"],
                    q3=fd["q3"],
                    min=fd["min"],
                    max=fd["max"],
                    count=fd["count"],
                )
        summaries.append(DatasetSummary(name=scope_name, meta=meta, features=features))

    # Sort: combined first, then alphabetical cohorts
    summaries.sort(key=lambda s: ("" if s.name == "combined" else s.name))

    return DatasetComparisonResponse(datasets=summaries)


@router.post("/population-benchmark", response_model=PopulationBenchmarkResponse)
def population_benchmark(patient: BenchmarkFeatureInput):
    """
    Return the population-percentile rank for each of the patient's 13 features.

    For every feature the response includes:
    - ``percentiles``: rank (0–100) in the **combined** pool and in each cohort
    - ``interpretation``: plain-language sentence, e.g.
      *"Your cholesterol (243 mg/dl) is higher than 71% of the combined population."*

    This endpoint is public — no authentication required.
    """
    from src.models.data_loader import percentile_of_value, FEATURE_COLS

    md = _get_model_data()
    quantile_arrays: Optional[Dict] = md.get("quantile_arrays")

    if not quantile_arrays:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=503,
            detail=(
                "Quantile arrays not available. "
                "Retrain the model with `python -m src.models.train`."
            ),
        )

    patient_dict = patient.model_dump()
    results: List[FeaturePercentile] = []

    for feat in FEATURE_COLS:
        value = patient_dict.get(feat)
        if value is None or feat not in quantile_arrays:
            continue

        feat_quantiles: Dict[str, list] = quantile_arrays[feat]
        percentiles: Dict[str, float] = {}
        for scope, q_array in feat_quantiles.items():
            percentiles[scope] = percentile_of_value(value, q_array)

        combined_pct = percentiles.get("combined", 50.0)
        label = FEATURE_LABELS.get(feat, feat)
        interpretation = _make_interpretation(label, value, feat, combined_pct)

        results.append(
            FeaturePercentile(
                feature=feat,
                label=label,
                value=value,
                percentiles=percentiles,
                interpretation=interpretation,
            )
        )

    return PopulationBenchmarkResponse(feature_percentiles=results)


# ── Helpers ───────────────────────────────────────────────────────────────────

_HIGHER_IS_RISKIER = {"age", "cp", "trestbps", "chol", "fbs", "exang", "oldpeak", "ca", "thal"}
_LOWER_IS_RISKIER  = {"thalach"}  # lower max heart rate → higher risk

def _make_interpretation(label: str, value: float, feat: str, pct: float) -> str:
    """Generate a plain-language percentile sentence for a feature value."""
    direction = "higher" if pct >= 50 else "lower"
    rank = pct if pct >= 50 else (100 - pct)
    sentence = (
        f"Your {label} ({value:g}) is {direction} than "
        f"{rank:.0f}% of the combined population."
    )
    if feat in _HIGHER_IS_RISKIER and pct > 75:
        sentence += " This is in the elevated range."
    elif feat in _LOWER_IS_RISKIER and pct < 25:
        sentence += " A lower max heart rate can indicate higher risk."
    return sentence
