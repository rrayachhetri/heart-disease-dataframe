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

---

## Mobile UI (React Native / Expo)

A cross-platform mobile frontend has been added under `ui/`. It is built with **Expo** (React Native), so it runs on Android, iOS, and in the browser — no Mac required for development.

### What was added

```
ui/
├── App.js                     # Navigation root (React Navigation stack)
├── app.json                   # Expo project config
├── package.json               # Node dependencies
└── src/
    ├── api/
    │   ├── config.js          # API base URL (edit when testing on a device)
    │   └── predict.js         # POST /predict wrapper using fetch()
    ├── components/
    │   ├── FormField.js       # Reusable numeric text input
    │   └── PickerField.js     # Reusable dropdown selector
    └── screens/
        ├── HomeScreen.js      # Patient input form (all 13 model features)
        └── ResultScreen.js    # Prediction result card with probability bar
```

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- Expo CLI (installed automatically via `npx`)

### Quick start

```powershell
cd ui
npm install
npx expo start --web      # open in browser (fastest, no device needed)
# or
npx expo start --android  # requires Android emulator / connected device
```

> **Testing on a physical device:** install [Expo Go](https://expo.dev/client) on your phone, then run `npx expo start` and scan the QR code.  
> Edit `ui/src/api/config.js` and replace `localhost` with your machine's local IP address (run `ipconfig` in PowerShell to find it, e.g. `192.168.1.100`).

### Screens

| Screen | Description |
|--------|-------------|
| **Home** | Patient data form grouped into sections: *Personal Info*, *Symptoms*, *Vitals & Test Results*. Categorical fields use dropdowns; continuous fields use numeric inputs. |
| **Result** | Displays the model's verdict (✅ Lower Risk / ⚠️ Higher Risk), the raw probability as a percentage, and a visual progress bar. Includes a medical disclaimer. |

### How it connects to the API

The app sends a `POST` request to `/predict` on the FastAPI server. Make sure the server is running (step 4 of the Quick start above) before using the app.

# activate venv first if not active
.\.venv\Scripts\Activate.ps1

# show schema, missing counts, head (default 10 rows)
python .\src\data\preview_parquet.py

# show only 5 rows
python .\src\data\preview_parquet.py --rows 5

# (optional) export to CSV for opening in the editor (careful if file is large)
python .\src\data\preview_parquet.py --to-csv data/processed.csv