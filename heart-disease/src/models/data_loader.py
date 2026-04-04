"""
Multi-dataset loader for CardioSense.

Loads all 4 UCI Heart Disease processed datasets (Cleveland, Hungarian,
Switzerland, VA), handles missing-value markers (``?``, ``-9``, ``-9.0``),
applies per-feature median imputation, binarises the target (0 = no disease,
1 = disease), and attaches a ``dataset`` provenance column.

Also provides helpers for computing per-dataset statistics and per-feature
quantile arrays used at inference time for population-percentile benchmarking.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict

ROOT = Path(__file__).resolve().parents[2]

FEATURE_COLS: list[str] = [
    "age", "sex", "cp", "trestbps", "chol", "fbs",
    "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal",
]
TARGET_COL = "target"
ALL_COLS = FEATURE_COLS + [TARGET_COL]

# reprocessed.hungarian.data is the quality-verified version (space-separated,
# uses -9 as missing marker instead of ?)
_DATASETS: dict[str, tuple[Path, str]] = {
    "cleveland":   (ROOT / "processed.cleveland.data",    "csv"),
    "hungarian":   (ROOT / "reprocessed.hungarian.data",  "space"),
    "switzerland": (ROOT / "processed.switzerland.data",  "csv"),
    "va":          (ROOT / "processed.va.data",           "csv"),
}

# Features where 0 is physiologically impossible and should be treated as NaN
_ZERO_IS_MISSING = {"chol", "trestbps", "thalach"}


def _load_raw(name: str, path: Path, fmt: str) -> pd.DataFrame:
    """Read one raw processed file into a DataFrame with FEATURE_COLS + target."""
    sep = r"\s+" if fmt == "space" else ","
    na_vals = ["?", "-9", "-9.0", ""]

    df = pd.read_csv(
        path,
        header=None,
        names=ALL_COLS,
        sep=sep,
        na_values=na_vals,
        engine="python",
    )

    # Replace physiologically impossible zeros with NaN
    for col in _ZERO_IS_MISSING:
        if col in df.columns:
            df[col] = df[col].replace(0.0, np.nan)

    # Binarise target: 0 = no disease; 1-4 → 1 (disease present)
    df[TARGET_COL] = (df[TARGET_COL].fillna(0) > 0).astype(int)

    df["dataset"] = name
    return df


def load_all_datasets() -> pd.DataFrame:
    """
    Load, clean, and combine all 4 heart disease datasets.

    Steps:
    1. Read each processed .data file (handles both CSV and space-separated).
    2. Replace impossible-zero values and NaN markers.
    3. Apply per-feature median imputation across the combined pool.
    4. Return a DataFrame with ``dataset`` as an extra provenance column.
    """
    frames: list[pd.DataFrame] = []
    for name, (path, fmt) in _DATASETS.items():
        if not path.exists():
            print(f"[data_loader] WARNING: {path} not found — skipping {name}")
            continue
        df = _load_raw(name, path, fmt)
        frames.append(df)

    if not frames:
        raise FileNotFoundError(
            "No processed dataset files found. Expected files in the project root."
        )

    combined = pd.concat(frames, ignore_index=True)

    # Median imputation — fit on combined pool so all datasets share one baseline
    for col in FEATURE_COLS:
        missing_n = combined[col].isna().sum()
        if missing_n > 0:
            median_val = combined[col].median()
            combined[col] = combined[col].fillna(median_val)

    return combined


def dataset_record_counts(df: pd.DataFrame) -> Dict[str, int]:
    return df.groupby("dataset").size().to_dict()


def compute_dataset_stats(df: pd.DataFrame) -> Dict[str, dict]:
    """
    Compute descriptive statistics per dataset and for the combined pool.

    Returns a nested dict::

        {
          "cleveland": {
            "age": {"mean": ..., "std": ..., "median": ...,
                    "q1": ..., "q3": ..., "min": ..., "max": ..., "count": ...},
            ...
            "_meta": {"total_records": ..., "disease_rate": ...}
          },
          ...
          "combined": { ... }
        }
    """
    scopes = {name: df[df["dataset"] == name] for name in df["dataset"].unique()}
    scopes["combined"] = df

    stats: Dict[str, dict] = {}
    for scope_name, subset in scopes.items():
        stats[scope_name] = {}
        for col in FEATURE_COLS:
            col_data = subset[col].dropna()
            stats[scope_name][col] = {
                "mean":   round(float(col_data.mean()),               4),
                "std":    round(float(max(col_data.std(), 1e-6)),     4),
                "median": round(float(col_data.median()),             4),
                "q1":     round(float(col_data.quantile(0.25)),      4),
                "q3":     round(float(col_data.quantile(0.75)),      4),
                "min":    round(float(col_data.min()),                4),
                "max":    round(float(col_data.max()),                4),
                "count":  int(col_data.count()),
            }
        stats[scope_name]["_meta"] = {
            "total_records": int(len(subset)),
            "disease_rate":  round(float((subset[TARGET_COL] == 1).mean()), 4),
        }

    return stats


def compute_quantile_arrays(df: pd.DataFrame) -> Dict[str, Dict[str, list]]:
    """
    Pre-compute 101-point quantile arrays (0th … 100th percentile) for every
    feature in every dataset scope, plus the combined pool.

    At inference time use ``numpy.searchsorted`` on these arrays to convert a
    raw feature value into a population-percentile rank in O(log N).

    Returns::

        {
          "age": {
            "combined":    [min_val, …, max_val],  # 101 floats
            "cleveland":   [...],
            "hungarian":   [...],
            "switzerland": [...],
            "va":          [...],
          },
          ...
        }
    """
    scopes = {name: df[df["dataset"] == name] for name in df["dataset"].unique()}
    scopes["combined"] = df

    quantiles: Dict[str, Dict[str, list]] = {}
    for col in FEATURE_COLS:
        quantiles[col] = {}
        for scope_name, subset in scopes.items():
            values = subset[col].dropna().values
            if len(values) == 0:
                quantiles[col][scope_name] = [0.0] * 101
            else:
                quantiles[col][scope_name] = np.percentile(
                    values, np.arange(0, 101)
                ).tolist()

    return quantiles


def percentile_of_value(value: float, quantile_array: list) -> float:
    """
    Return the approximate percentile (0–100) of *value* within the
    pre-computed *quantile_array* (101-element list from ``compute_quantile_arrays``).
    """
    arr = np.array(quantile_array)
    # searchsorted gives index of first element > value → that index IS the percentile
    idx = int(np.searchsorted(arr, value, side="right")) - 1
    return float(max(0, min(100, idx)))
