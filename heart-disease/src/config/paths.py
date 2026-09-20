"""Centralized paths for datasets and generated runtime artifacts."""

from __future__ import annotations

import os
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_ROOT = Path(os.getenv("CARDIOSENSE_DATA_DIR", PROJECT_ROOT / ".data")).resolve()
RAW_DATA_DIR = DATA_ROOT / "raw"
PROCESSED_DATA_DIR = DATA_ROOT / "processed"
MODEL_DIR = DATA_ROOT / "models"
MLFLOW_DIR = DATA_ROOT / "mlruns"
DATABASE_DIR = DATA_ROOT / "db"


def ensure_data_directories() -> None:
    """Create local data directories when a command needs to write artifacts."""
    for directory in (
        DATA_ROOT,
        RAW_DATA_DIR,
        PROCESSED_DATA_DIR,
        MODEL_DIR,
        MLFLOW_DIR,
        DATABASE_DIR,
    ):
        directory.mkdir(parents=True, exist_ok=True)