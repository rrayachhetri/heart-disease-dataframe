<!-- README updated by assistant: added MVP instructions -->

# Heart disease datasets — MVP project

This repository contains several variants of the classic UCI Heart Disease datasets and a small MVP pipeline for a predictive model (data prep → train → serve).

What I added (MVP)
- `requirements.txt` — Python dependencies
- `src/data/prepare.py` — reads `processed.cleveland.data`, normalizes the target, writes `data/processed.parquet`
- `src/models/train.py` — trains a RandomForest, logs metrics to MLflow, saves `models/rf_model.joblib`
- `src/api/app.py` — FastAPI app exposing `/health` and `/predict`
- `Dockerfile` — container image for the API

Quick start (PowerShell)
1) Create and activate a virtual environment, install deps

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2) Prepare data

```powershell
python .\src\data\prepare.py
# writes data/processed.parquet
```

3) Train model

```powershell
python .\src\models\train.py
# saves models/rf_model.joblib and logs to ./mlruns
```

4) Run the API server (in same activated venv)

```powershell
# start server
python -m uvicorn src.api.app:app --host 0.0.0.0 --port 8080 --log-level info
```

5) Test the API

```powershell
$body = @{
  age = 63.0; sex = 1.0; cp = 1.0; trestbps = 145.0; chol = 233.0;
  fbs = 1.0; restecg = 2.0; thalach = 150.0; exang = 0.0; oldpeak = 2.3;
  slope = 3.0; ca = 0.0; thal = 6.0
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://127.0.0.1:8080/predict' -Method Post -ContentType 'application/json' -Body $body
```

Notes & next steps
- The current preprocessing is minimal (rows with missing features are dropped). In a next iteration we can add an sklearn Pipeline with imputation and feature transforms.
- MLflow tracks training runs in `mlruns/` by default. Open `http://127.0.0.1:5000` after running `mlflow ui --backend-store-uri ./mlruns`.
- To containerize: build the image with `docker build -t heart-model:dev .` and run it with `docker run -p 8080:8080 heart-model:dev` (ensure the model artifact `models/rf_model.joblib` exists before starting the container).

If you want, I can now:
- add an sklearn Pipeline + imputation and update the API to use the pipeline (recommended next step), or
- add CI (GitHub Actions) to run tests and build the Docker image, or
- add a basic monitoring/metrics setup (Prometheus / Evidently) and example notebooks.

# activate venv first if not active
.\.venv\Scripts\Activate.ps1

# show schema, missing counts, head (default 10 rows)
python .\src\data\preview_parquet.py

# show only 5 rows
python .\src\data\preview_parquet.py --rows 5

# (optional) export to CSV for opening in the editor (careful if file is large)
python .\src\data\preview_parquet.py --to-csv data/processed.csv