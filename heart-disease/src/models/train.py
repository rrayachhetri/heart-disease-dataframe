"""
Ensemble training for CardioSense.

Model: Soft VotingClassifier (RF-300 + GradientBoosting-200 + Logistic Regression).
Saves a model_data dict with: model, feature importances, population statistics,
and cross-validated performance metrics.
"""

import mlflow
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    VotingClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import (
    roc_auc_score,
    accuracy_score,
    recall_score,
    precision_score,
    f1_score,
)
import joblib

DATA = Path(__file__).resolve().parents[2] / "data" / "processed.parquet"
MODEL_DIR = Path(__file__).resolve().parents[2] / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

FEATURE_COLS = [
    "age", "sex", "cp", "trestbps", "chol", "fbs",
    "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal",
]


def load_data(path: Path) -> pd.DataFrame:
    return pd.read_parquet(path)


def build_ensemble() -> VotingClassifier:
    rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=1,
    )
    gbc = GradientBoostingClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        random_state=42,
    )
    lr = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(C=1.0, max_iter=1000, random_state=42)),
    ])
    return VotingClassifier(
        estimators=[("rf", rf), ("gbc", gbc), ("lr", lr)],
        voting="soft",
        weights=[2, 2, 1],
    )


def train():
    df = load_data(DATA)
    df = df.dropna(subset=FEATURE_COLS + ["target"])
    X = df[FEATURE_COLS]
    y = df["target"]

    # Population statistics used at inference time for per-feature explanations
    feature_stats = {
        col: {
            "mean": float(X[col].mean()),
            "std": float(max(X[col].std(), 1e-6)),
            "median": float(X[col].median()),
            "q1": float(X[col].quantile(0.25)),
            "q3": float(X[col].quantile(0.75)),
        }
        for col in FEATURE_COLS
    }

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    with mlflow.start_run():
        # 5-fold stratified CV for robust AUC estimate
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        clf_cv = build_ensemble()
        cv_aucs = cross_val_score(clf_cv, X, y, cv=cv, scoring="roc_auc", n_jobs=1)

        # Production model trained on train split, evaluated on held-out val
        clf = build_ensemble()
        clf.fit(X_train, y_train)

        probs = clf.predict_proba(X_val)[:, 1]
        preds = (probs >= 0.5).astype(int)

        metrics = {
            "val_auc": float(roc_auc_score(y_val, probs)),
            "val_accuracy": float(accuracy_score(y_val, preds)),
            "val_sensitivity": float(recall_score(y_val, preds, zero_division=0)),
            "val_specificity": float(recall_score(y_val, preds, pos_label=0, zero_division=0)),
            "val_precision": float(precision_score(y_val, preds, zero_division=0)),
            "val_f1": float(f1_score(y_val, preds, zero_division=0)),
            "cv_auc_mean": float(cv_aucs.mean()),
            "cv_auc_std": float(cv_aucs.std()),
        }

        for k, v in metrics.items():
            mlflow.log_metric(k, v)

        # Feature importances from the RF base estimator
        rf_estimator = clf.named_estimators_["rf"]
        importances = dict(zip(FEATURE_COLS, rf_estimator.feature_importances_.tolist()))

        model_data = {
            "model": clf,
            "feature_cols": FEATURE_COLS,
            "feature_importances": importances,
            "feature_stats": feature_stats,
            "metrics": metrics,
            "model_type": "VotingClassifier (RF-300 + GBM-200 + LR)",
        }

        model_path = MODEL_DIR / "ensemble_model.joblib"
        joblib.dump(model_data, model_path)
        mlflow.log_artifact(str(model_path))

        print(f"\n{'=' * 55}")
        print("  Ensemble Model Training Complete")
        print(f"{'─' * 55}")
        print(f"  CV AUC : {cv_aucs.mean():.4f} ± {cv_aucs.std():.4f}")
        print(f"{'─' * 55}")
        for k, v in metrics.items():
            print(f"  {k:<28}: {v:.4f}")
        print(f"{'─' * 55}")
        print("  Feature Importances (RF component):")
        for feat, imp in sorted(importances.items(), key=lambda x: -x[1]):
            bar = "█" * int(imp * 40)
            print(f"  {feat:<15} {bar} {imp:.4f}")
        print(f"{'=' * 55}")
        print(f"  Saved → {model_path}")


if __name__ == "__main__":
    train()
