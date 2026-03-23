import pandas as pd
from pathlib import Path

RAW = Path(__file__).resolve().parents[2] / "processed.cleveland.data"
OUT = Path(__file__).resolve().parents[2] / "data" / "processed.parquet"

COLS = [
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
    "num",
]


def load_raw(path: Path) -> pd.DataFrame:
    # file is a comma-separated file without header
    df = pd.read_csv(path, header=None, names=COLS, na_values=["?", "\t?", "\n?", "\r?"], skip_blank_lines=True)
    return df


def preprocess(df: pd.DataFrame) -> pd.DataFrame:
    # Map target to binary (0 = no disease, 1 = disease)
    df = df.copy()
    df["target"] = (df["num"] > 0).astype(int)
    df.drop(columns=["num"], inplace=True)

    # numeric columns ensure correct dtype
    num_cols = ["age", "trestbps", "chol", "thalach", "oldpeak", "ca"]
    for c in num_cols:
        df[c] = pd.to_numeric(df[c], errors="coerce")

    # categorical columns keep as-is (they are numeric codes)
    return df


def main():
    outdir = OUT.parent
    outdir.mkdir(parents=True, exist_ok=True)
    df = load_raw(RAW)
    print(f"Loaded raw rows: {len(df)}")
    df = preprocess(df)
    df.to_parquet(OUT, index=False)
    print(f"Wrote processed data to {OUT}")


if __name__ == "__main__":
    main()
