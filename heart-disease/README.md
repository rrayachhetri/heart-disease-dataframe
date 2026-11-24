# CardioSense — Heart Disease Risk & Care Platform

> ⚠️ **Medical Disclaimer:** CardioSense is an educational and research tool. It is **not** a certified medical device and must not be used as a substitute for professional medical advice, diagnosis, or treatment.

---

## Why CardioSense?

Heart disease is the world's leading cause of death, yet many people never get a simple risk assessment until something goes wrong. CardioSense exists to close that gap by making three things easy and free:

1. **Understand your risk today.** Answer a short, plain-language health questionnaire and get an instant, explainable risk assessment — not just a score, but *why* (which factors are driving it) and *how you compare* to real clinical research populations.
2. **Know what to do next.** Every result comes with the specific factors pushing your risk up or down, so you and your doctor can have a focused conversation instead of guessing.
3. **Actually get connected to care.** Search for doctors who accept your insurance — both providers registered directly on CardioSense and real physicians pulled live from the U.S. National Provider Identifier (NPI) registry — verify your insurance is in-network, and self-schedule an appointment, all in one flow.

CardioSense is built as an open, inspectable reference implementation: the ML model, the risk explanations, and the doctor-matching logic are all readable source code, not a black box — so anyone (patients, clinicians, students, or engineers) can see exactly how a risk score was produced.

## Overview

CardioSense is a full-stack heart disease risk prediction and care-navigation platform. Under the hood, an ensemble ML model trained on **all 4 UCI Heart Disease datasets** (Cleveland, Hungarian, Switzerland, VA — 920 combined patients) predicts cardiovascular risk from 13 clinical features, explains which factors drove each score, and benchmarks every prediction against multiple real research populations. On top of that, a patient/doctor platform lets patients find in-network doctors — both providers registered on CardioSense and real physicians from the public NPI registry — and self-schedule appointments directly.

### Current Capabilities

| Capability | Status |
|---|---|
| ML Risk Prediction (VotingClassifier — RF-300 + GBM-200 + LR, CV AUC 0.886) | ✅ |
| Multi-dataset training (Cleveland + Hungarian + Switzerland + VA, 920 patients) | ✅ |
| Median imputation for missing values (`?`, `-9`) across all datasets | ✅ |
| Per-prediction explainability (baseline-perturbation, top 6 factors) | ✅ |
| Population-percentile benchmark — every prediction ranked across all 4 cohorts | ✅ |
| Dataset comparison endpoint (`GET /api/analytics/datasets`) | ✅ |
| Population benchmark endpoint (`POST /api/analytics/population-benchmark`) | ✅ |
| Dashboard — Dataset Cohorts card (disease rates, record counts, feature stats) | ✅ |
| Result page — "How Do You Compare?" percentile bars across all 4 cohorts | ✅ |
| Model performance endpoint (`GET /api/predictions/model-info`) | ✅ |
| REST API (FastAPI) | ✅ |
| React + TypeScript Web UI | ✅ |
| User Authentication (JWT — login / register) | ✅ |
| Role-based access: Patient / Doctor | ✅ |
| Server-side prediction history (SQLite → PostgreSQL) | ✅ |
| Doctor profile management (NPI, specialty, fee, accepted insurance) | ✅ |
| **Real doctor search via the public NPI registry (by ZIP/specialty)** | ✅ **New** |
| **Declared-network insurance verification for registered doctors** | ✅ **New** |
| **Doctor self-scheduling — publish appointment slots** | ✅ **New** |
| **Patient self-booking of published appointment slots** | ✅ **New** |
| **Request-to-book flow for external (non-registered) NPI providers** | ✅ **New** |
| Dashboard KPIs, charts, notifications, toast feedback | ✅ |
| MLflow experiment tracking | ✅ |
| Docker support | ✅ |
| Playwright end-to-end test coverage of the booking flow | ✅ **New** |
| Payer-directory (Availity-style) real-time eligibility checks | 🔜 Planned |
| In-app Chat & Video consultation | 🔜 Planned |
| Payment / billing (Stripe) | 🔜 Planned |

---

## Project Structure

```
heart-disease/
├── src/
│   ├── api/
│   │   └── app.py                  # FastAPI app — routers, CORS, startup
│   ├── auth/
│   │   ├── routes.py               # POST /api/auth/register|login|refresh, GET /api/auth/me
│   │   ├── schemas.py              # Pydantic auth schemas
│   │   └── service.py              # JWT (HS256) + bcrypt helpers
│   ├── db/
│   │   ├── database.py             # SQLAlchemy engine, SessionLocal, init_db()
│   │   └── models.py               # User, Patient, Doctor, Prediction ORM models
│   ├── routers/
│   │   ├── predictions.py          # POST/GET/DELETE /api/predictions + /model-info (includes population_percentiles)
│   │   ├── analytics.py            # GET /api/analytics/datasets, POST /api/analytics/population-benchmark
│   │   ├── doctors.py              # GET/PUT /api/doctors/me, GET /api/doctors, appointment slots & bookings
│   │   └── local_doctors.py        # NPI-registry search + request-to-book for external providers
│   ├── services/
│   │   ├── insurance.py            # Declared-network insurance plan matching
│   │   └── local_doctor_search.py  # CMS NPI Registry client
│   ├── data/
│   │   ├── prepare.py              # Cleveland data → processed.parquet (legacy single-dataset)
│   │   └── prepare_multi.py        # (deprecated — logic moved into data_loader.py)
│   └── models/
│       ├── data_loader.py          # Multi-dataset loader: loads all 4 UCI datasets, imputes, computes stats + quantile arrays
│       ├── train.py                # Ensemble training (RF-300 + GBM-200 + LR) + MLflow — uses data_loader
│       └── explain.py              # Baseline-perturbation explainability (top_factors)
├── alembic/
│   ├── env.py                      # Alembic migration environment
│   ├── script.py.mako              # Migration template
│   └── versions/                   # 0001_initial, 0002_appointments, 0003_appointment_requests
├── ui/                             # React + TypeScript frontend — see ui/README.md for full frontend docs
│   ├── e2e/
│   │   └── doctor-booking.spec.ts  # Playwright end-to-end test: full doctor↔patient booking flow
│   └── src/
│       ├── sideeffects/
│       │   ├── api/                # api.ts (shared axios instance), RTK Query endpoints (auth/predict/doctor)
│       │   └── slices/             # authSlice, predictionSlice (RTK Query-adjacent, API-response caches)
│       ├── store/slices/           # sessionSlice, systemSlice, notificationSlice (local state, not API caches)
│       ├── pages/
│       │   ├── Auth/               # LoginPage, RegisterPage (Patient/Doctor role toggle)
│       │   ├── DoctorProfile/      # Doctor NPI, specialty, fee, insurance editor + appointment-slot publishing
│       │   ├── Doctors/            # Find Doctors — unified registered + NPI-registry search, booking modal
│       │   ├── Dashboard/          # KPIs, pie chart, trend area chart
│       │   ├── Predict/            # Sectioned patient data form
│       │   ├── Result/             # Animated risk gauge + verdict
│       │   └── History/            # Server-side history (auth) / localStorage (anon)
│       └── components/
│           ├── ProtectedRoute.tsx  # Redirects to /login if not authenticated
│           ├── Layout/             # Sidebar, Header (with user info + logout), Layout
│           ├── Dashboard/          # KPICard, RiskGauge
│           ├── Form/               # FormField, SelectField
│           └── Notification/       # NotificationCenter (persistent bell-icon feed)
├── .data/                          # All datasets and generated runtime artifacts
│   ├── raw/                        # UCI source and processed .data files
│   ├── processed/                  # Parquet training outputs
│   ├── models/                     # Trained model artifacts
│   ├── mlruns/                     # MLflow tracking artifacts
│   └── db/                         # SQLite databases
├── .env.example                    # Environment variable template
├── alembic.ini                     # Alembic configuration
├── requirements.txt                # Python dependencies
├── Dockerfile                      # Container image
└── README.md
```

---

## Quick Start

> The existing Python API remains the backend for the complete application. The
> Java/MongoDB migration is in progress; see [Java backend preview](#java-backend-preview).

### Prerequisites

- Python 3.10 or newer (Python 3.12 is recommended)
- Node.js 18 or newer and npm
- Both terminal servers below must remain running while you use the app

Run all backend commands from the **project root** (the directory containing `src/`,
`requirements.txt`, and `ui/`).

### macOS / Linux

```bash
python3 --version
```

Use Python 3.10 or newer. In this checkout, `.venv` is Python 3.9 and
`.venv-mac` is Python 3.12. To use the existing compatible environment:

```bash
source .venv-mac/bin/activate
python --version
```

If you are setting up a new environment and have Python 3.12 installed, create
and activate `.venv` instead:

```bash
python3.12 -m venv .venv
source .venv/bin/activate
```

With the compatible environment activated, install the backend dependencies
and create `.env` only if it does not exist:

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

if [ ! -f .env ]; then cp .env.example .env; fi
```

`.env` is a local settings file read by the backend when it starts. If `.env`
already exists in the project root, **keep using it**: do not copy
`.env.example` over it, because that would replace your existing settings.
Open the existing `.env` in a text editor and check that it contains a non-empty
`SECRET_KEY` line. Keep any other settings already in the file. Add `SECRET_KEY`
if it is missing; do not add a second copy if it is already present.

To generate a new secret, run this from the activated virtual environment:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Copy the printed value into `.env`, for example:

```env
SECRET_KEY=paste-the-generated-value-here
```

Replace the example text with the value you generated. Do not share that value
or commit `.env`. `DATABASE_URL` is optional for the default local SQLite setup;
if your existing `.env` already defines it, leave it unchanged unless you
specifically want to use another database.

Train the model and prepare the data only if `.data/models/ensemble_model.joblib`
does not already exist:

```bash
python -m src.models.train
```

Open two terminals.

**Terminal 1 - API:**

Activate the same environment you used above (`.venv-mac` for this checkout, or
`.venv` if you created a new environment):

```bash
cd /absolute/path/to/heart-disease
source .venv-mac/bin/activate
python -m uvicorn src.api.app:app --host 127.0.0.1 --port 8080 --reload --reload-dir src
```

**Terminal 2 - web UI:**

```bash
cd /absolute/path/to/heart-disease/ui
npm install
npm run dev
```

### Optional: enable Ask CardioSense chat (Ollama)

The rest of the application works without Ollama, but the chat assistant requires
Ollama installed and running locally. Install it from
[ollama.com/download](https://ollama.com/download), then open the Ollama app. Do
not also run `ollama serve` if the app has already started the service.

Check that the local Ollama server responds:

```bash
ollama --version
curl http://127.0.0.1:11434/api/tags
```

Download the chat and embedding models used by default:

```bash
ollama pull llama3.2:1b
ollama pull nomic-embed-text
ollama list
```

With the CardioSense API running, open
http://127.0.0.1:8080/api/chat/health. A working chat setup reports
`"available": true` and includes `llama3.2:1b` and `nomic-embed-text` in
`"models_installed"`. If `"available"` is false, Ollama is not reachable; if
it is true but `"models_installed"` is empty or missing one of those names,
install the missing model. The defaults can be changed with `OLLAMA_BASE_URL`,
`OLLAMA_CHAT_MODEL`, and `OLLAMA_EMBED_MODEL` in `.env`; keep the Ollama URL
local (`localhost` or `127.0.0.1`).

In this checkout, `.venv-mac` is a working Python 3.12 environment. The existing
`.venv` is Python 3.9 and cannot run this application because Python 3.9 does not
support the union type syntax used throughout the source. For a fresh environment,
create `.venv` with Python 3.12 (`python3.12 -m venv .venv`), not with a Python 3.9
`python3`.

### Windows (PowerShell)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

If `.env` already exists, keep it and edit that file rather than copying the
template over it. Ensure `SECRET_KEY` has a generated value. Train the model if
needed, and open two terminals:

**Terminal 1 - API (from the project root):**

```powershell
python -m uvicorn src.api.app:app --host 127.0.0.1 --port 8080 --reload --reload-dir src
```

**Terminal 2 - UI:**

```powershell
cd ui
npm install
npm run dev
```

### Verify and open

- API: http://127.0.0.1:8080/docs
- Health: http://127.0.0.1:8080/api/health
- Web UI: http://localhost:3000

The health response should include `"model_loaded": true`. If it reports
`"model_loaded": false`, run `python -m src.models.train` and restart the API.
The web UI will redirect to `/register` so you can create the first account.

Database tables are not created automatically by default (`AUTO_CREATE_TABLES=false`).
Initialize the schema before the first API startup:

```bash
python -m alembic upgrade head
```

For local development instead, set `AUTO_CREATE_TABLES=true` in `.env` to create
the tables automatically on startup.

> See **[ui/README.md](ui/README.md)** for the full frontend guide: tech stack, environment/proxy details, all npm scripts, the Playwright end-to-end suite, a manual end-to-end verification checklist, and UI troubleshooting.

---

## Testing (TDD)

This repo now supports frontend component/page tests and backend API tests.

### Frontend (Vitest + Testing Library)

```powershell
Push-Location .\ui
npm run test
npm run test:watch
npm run test:coverage
Pop-Location
```

### Backend API (pytest)

```powershell
# Run from the repository root with the virtual environment activated.
pip install -r .\requirements-dev.txt
python -m pytest
```

For the runtime telemetry dependency, install into the same virtual environment
that launches Uvicorn:

```powershell
.\.venv\Scripts\python.exe -m pip install -r .\requirements.txt
```

If `psutil` is unavailable, the API still starts and reports `0 MB` for process
RAM until the dependency is installed; model size, CPU time, and stage timings
remain available.

### Run all tests

From the repository root in PowerShell:

```powershell
.\run_all_tests.bat
```

The combined script runs the backend `python -m pytest` suite first and then the frontend `npm run test` suite. PowerShell requires the `.`\ prefix when executing a batch file from the current directory.

### Test file conventions

- Frontend component/page tests use per-component folders with `Component.spec.tsx` naming.
- Backend API tests use per-route folders with `*_spec.py` naming.

Examples in this repo:

- `ui/src/components/Form/FormField/test/FormField.spec.tsx`
- `ui/src/pages/Auth/LoginPage/test/LoginPage.spec.tsx`
- `tests/api/auth/test/auth_spec.py`
- `tests/api/health/test/health_spec.py`

---

## Authentication

Phase 1 introduces full JWT-based authentication.

### Roles

| Role | Access |
|---|---|
| `patient` | Run predictions, view own history, browse doctors |
| `doctor` | All patient access + manage own doctor profile |
| `admin` | Reserved for Phase 2 |

### Auth Flow

```
Register (/register)  →  Auto-login  →  Dashboard
Login    (/login)     →  JWT stored in localStorage  →  Dashboard
Token expiry (30 min) →  Re-login required (refresh endpoint available for Phase 2 auto-refresh)
Logout                →  Tokens cleared, redirect to /login
```

### API Endpoints — Auth

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/auth/register` | Create account | Public |
| `POST` | `/api/auth/login` | Get access + refresh tokens | Public |
| `POST` | `/api/auth/refresh` | Rotate tokens | Public |
| `POST` | `/api/auth/forgot-password` | Request a password reset token (15 min expiry) | Public |
| `POST` | `/api/auth/reset-password` | Reset password using a valid reset token | Public |
| `GET` | `/api/auth/me` | Get current user profile | 🔒 Bearer |

> **No email service is wired up yet.** `/forgot-password` logs the reset token to the server console and — outside of `ENVIRONMENT=production` — also returns it in the response body as `dev_reset_token` so the UI flow (`/forgot-password` → `/reset-password`) works end-to-end locally.

> **Identity verification:** `/forgot-password` requires `email` + `first_name` + `last_name` to all match the account's profile before a reset token is issued. If the email doesn't exist, or the name doesn't match, the same generic message is returned either way — so an attacker can't use this endpoint to enumerate registered emails or guess names.

**Example — Register:**

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/auth/register" -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"jane@example.com","password":"secret123","role":"patient","first_name":"Jane","last_name":"Doe"}'
```

**Example — Login:**

```powershell
$tokens = Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/auth/login" -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"jane@example.com","password":"secret123"}'
$token = $tokens.access_token
```

---

## Predictions API

Predictions are saved to the database when authenticated, and available via `localStorage` for anonymous sessions.

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/predictions` | Run prediction + per-feature explanations | Optional 🔓 |
| `GET` | `/api/predictions` | Get own prediction history | 🔒 Bearer |
| `DELETE` | `/api/predictions/{id}` | Delete a prediction record | 🔒 Bearer |
| `GET` | `/api/predictions/model-info` | Model metrics + feature importances | Public |

**Example — Predict (authenticated):**

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/predictions" -Method POST `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{"age":63,"sex":1,"cp":3,"trestbps":145,"chol":233,"fbs":1,"restecg":0,"thalach":150,"exang":0,"oldpeak":2.3,"slope":0,"ca":0,"thal":1}'
```

**Response:**

```json
{
  "id": "uuid-of-saved-record",
  "probability": 0.87,
  "prediction": 1,
  "risk_level": "high",
  "top_factors": [
    {
      "feature": "thal",
      "label": "Thalassemia",
      "value": 7,
      "population_mean": 4.73,
      "unit": "",
      "contribution": 0.147,
      "direction": "increases_risk"
    }
  ],
  "population_percentiles": [
    {
      "feature": "thal",
      "label": "Thalassemia",
      "value": 7,
      "cohort": "combined",
      "percentile": 88,
      "interpretation": "Higher than 88% of the combined study population (n=920)"
    },
    {
      "feature": "thal",
      "label": "Thalassemia",
      "value": 7,
      "cohort": "cleveland",
      "percentile": 91,
      "interpretation": "Higher than 91% of the Cleveland cohort (n=303)"
    }
  ]
}
```

`contribution` is the probability delta (−1 to +1) when this feature is swapped from the population mean to the patient's actual value. Positive = increases risk.

**`GET /api/predictions/model-info` Response:**

```json
{
  "model_type": "VotingClassifier (RF-300 + GBM-200 + LR)",
  "metrics": {
    "val_auc": 0.9420, "val_accuracy": 0.8333,
    "val_sensitivity": 0.7857, "val_specificity": 0.875,
    "val_precision": 0.8462, "val_f1": 0.8148,
    "cv_auc_mean": 0.8941, "cv_auc_std": 0.042
  },
  "feature_importances": [
    { "feature": "cp", "label": "Chest Pain Type", "importance": 0.1565 }
  ]
}
```

**Risk Levels:**

| Level | Probability Range |
|---|---|
| `low` | < 40% |
| `moderate` | 40% – 69% |
| `high` | ≥ 70% |

---

## Analytics API (Multi-Dataset)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/analytics/datasets` | Summary stats for all 4 training cohorts | Public |
| `POST` | `/api/analytics/population-benchmark` | Percentile ranks for supplied feature values | Public |

### `GET /api/analytics/datasets`

Returns record counts, disease rates, and per-feature mean/std/min/max for every training cohort (cleveland, hungarian, switzerland, va, combined).

**Example response (abbreviated):**

```json
{
  "datasets": [
    {
      "name": "cleveland",
      "meta": { "total_records": 303, "disease_rate": 0.459, "feature_count": 13 },
      "features": {
        "age": { "mean": 54.44, "std": 9.04, "min": 29.0, "max": 77.0, "missing_rate": 0.0 },
        "chol": { "mean": 246.69, "std": 51.78, "min": 126.0, "max": 564.0, "missing_rate": 0.0 }
      }
    }
  ],
  "note": "Combined dataset used for model training: 920 records from 4 UCI research cohorts."
}
```

### `POST /api/analytics/population-benchmark`

Returns per-feature percentile ranks and plain-English interpretations across all cohorts.

**Request body:**

```json
{
  "features": {
    "age": 63,
    "chol": 233,
    "thalach": 150,
    "oldpeak": 2.3
  }
}
```

**Example response (abbreviated):**

```json
{
  "benchmarks": [
    {
      "feature": "age",
      "label": "Age",
      "value": 63,
      "cohorts": [
        { "cohort": "combined", "percentile": 72, "interpretation": "Higher than 72% of the combined study population (n=920)" },
        { "cohort": "cleveland", "percentile": 75, "interpretation": "Higher than 75% of the Cleveland cohort (n=303)" }
      ]
    }
  ]
}
```

---

## Doctors API

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/doctors` | List doctors (filter by specialty, insurance) | Public |
| `GET` | `/api/doctors/recommendations` | Recommend accepting doctors matching a declared insurance plan | Public |
| `GET` | `/api/doctors/{id}` | Get doctor by ID | Public |
| `GET` | `/api/doctors/{id}/insurance` | Verify a payer against one doctor's declared plans | Public |
| `GET` | `/api/doctors/me` | Get own doctor profile | 🔒 Doctor role |
| `PUT` | `/api/doctors/me` | Update own doctor profile | 🔒 Doctor role |

**Query params for `GET /api/doctors`:**

| Param | Example | Description |
|---|---|---|
| `specialty` | `Cardiology` | Filter by specialty (case-insensitive substring) |
| `insurance` | `BlueCross` | Filter by accepted insurance plan |
| `accepting_only` | `true` | Only show doctors accepting new patients (default: `true`) |

Phase 2 normalizes payer names for matching (`Blue-Cross`, `blue cross`, and
`Blue Cross` match) and validates NPI values as exactly 10 digits. Insurance
verification currently uses the plans declared in each doctor profile and
returns the verification source explicitly. Patients should confirm benefits
with their insurer before booking; a payer-directory integration can replace
this service without changing the API response shape.

**Example — Update doctor profile:**

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/doctors/me" -Method PUT `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{"npi_number":"1234567890","specialty":"Cardiology","consultation_fee":95,"accepted_insurance":["BlueCross","Aetna"]}'
```

> NPI format verification is currently local (exactly 10 digits). A future NPPES integration can add registry-level identity verification.

### Appointment Slots & Booking (registered doctors)

Doctors publish their own availability; patients book directly against a specific in-network doctor.

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/doctors/me/slots` | List the signed-in doctor's own published appointment slots | 🔒 Doctor role |
| `POST` | `/api/doctors/me/slots` | Publish a new appointment slot (`starts_at`, `ends_at`) | 🔒 Doctor role |
| `DELETE` | `/api/doctors/me/slots/{slot_id}` | Remove an unbooked slot | 🔒 Doctor role |
| `GET` | `/api/doctors/{doctor_id}/slots` | List a doctor's open (unbooked, future) slots | Public |
| `POST` | `/api/doctors/{doctor_id}/bookings` | Book an open slot (validates the patient's insurance is in-network first) | 🔒 Patient role |

All timestamps are returned as explicit UTC-offset ISO 8601 strings (e.g. `2026-10-15T21:30:00+00:00`) so the browser never misinterprets a naive timestamp as local time — the UI converts to the viewer's local timezone for display.

**Example — Publish a slot:**

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/doctors/me/slots" -Method POST `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{"starts_at":"2026-10-15T21:30:00.000Z","ends_at":"2026-10-15T22:00:00.000Z"}'
```

**Example — Book a slot:**

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/doctors/$doctorId/bookings" -Method POST `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{"slot_id":"$slotId","insurance":"Blue Cross"}'
```

### Real Doctor Search & Request-to-Book (NPI Registry)

Beyond doctors registered directly on CardioSense, patients can search the free, public [CMS NPI Registry](https://npiregistry.cms.hhs.gov/) (no API key required) by ZIP code and specialty, and request an appointment with any real provider found this way — useful when no registered doctor matches.

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/local-doctors/search` | Search real providers from the NPI registry by ZIP/postal code + optional specialty | Public |
| `POST` | `/api/local-doctors/requests` | Submit a request-to-book for an external (non-registered) provider | 🔒 Patient role |
| `GET` | `/api/local-doctors/requests/me` | List the signed-in patient's own appointment requests | 🔒 Patient role |

If an NPI-search result happens to match a doctor already registered on CardioSense (matched by NPI number), the UI shows it as bookable in-app instead of a request-to-book — the Find Doctors page automatically de-duplicates and merges both sources into a single result list.

---

## Web UI Features

| Page | Path | Features |
|---|---|---|
| **Login** | `/login` | JWT login, link to register, "Forgot password?" (shown after a failed login) |
| **Register** | `/register` | Patient or Doctor account creation |
| **Forgot / Reset Password** | `/forgot-password`, `/reset-password` | Identity-confirmed password reset (email + first/last name match required) |
| **Dashboard** | `/` | **Emergency card** (tap-to-call 911), KPI cards, risk distribution pie chart, risk trend area chart, **Health Trends** (cholesterol/BP/heart-rate trend vs. first assessment), **Nearby Hospitals** finder (geolocation + OpenStreetMap) |
| **Model Insights** | `/model-insights` | Model performance card with AUC badge + feature importance bar chart, **Dataset Cohorts card** (4 research cohorts with record counts, disease rates, and feature averages), plus computed model footprint, process RAM, CPU capacity, and prediction-stage timings |
| **Predict** | `/predict` | Sectioned form (Personal / Symptoms / Vitals), validation |
| **Result** | `/result` | Animated SVG risk gauge, color-coded verdict, patient summary, **"Why This Score?"** animated contribution bars per feature, **"How Do You Compare?"** population benchmark section with per-cohort percentile bars for each top-impact feature |
| **History** | `/history` | Server-side history when logged in, localStorage fallback for anonymous |
| **Find Doctors** | `/doctors` | Patient-only: search by insurance plan (required) + specialty/ZIP (optional); merges registered in-app doctors with real NPI-registry providers into one deduped, verified-in-network result grid; book a published slot directly, or submit a request-to-book for external providers |
| **Doctor Profile** | `/doctor/profile` | Doctor-only: NPI, specialty, fee, insurance, accepting-patients toggle, and self-service appointment-slot publishing/removal |

**Header (when logged in):**
- Displays user name, role badge
- Notification bell with unread count
- Logout button (clears tokens, redirects to `/login`)

**Sidebar:**
- Patient: Dashboard, New Prediction, History, Model Insights
- Doctor: Dashboard, New Prediction, History, Model Insights, **My Profile**

---

## Accessibility (ADA / WCAG)

Accessibility improvements applied across the auth pages, dashboard, sidebar, and new widgets:

- **Skip link** — `Skip to main content` link at the top of every authenticated page, visible on keyboard focus, jumps past the sidebar/header to `#main-content`.
- **Keyboard operability** — clickable KPI cards are real interactive elements (`role="button"`, `tabIndex`, `Enter`/`Space` activation, visible focus ring) instead of click-only `div`s.
- **Landmarks** — `<nav>`, `<main>`, and `<aside>` regions are already in place via `Sidebar`/`Layout`; new widgets use `<section aria-labelledby="...">` with a heading `id` for screen-reader navigation.
- **ARIA live regions** — Nearby Hospitals uses `role="status"` for loading and `role="alert"` for errors so screen readers announce state changes.
- **Decorative icons** — icons used purely for decoration are `aria-hidden="true"`; interactive icon-only controls have `aria-label`.
- **Color contrast** — emergency/error/success states use the existing high-contrast danger/success palette (WCAG AA 4.5:1 for body text).
- **Focus-visible outlines** — all new interactive elements (Call 911, Find hospitals, Directions, clickable KPI cards) show a clear focus ring for keyboard users.

> This is not an exhaustive, certified accessibility audit — it targets the components touched in this pass (auth flow, dashboard, sidebar). A full WCAG 2.1 AA audit across every page (forms, charts, modals) is recommended before a production/clinical rollout.



---

## Database Schema

```
users          id, email, hashed_password, role, is_active, is_verified, created_at
patients       id, user_id, first_name, last_name, date_of_birth, insurance_id, insurance_provider, phone
doctors        id, user_id, first_name, last_name, npi_number, specialty, bio, phone,
               consultation_fee, accepted_insurance (JSON), is_npi_verified, is_accepting_patients, rating
predictions    id, user_id (nullable), risk_score, risk_level, prediction, features_json, created_at
```

Default: **SQLite** (`.data/db/cardiosense.db`).
Production: set `DATABASE_URL=postgresql://...` in `.env`.

### Inspect the local SQLite DB

List all registered user accounts:

```powershell
.\.venv\Scripts\python.exe -c "import sqlite3; con=sqlite3.connect('.data/db/cardiosense.db'); cur=con.execute('SELECT id, email, role, is_active, is_verified, created_at FROM users'); [print(r) for r in cur.fetchall()]; con.close()"
```

List saved predictions for a user:

```powershell
.\.venv\Scripts\python.exe -c "import sqlite3; con=sqlite3.connect('.data/db/cardiosense.db'); cur=con.execute('SELECT id, user_id, risk_score, risk_level, created_at FROM predictions'); [print(r) for r in cur.fetchall()]; con.close()"
```

Or open `.data/db/cardiosense.db` directly in [DB Browser for SQLite](https://sqlitebrowser.org/) to browse/edit tables visually.

To wipe all local data and start fresh (tables recreate automatically on next server start since `AUTO_CREATE_TABLES=true`):

```powershell
Remove-Item .\.data\db\cardiosense.db
```

---

## Java backend preview

The Java 17 Spring Boot project in [`java-backend/`](java-backend/) is a migration
preview, **not yet a replacement for the Python API**. It implements REST
registration, login, refresh, `/api/auth/me`, registered-doctor profiles, declared
insurance matching, appointment slots, and booking using MongoDB. Doctor profiles
are embedded in newly registered doctor users; bookings are embedded in slots and
claimed with an atomic conditional update. A unique index prevents duplicate
doctor/start-time slots. This is not a real-time insurer verification or a booking
with an external provider.

MongoDB users are separate from SQLite users; no data is copied automatically.
Doctor users created in the earlier Java preview without an embedded profile need
a migration before they can use the doctor endpoints. Password reset, external
provider search and requests, predictions, chat, Kafka, and OpenShift deployment
are not implemented in Java yet. A read-only GraphQL API is available for
registered doctors and their available slots. Java analytics endpoints delegate
to the existing Python API, which must also be running. The UI defaults to Python;
an optional Java preview mode is described below.

The Java preview requires a running MongoDB server, Java 17, and a JWT secret of
at least 32 UTF-8 bytes. The Maven wrapper downloads Maven when first run. It does
not load the Python `.env` file automatically.

On macOS without Homebrew, download the **macOS ARM 64** (Apple Silicon) or
**macOS x64** archive from the [MongoDB Community download page](https://www.mongodb.com/try/download/community).
For example, with the Apple Silicon 8.0.38 archive in `~/Downloads`, extract it
and start MongoDB in its own terminal:

```bash
if [ ! -x "$HOME/Downloads/mongodb-macos-aarch64--8.0.38/bin/mongod" ]; then tar -xzf "$HOME/Downloads/mongodb-macos-arm64-8.0.38.tgz" -C "$HOME/Downloads"; fi
mkdir -p "$HOME/data/cardiosense-mongodb"
"$HOME/Downloads/mongodb-macos-aarch64--8.0.38/bin/mongod" --dbpath "$HOME/data/cardiosense-mongodb" --bind_ip 127.0.0.1 --port 27017
```

Keep that terminal open; press **Ctrl+C** to stop MongoDB. These paths differ
for other versions and architectures. The tarball does not include `mongosh`.
This example has no database authentication and is for local development only;
do not expose it to the network.

In another terminal, for a temporary local secret, run the following from the
project root (tokens created with this secret become invalid when you generate
another one):

```bash
export SECRET_KEY="$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))')"
cd java-backend
./mvnw test
./mvnw spring-boot:run
```

By default the Java preview connects to `mongodb://localhost:27017/cardiosense`
and listens on port 8081. Set `MONGODB_URI` or `PORT` in the environment to
override these settings. Do not share or commit secrets or database credentials.
Keep MongoDB and Java running in their separate terminals. To stop either, press
**Ctrl+C** in its terminal.

In a third terminal, check the Java API and its MongoDB connection:

```bash
curl -i http://127.0.0.1:8081/api/auth/me
curl http://127.0.0.1:8081/api/doctors
```

The first request should return `401` because no token was supplied. The doctor
list should return JSON (an empty `[]` is normal for a fresh database). To query
the Java GraphQL endpoint:

```bash
curl -X POST http://127.0.0.1:8081/graphql -H 'Content-Type: application/json' -d '{"query":"{ doctors { id firstName lastName specialty } }"}'
```

GraphQL currently supports only the public `doctors`, `doctor`, and
`availableSlots` queries; it does not yet support authentication, mutations, or
UI integration. Restart the Java process yourself after changing Java code or
dependencies. After a restart, a newly generated temporary `SECRET_KEY` makes old
Java login tokens invalid.

To check the Java analytics endpoint, start the Python API on port 8080 first,
then run:

```bash
curl http://127.0.0.1:8081/api/analytics/datasets
```

The Java service defaults to `http://127.0.0.1:8080` for model data; set
`MODEL_SERVICE_URL` to a different local HTTP origin if needed. Only loopback
addresses are allowed because the benchmark request contains health features.
If the Python service is unavailable, the Java analytics endpoint returns 503.

### Use Java APIs in the UI (local preview)

Keep MongoDB, Java on port 8081, and Python on port 8080 running. Stop the
existing UI with **Ctrl+C** in its terminal, then run:

```bash
cd "$HOME/Desktop/heart-disease-prediction-model/heart-disease-dataframe/heart-disease/ui"
VITE_API_BACKEND=java npm run dev
```

Open http://localhost:3000 and register a new Java account; existing Python
SQLite accounts are not copied to MongoDB. Registration, login, registered
doctors, slots, bookings, and analytics use Java. Analytics still delegates to
Python. Predictions, chat, model info, and external provider searches use Python
without a Java login; predictions are anonymous on the server. Prediction history
in this mode is stored locally in the browser, is shared by users of that browser,
and is not synchronized to either database. Python doctor IDs are not linked to
Java bookings. Password reset and external-provider appointment requests are
unavailable for Java accounts. GraphQL is not yet used by the UI.

The Vite development server proxies `/java-api` to Java and `/api` to Python.
Other deployments need equivalent same-origin routing; the preview flag is baked
into production builds. To return to the existing Python UI, stop Vite and start
it again with `npm run dev` (without `VITE_API_BACKEND=java`).

To run the Java tests, including integration tests, with local MongoDB and the
Python API running:

```bash
cd "$HOME/Desktop/heart-disease-prediction-model/heart-disease-dataframe/heart-disease/java-backend"
RUN_MONGO_INTEGRATION=true RUN_MODEL_INTEGRATION=true ./mvnw test
```

The integration test creates and removes its own randomly named test database;
it does not use the `cardiosense` application database. The model integration
test sends synthetic data to the Python API. The Java preview and end-to-end UI
cutover are still in development.

---

## Known Local-Setup Quirks

- **Python 3.9 gives `TypeError: unsupported operand type(s) for |`** — use Python 3.10 or newer. Check `python --version` after activating the virtual environment; creating a virtual environment with Python 3.9 does not make it a newer Python environment.
- **`No such revision or branch 'f4a9b2c7d1e6'` while training** — the active environment's MLflow is older than the schema recorded in `.data/db/mlflow.db`. This checkout's `.venv` uses MLflow 3.1.4, while `.venv-mac` uses Python 3.12 and MLflow 3.18, which includes that migration. Activate `.venv-mac` before retraining; do not delete or edit the database to work around the mismatch. If `.data/models/ensemble_model.joblib` already exists, skip training.
- **`NotOpenSSLWarning` from urllib3** — this warning indicates the active Python is linked against LibreSSL. It is not the cause of the MLflow migration failure; use the Python 3.12 environment above.
- **No `uvicorn` module on macOS** — install dependencies inside the project virtual environment with `python -m pip install -r requirements.txt`, then run `python -m uvicorn ...`. Do not run the system `/usr/bin/python3`.
- **`[Errno 48] Address already in use` on port 8080** — the API is probably already running. Check `http://127.0.0.1:8080/api/health`; if it returns `"status": "ok"`, keep using that server and do not start a second one. Otherwise, stop the API in the terminal where it was started with **Ctrl+C**, then start it again. Port `3000` is used by the UI.
- **`ModuleNotFoundError: No module named 'src'` running `python .\src\models\train.py` directly** — run it as a module instead (`python -m src.models.train`), or make sure the project root is on `sys.path` (already patched in `train.py`).
- **`SECRET_KEY environment variable is not set`** — you must copy `.env.example` to `.env` and set a real `SECRET_KEY`; there is no default in code for security reasons. Generate one quickly with:
  ```powershell
  .\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(48))"
  ```
- **`ModuleNotFoundError` for `email_validator`, `bcrypt`, `jose`, `passlib`, or `python_multipart`** — these are auth/schema dependencies not always pulled in transitively; reinstall everything with `pip install -r requirements.txt` to sync the venv.
- **`pip check`** — run `.\.venv\Scripts\python.exe -m pip check` any time to confirm there are no broken/conflicting dependencies in the venv.
- **`.env` is gitignored** — never commit real secrets; only `.env.example` (a template with no real values) is tracked.

---

## Docker

```powershell
docker build -t cardiosense:dev .
docker run -p 8080:8080 --env-file .env cardiosense:dev
```

> Ensure `.data/models/rf_model.joblib` exists and `.env` is configured before building.

---

## MLflow

```powershell
mlflow ui --backend-store-uri sqlite:///./.data/db/mlflow.db --default-artifact-root ./.data/mlruns
# open http://127.0.0.1:5000
```

---

## Roadmap

| Phase | Feature | Status |
|---|---|---|
| **1** | JWT Auth, Database, Doctor Profiles | ✅ Done |
| **2** | Real NPI-registry doctor search, declared-network insurance verification, doctor-published appointment slots, patient self-booking, request-to-book for external providers | ✅ Done |
| **3** | Payer-directory (Availity-style) real-time eligibility checks | 🔜 Next |
| **4** | In-app WebSocket chat + Agora.io video calls (HIPAA-compliant) | 🔜 Planned |
| **5** | Stripe payments, doctor payouts, co-pay calculation | 🔜 Planned |
| **6** | HIPAA audit, encryption at rest, CI/CD, rate limiting | 🔜 Planned |

---

## Notes

- **Multi-dataset training:** The model is now trained on 920 patients from four UCI research cohorts (Cleveland 303, Hungarian 294, Switzerland 123, VA 200). This triples the training set and dramatically stabilizes CV performance (std dropped from ±0.042 to ±0.006).
- **Missing value imputation:** Cleveland/Switzerland/VA datasets use `?` for missing values; Hungarian uses `-9`/`-9.0`. All are detected and replaced with cohort-pool medians via `src/models/data_loader.py`. Physiologically-impossible zeros (e.g., `chol=0`, `trestbps=0`) are also imputed.
- **Population percentiles:** Every prediction response includes `population_percentiles` — the patient's value for each top-impact feature ranked against 5 scopes (combined, cleveland, hungarian, switzerland, va). Computed via pre-built 101-point quantile arrays stored in the model joblib (O(log N) lookup, no raw data stored at runtime).
- **Dataset disease rates vary dramatically:** Switzerland 93.5 %, VA 74.5 %, Cleveland 45.9 %, Hungarian 36.1 %. The benchmark "How Do You Compare?" section on the Result page always labels which cohort each bar represents so percentiles are interpretable in context.
- The ensemble model (`ensemble_model.joblib`) stores the trained model, feature importances, population statistics, quantile arrays, and CV metrics as a single dict — enabling explainability and benchmarking without a separate feature store.
- **Runtime inference telemetry:** Model Insights reports the serialized model footprint, current API process RSS, CPU core count, wall-clock prediction time, CPU time, feature-frame creation, model inference, explainability, population benchmarking, and database persistence timings. These are measured by the API at runtime; `model_memory_mb` is the serialized model file size, while `runtime_ram_mb` is the API process RSS.
- Per-prediction explanations use baseline perturbation: each feature's contribution = P(risk | feature=patient_value, rest=mean) − P(risk | all=mean). This is model-agnostic and requires no additional libraries.
- The ML model is for **educational/research purposes only** and is not a medical diagnostic device.
- JWT access tokens expire in 30 minutes; refresh tokens in 7 days (configurable via `.env`).

---

## Server Architecture & Request Flow

### How the Two Servers Work Together

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR MACHINE                             │
│                                                                 │
│   Browser (localhost:3000)                                      │
│        │                                                        │
│        │  HTTP requests to /api/*                               │
│        ▼                                                        │
│   ┌─────────────────────┐                                       │
│   │  Vite Dev Server    │  ← npm run dev  (port 3000)           │
│   │  React + TypeScript │                                       │
│   │  (ui/ folder)       │                                       │
│   └────────┬────────────┘                                       │
│            │  Vite PROXY: /api/* → http://127.0.0.1:8080        │
│            │  (configured in vite.config.ts)                    │
│            ▼                                                     │
│   ┌─────────────────────┐                                       │
│   │  FastAPI (uvicorn)  │  ← uvicorn ... (port 8080)            │
│   │  Python backend     │                                       │
│   │  (src/ folder)      │                                       │
│   └────────┬────────────┘                                       │
│            │                                                    │
│     ┌──────┴──────┐                                             │
│     ▼             ▼                                             │
│  SQLite DB    ensemble_model.joblib                             │
│  (cardio-     (VotingClassifier:                                │
│  sense.db)     RF-300 + GBM-200 + LR)                          │
└─────────────────────────────────────────────────────────────────┘
```

**The key point:** The React app never talks directly to the backend. Every `/api/*` request goes to Vite first, which proxies it to FastAPI on port 8080. This means **both servers must be running simultaneously**.

---

## Running the Servers (Detailed)

### Step 1 — Start the FastAPI Backend

Open **Terminal 1** in the project root and activate the same Python 3.10+ environment
you used in Quick Start. For this checkout, use `.venv-mac`; if you created a fresh
`.venv`, substitute that directory instead.

macOS/Linux:

```bash
source .venv-mac/bin/activate
python -m uvicorn src.api.app:app --host 127.0.0.1 --port 8080 --reload --reload-dir src
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn src.api.app:app --host 127.0.0.1 --port 8080 --reload --reload-dir src
```

**What happens on startup:**
1. Python imports `src/api/app.py`
2. All routers are registered (auth, predictions, doctors)
  3. `startup_event()` fires — loads `.data/models/ensemble_model.joblib` into memory (falls back to `rf_model.joblib` if ensemble not present)
4. `init_db()` creates the SQLite tables (`users`, `patients`, `doctors`, `predictions`) if they don't exist yet
5. Uvicorn begins accepting connections on `127.0.0.1:8080`

Expected output:
```
INFO:     Started reloader process
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8080
```

> `--reload-dir src` limits auto-restarts to backend source changes. This avoids
> restarting the server when files change in `.venv`, `.data`, or other project
> directories.

---

### Step 2 — Start the React Frontend

Open **Terminal 2** in the project root:

macOS/Linux:

```bash
cd ui
npm install
npm run dev
```

Windows PowerShell:

```powershell
cd ui
npm install      # first time only
npm run dev
```

**What happens on startup:**
1. Vite compiles all TypeScript/React source files
2. Dev server starts on port 3000 (or 3001 if 3000 is occupied)
3. Vite reads `vite.config.ts` and registers the proxy: `/api/*` → `http://127.0.0.1:8080`
4. On first browser load, `main.tsx` renders `App.tsx`
5. `App.tsx` boots the Redux store, which checks `localStorage` for a saved `access_token`
6. If a token is found, it calls `GET /api/auth/me` to restore the user session automatically

Open **http://localhost:3000** in your browser.

> Always start the **backend first**, then the frontend. If the backend is not running, every API call will return a 502/500 error.

---

## How Each API Request Works (Deep Dive)

### POST `/api/auth/register`

```
Browser RegisterPage.tsx
  → dispatch(registerUser({email, password, role, first_name, last_name}))
    → authSlice.ts → apiRegister(payload)
      → fetch POST /api/auth/register  {JSON body}
        → Vite proxy forwards → http://127.0.0.1:8080/api/auth/register
          → FastAPI routes.py register()
            1. Validates email format and password length (≥ 8 chars)
            2. Checks email not already registered
            3. Hashes password with bcrypt (passlib)
            4. Creates User row in `users` table
            5. db.flush() → gets the new user.id before commit
            6. Creates Patient OR Doctor profile row (based on role)
            7. db.commit() → persists everything atomically
            8. Returns UserResponse (id, email, role, first_name, last_name)
  ← 201 Created
→ RegisterPage immediately dispatches loginUser() with the same credentials
→ On success, redirects to Dashboard "/"
```

**Request body:**
```json
{
  "email": "jane@example.com",
  "password": "mypassword123",
  "role": "patient",
  "first_name": "Jane",
  "last_name": "Doe"
}
```

---

### POST `/api/auth/login`

```
Browser LoginPage.tsx
  → dispatch(loginUser({email, password}))
    → authSlice.ts → apiLogin(payload)
      → fetch POST /api/auth/login
        → FastAPI routes.py login()
          1. Looks up user by email in DB
          2. verify_password() — bcrypt compares plain text vs stored hash
          3. Creates access_token  (JWT HS256, expires 30 min)
          4. Creates refresh_token (JWT HS256, expires 7 days)
          5. Returns {access_token, refresh_token, token_type: "bearer"}
  ← 200 OK + tokens
→ saveTokens() persists both to localStorage
→ authSlice calls getMe() → GET /api/auth/me to load full user object
→ Stores user in Redux state → protected routes now accessible
→ Redirects to "/" (Dashboard)
```

**JWT token payloads:**
```
access_token:  { sub: "<user-uuid>", role: "patient", type: "access", exp: <timestamp> }
refresh_token: { sub: "<user-uuid>", type: "refresh", exp: <timestamp> }
```

---

### GET `/api/auth/me`

```
Any protected page loads (or page refresh)
  → ProtectedRoute checks Redux state
  → If not initialized, checks localStorage for access_token
    → fetch GET /api/auth/me  (Authorization: Bearer <token>)
      → FastAPI get_current_user() dependency
        1. Extracts Bearer token from Authorization header
        2. decode_token() → verifies JWT signature + checks expiry
        3. Checks token type == "access"
        4. Queries User by id from token's "sub" claim
        5. Checks user.is_active == True
        6. Returns UserResponse with profile names attached
```

---

### POST `/api/predictions`

```
Browser PredictPage.tsx (form submit)
  → validate() — checks all 13 fields are present and within clinical ranges
  → dispatch(submitPrediction(payload))
    → predictApi.ts → fetch POST /api/predictions
      (includes Authorization: Bearer <token> if logged in)
        → FastAPI predictions.py predict()
          1. Imports _model_data from app global state (loaded at startup)
          2. Builds pandas DataFrame with named feature columns
          3. model.predict_proba(X)[0][1] → float probability (0.0–1.0)
          4. model.predict(X)[0]          → binary prediction (0 or 1)
          5. _risk_level() → "low" / "moderate" / "high"
          6. compute_top_factors() → per-feature probability deltas (explain.py)
          7. If user authenticated → saves Prediction row to DB
          8. Returns {id, probability, prediction, risk_level, top_factors}
  ← JSON result
→ predictionSlice stores result + patient data in Redux + localStorage
→ navigate('/result') → shows animated ResultPage
```

**Risk level thresholds:**
```
probability >= 0.70  →  "high"
probability >= 0.40  →  "moderate"
probability <  0.40  →  "low"
```

---

### POST `/api/auth/refresh`

```
When access_token expires (30 min):
  → fetch POST /api/auth/refresh  { "refresh_token": "..." }
    → FastAPI refresh()
      1. decode_token() verifies the refresh token's signature
      2. Checks token type == "refresh"
      3. Looks up user in DB, checks is_active
      4. Issues a brand new access_token + refresh_token pair
  ← 200 OK + new tokens
→ saveTokens() updates localStorage with the new pair
```

---

## Step-by-Step UI Testing Guide

### Test 1 — Register a Patient Account
1. Go to **http://localhost:3000/register**
2. Click the **"Patient"** role button
3. Fill in: First name, Last name, a valid Email, Password (min 8 chars)
4. Click **"Create account"**
5. **Expected:** Auto-login fires → you land on the **Dashboard**

---

### Test 2 — Register a Doctor Account
1. Go to **http://localhost:3000/register**
2. Click the **"Doctor"** role button
3. Use a **different email** from Test 1
4. **Expected:** Auto-login → Dashboard; the Sidebar now shows **"My Profile"** link

---

### Test 3 — Logout & Login
1. Click the **Logout** button in the top-right Header
2. You are redirected to `/login`
3. Enter the credentials from Test 1
4. **Expected:** Successful login → Dashboard

---

### Test 4 — Run a Heart Disease Prediction
1. Click **"New Prediction"** on the Dashboard or navigate to `/predict`
2. Fill in the form using this sample high-risk patient:

| Field | Value |
|-------|-------|
| Age | `63` |
| Sex | Male |
| Chest Pain Type | Asymptomatic |
| Resting BP | `145` |
| Cholesterol | `233` |
| Fasting Blood Sugar > 120 | Yes |
| Resting ECG | Normal |
| Max Heart Rate | `150` |
| Exercise Induced Angina | No |
| ST Depression (oldpeak) | `2.3` |
| ST Slope | Upsloping |
| Major Vessels (ca) | `0` |
| Thalassemia | Fixed Defect |

3. Click **"Predict Risk"**
4. **Expected:** Navigate to `/result` showing a risk score gauge, probability %, High/Low Risk badge, and a summary of the input data

---

### Test 5 — View Prediction History
1. After running one or more predictions, navigate to `/history`
2. **Expected:** A table showing date, age, sex, risk score bar, and result badge for each prediction
3. Click the **trash icon** on a row → that row is removed from history

---

### Test 6 — Page Refresh Session Persistence
1. Login and navigate to the Dashboard
2. Press **F5** to hard-refresh the page
3. **Expected:** Page reloads without redirecting to `/login` — the stored token in `localStorage` is validated automatically via `GET /api/auth/me` on app startup

---

### Test 7 — API Testing via Swagger UI

The backend ships with an interactive API explorer. With the backend running:

1. Open **http://127.0.0.1:8080/docs**
2. Click `POST /api/auth/register` → **Try it out** → paste and execute:
```json
{
  "email": "testdoc@example.com",
  "password": "password123",
  "role": "doctor",
  "first_name": "John",
  "last_name": "Smith"
}
```
3. Click `POST /api/auth/login` → login with the same credentials → copy the `access_token` from the response
4. Click **Authorize** (top-right of the Swagger page) → enter `Bearer <your_token>`
5. Now test any authenticated endpoint — `GET /api/auth/me`, `POST /api/predictions`, `GET /api/predictions`, etc.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `500` on register/login | FastAPI backend not running | Start uvicorn on port 8080 (Step 1 above) |
| `Failed to fetch` / network error | Vite can't reach the backend proxy target | Confirm uvicorn is running on `127.0.0.1:8080` |
| Redirected to `/login` after page refresh | Token expired or missing from localStorage | Log in again |
| `503 Model not loaded` on predict | Model file missing at startup | Run `python -m src.models.train`; ensure `.data/models/ensemble_model.joblib` exists |
| `503` on `POST /api/chat/stream` | Ollama is unreachable or the embedding model is missing | Check `/api/chat/health`, start Ollama, then run `ollama pull nomic-embed-text` and `ollama pull llama3.2:1b` |
| CORS error in browser console | Frontend running on a port not in CORS allow-list | Add your port to `allow_origins` in `src/api/app.py` |
| `Email already registered` | Duplicate email on register | Use a different email address |
| `422 Unprocessable Entity` | Request body missing required fields | Check the request body matches the schema above |
