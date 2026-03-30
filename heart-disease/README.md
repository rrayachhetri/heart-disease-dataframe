
        │   ├── Layout/         # Sidebar, Header, Layout
        │   ├── Dashboard/      # KPICard, RiskGauge
        │   ├── Form/           # FormField, SelectField
        │   └── Notification/   # NotificationCenter
        └── pages/
            ├── DashboardPage   # KPIs, pie chart, trend chart
            ├── PredictPage     # Sectioned patient data form
            ├── ResultPage      # Animated risk gauge + summary
            └── HistoryPage     # All past predictions with risk bars
```

---

## Quick Start

### 1. Python environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Prepare data and train model

```powershell
python .\src\data\prepare.py    # writes data/processed.parquet
python .\src\models\train.py    # saves models/rf_model.joblib, logs to mlruns/
```

### 3. Start the API

```powershell
python -m uvicorn src.api.app:app --host 127.0.0.1 --port 8080 --log-level info
```

API endpoints:
- `GET  http://127.0.0.1:8080/health`  — model health check
- `POST http://127.0.0.1:8080/predict` — predict heart disease risk
- `GET  http://127.0.0.1:8080/docs`    — Swagger UI

### 4. Start the Web UI

```powershell
cd ui
npm install
npm run dev        # http://localhost:3000
```

The Vite dev server proxies all `/api/*` requests to `localhost:8080` automatically — no CORS configuration needed.

### 5. Test the API directly

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8080/predict" -Method POST `
  -ContentType "application/json" `
  -Body '{"age":63,"sex":1,"cp":3,"trestbps":145,"chol":233,"fbs":1,"restecg":0,"thalach":150,"exang":0,"oldpeak":2.3,"slope":0,"ca":0,"thal":1}'
```

---

## Web UI Features

| Page | Features |
|---|---|
| **Dashboard** | KPI cards (total, avg risk, high/low counts), risk distribution pie chart, risk trend area chart |
| **Predict** | Sectioned form (Personal / Symptoms / Vitals), field validation, animated loading state |
| **Result** | Animated SVG risk gauge, color-coded verdict card, patient data summary, risk progress bar |
| **History** | Full prediction history, inline risk bars, high/low badges, delete per record or clear all |

**Notifications:**
- Bell icon with unread count badge in the header
- In-app notification center (dropdown) with read/unread state and timestamps
- Browser push notifications triggered automatically on prediction completion

---

## Docker

```powershell
docker build -t cardiosense:dev .
docker run -p 8080:8080 cardiosense:dev
```

> Ensure `models/rf_model.joblib` exists before building the container.

---

## MLflow

```powershell
mlflow ui --backend-store-uri ./mlruns
# open http://127.0.0.1:5000
```

---

## Notes

- Preprocessing drops rows with missing values. An sklearn Pipeline with imputation can be added as a next step.
- Prediction history is persisted in `localStorage` (up to 50 records).
- The model is for educational/research purposes only and is not a medical diagnostic tool.
'@
Set-Content -Path README.md -Value $content -Encoding UTF8