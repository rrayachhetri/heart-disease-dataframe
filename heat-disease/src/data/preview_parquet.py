"""Small helper to inspect data/processed.parquet from the repo.

Usage (from repo root, venv activated):
  python src\data\preview_parquet.py

Options:
  --to-csv OUTPATH    write the full Parquet to CSV at OUTPATH (careful with size)
  --rows N            show only the first N rows (default 10)
"""
import argparse
from pathlib import Path
import pandas as pd

PARQUET = Path(__file__).resolve().parents[2] / "data" / "processed.parquet"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--to-csv", help="Write Parquet to CSV (provide path)")
    p.add_argument("--rows", type=int, default=10, help="Number of rows to show")
    args = p.parse_args()

    if not PARQUET.exists():
        print(f"Parquet not found at {PARQUET}. Run src/data/prepare.py first.")
        return

    df = pd.read_parquet(PARQUET)
    print(f"Loaded {len(df)} rows from {PARQUET}\n")

    print("Schema / dtypes:")
    print(df.dtypes)
    print("\nMissing values per column:")
    print(df.isna().sum())

    print(f"\nFirst {args.rows} rows:")
    print(df.head(args.rows).to_string(index=False))

    if "target" in df.columns:
        print("\nTarget distribution:")
        print(df.target.value_counts(dropna=False))

    if args.to_csv:
        out = Path(args.to_csv)
        out.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(out, index=False)
        print(f"\nWrote CSV to {out}")


if __name__ == "__main__":
    main()
