"""
Per-prediction explainability via baseline perturbation.

For each feature we ask: how much does the model's risk probability change
when we replace the population-mean value with the patient's actual value
(holding all other features at their population mean)?

  contribution_i = P(high | feature_i = patient_val, rest = mean)
                 - P(high | all features = mean)

  • Positive contribution  → this feature pushes the score toward higher risk
  • Negative contribution  → this feature pushes the score toward lower risk

This is model-agnostic and works with VotingClassifier, RF, GBM or any
sklearn-compatible estimator.
"""

from typing import Any, Dict, List

import numpy as np
import pandas as pd

FEATURE_LABELS: Dict[str, str] = {
    "age": "Age",
    "sex": "Sex",
    "cp": "Chest Pain Type",
    "trestbps": "Resting Blood Pressure",
    "chol": "Cholesterol",
    "fbs": "Fasting Blood Sugar",
    "restecg": "Resting ECG",
    "thalach": "Max Heart Rate",
    "exang": "Exercise Angina",
    "oldpeak": "ST Depression",
    "slope": "ST Slope",
    "ca": "Major Vessels",
    "thal": "Thalassemia",
}

# Human-readable units / normal-range hints shown in the UI
FEATURE_UNITS: Dict[str, str] = {
    "age": "yrs",
    "trestbps": "mmHg",
    "chol": "mg/dl",
    "thalach": "bpm",
    "oldpeak": "mm",
}


def compute_top_factors(
    features: Dict[str, float],
    model: Any,
    feature_cols: List[str],
    feature_stats: Dict[str, dict],
    top_n: int = 6,
) -> List[Dict]:
    """
    Return the top N features sorted by absolute contribution (desc).

    Each item:
      feature        – internal name
      label          – human-readable name
      value          – patient's actual value
      population_mean – training-set mean for that feature
      unit           – measurement unit (may be "")
      contribution   – probability delta (-1..+1); positive = more risk
      direction      – "increases_risk" | "decreases_risk"
    """
    # --- baseline: every feature at its population mean ---
    base_row = {f: feature_stats[f]["mean"] for f in feature_cols}
    base_df = pd.DataFrame([base_row], columns=feature_cols)
    base_prob = float(model.predict_proba(base_df)[0][1])

    contributions: List[Dict] = []
    for feat in feature_cols:
        if feat not in feature_stats:
            continue
        row = dict(base_row)
        row[feat] = features.get(feat, feature_stats[feat]["mean"])
        prob = float(model.predict_proba(pd.DataFrame([row], columns=feature_cols))[0][1])
        delta = prob - base_prob

        contributions.append(
            {
                "feature": feat,
                "label": FEATURE_LABELS.get(feat, feat),
                "value": features.get(feat),
                "population_mean": round(feature_stats[feat]["mean"], 2),
                "unit": FEATURE_UNITS.get(feat, ""),
                "contribution": round(delta, 4),
                "direction": "increases_risk" if delta > 0 else "decreases_risk",
            }
        )

    contributions.sort(key=lambda x: abs(x["contribution"]), reverse=True)
    return contributions[:top_n]
