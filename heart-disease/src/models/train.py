import mlflow
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score
import joblib

DATA = Path(__file__).resolve().parents[2] / "data" / "processed.parquet"
MODEL_DIR = Path(__file__).resolve().parents[2] / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

FEATURE_COLS = [
    "age",
    "sex",
    "cp",
    "trestbps",
    "chol",
    "fbs",
    "restecg",
    "thalach",
    "exang",
    "oldpeak",
    "slope",
    "ca",
    "thal",
]


def load_data(path: Path) -> pd.DataFrame:
    return pd.read_parquet(path)


def train():
    df = load_data(DATA)
    df = df.dropna(subset=FEATURE_COLS + ["target"])  # drop rows with missing features
    X = df[FEATURE_COLS]
    y = df["target"]

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

    with mlflow.start_run():
        clf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=1)
        clf.fit(X_train, y_train)

        probs = clf.predict_proba(X_val)[:, 1]
        preds = (probs >= 0.5).astype(int)

        auc = roc_auc_score(y_val, probs)
        acc = accuracy_score(y_val, preds)

        mlflow.log_metric("val_auc", float(auc))
        mlflow.log_metric("val_accuracy", float(acc))

        model_path = MODEL_DIR / "rf_model.joblib"
        joblib.dump(clf, model_path)
        mlflow.log_artifact(str(model_path))

        print(f"Validation AUC: {auc:.4f}, Accuracy: {acc:.4f}")
        print(f"Saved model to {model_path}")


if __name__ == "__main__":
    train()
