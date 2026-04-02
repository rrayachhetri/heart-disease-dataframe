# CardioSense — Heart Disease Risk Platform

> ⚠️ **Medical Disclaimer:** CardioSense is an educational and research tool. It is **not** a certified medical device and must not be used as a substitute for professional medical advice, diagnosis, or treatment.

---

## Overview

CardioSense is a full-stack heart disease risk prediction platform built on a Random Forest ML model trained on the Cleveland Heart Disease Dataset. It predicts cardiovascular risk from 13 clinical features and (Phase 1+) connects patients with relevant, in-network doctors for consultations.

### Current Capabilities (Phase 1)

| Capability | Status |
|---|---|
| ML Risk Prediction (RandomForest, 200 estimators) | ✅ |
| REST API (FastAPI) | ✅ |
| React + TypeScript Web UI | ✅ |
| **User Authentication (JWT — login / register)** | ✅ Phase 1 |
| **Role-based access: Patient / Doctor** | ✅ Phase 1 |
| **Server-side prediction history (SQLite → PostgreSQL)** | ✅ Phase 1 |
| **Doctor profile management + NPI stub** | ✅ Phase 1 |
| Dashboard KPIs, charts, notifications | ✅ |
| MLflow experiment tracking | ✅ |
| Docker support | ✅ |
| Doctor in-network insurance verification | 🔜 Phase 2 |
| In-app Chat & Video consultation | 🔜 Phase 3 |
| Payment / billing (Stripe) | 🔜 Phase 4 |

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
│   │   ├── predictions.py          # POST/GET/DELETE /api/predictions
│   │   └── doctors.py              # GET/PUT /api/doctors/me, GET /api/doctors
│   ├── data/
│   │   └── prepare.py              # Cleveland data → processed.parquet
│   └── models/
│       └── train.py                # RandomForest training + MLflow logging
├── alembic/
│   ├── env.py                      # Alembic migration environment
│   ├── script.py.mako              # Migration template
│   └── versions/
│       └── 0001_initial.py         # Initial schema migration
├── ui/                             # React + TypeScript frontend
│   └── src/
│       ├── api/
│       │   ├── authApi.ts          # register(), login(), refreshTokens(), getMe()
│       │   ├── predictApi.ts       # predictHeartDisease(), fetchPredictionHistory()
│       │   └── config.ts           # API_BASE_URL, authHeaders(), token helpers
│       ├── store/slices/
│       │   ├── authSlice.ts        # loginUser, registerUser, loadCurrentUser, logout
│       │   ├── predictionSlice.ts  # submitPrediction thunk + localStorage history
│       │   └── notificationSlice.ts
│       ├── pages/
│       │   ├── LoginPage.tsx       # JWT login form
│       │   ├── RegisterPage.tsx    # Register with Patient/Doctor role toggle
│       │   ├── DoctorProfilePage.tsx # Doctor NPI, specialty, fee, insurance editor
│       │   ├── DashboardPage.tsx   # KPIs, pie chart, trend area chart
│       │   ├── PredictPage.tsx     # Sectioned patient data form
│       │   ├── ResultPage.tsx      # Animated risk gauge + verdict
│       │   └── HistoryPage.tsx     # Server-side history (auth) / localStorage (anon)
│       └── components/
│           ├── ProtectedRoute.tsx  # Redirects to /login if not authenticated
│           ├── Layout/             # Sidebar, Header (with user info + logout), Layout
│           ├── Dashboard/          # KPICard, RiskGauge
│           ├── Form/               # FormField, SelectField
│           └── Notification/       # NotificationCenter
├── models/
│   └── rf_model.joblib             # Pre-trained RandomForest
├── .env.example                    # Environment variable template
├── alembic.ini                     # Alembic configuration
├── requirements.txt                # Python dependencies
├── Dockerfile                      # Container image
└── README.md
```

---

## Quick Start

### 1. Python environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Configure environment

```powershell
copy .env.example .env
```

Edit `.env` and set at minimum:

```env
SECRET_KEY=your-long-random-secret-key-here
DATABASE_URL=sqlite:///./cardiosense.db   # SQLite (default, no setup needed)
```

For production with PostgreSQL:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/cardiosense
```

### 3. Prepare data and train model

```powershell
python .\src\data\prepare.py    # writes data/processed.parquet
python .\src\models\train.py    # saves models/rf_model.joblib, logs to mlruns/
```

### 4. Start the API

```powershell
python -m uvicorn src.api.app:app --host 127.0.0.1 --port 8080 --reload
```

The database tables (users, patients, doctors, predictions) are **created automatically on first startup** — no manual migration needed for local dev.

To run migrations explicitly with Alembic:

```powershell
alembic upgrade head
```

### 5. Start the Web UI

```powershell
cd ui
npm install
npm run dev        # http://localhost:3000
```

Open **http://localhost:3000** — you will be redirected to `/register` to create your first account.

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
Token expiry (30 min) →  Auto-refresh via refresh token (7 days)
Logout                →  Tokens cleared, redirect to /login
```

### API Endpoints — Auth

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/auth/register` | Create account | Public |
| `POST` | `/api/auth/login` | Get access + refresh tokens | Public |
| `POST` | `/api/auth/refresh` | Rotate tokens | Public |
| `GET` | `/api/auth/me` | Get current user profile | 🔒 Bearer |

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
| `POST` | `/api/predictions` | Run prediction (saves to DB if authed) | Optional 🔓 |
| `GET` | `/api/predictions` | Get own prediction history | 🔒 Bearer |
| `DELETE` | `/api/predictions/{id}` | Delete a prediction record | 🔒 Bearer |

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
  "risk_level": "high"
}
```

**Risk Levels:**

| Level | Probability Range |
|---|---|
| `low` | < 40% |
| `moderate` | 40% – 69% |
| `high` | ≥ 70% |

---

## Doctors API

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/doctors` | List doctors (filter by specialty, insurance) | Public |
| `GET` | `/api/doctors/{id}` | Get doctor by ID | Public |
| `GET` | `/api/doctors/me` | Get own doctor profile | 🔒 Doctor role |
| `PUT` | `/api/doctors/me` | Update own doctor profile | 🔒 Doctor role |

**Query params for `GET /api/doctors`:**

| Param | Example | Description |
|---|---|---|
| `specialty` | `Cardiology` | Filter by specialty (case-insensitive substring) |
| `insurance` | `BlueCross` | Filter by accepted insurance plan |
| `accepting_only` | `true` | Only show doctors accepting new patients (default: `true`) |

**Example — Update doctor profile:**

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8080/api/doctors/me" -Method PUT `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{"npi_number":"1234567890","specialty":"Cardiology","consultation_fee":95,"accepted_insurance":["BlueCross","Aetna"]}'
```

> **Phase 1 Note:** Providing an NPI number auto-marks the doctor as verified. Phase 2 will integrate the real [NPPES NPI Registry API](https://npiregistry.cms.hhs.gov/api-page).

---

## Web UI Features

| Page | Path | Features |
|---|---|---|
| **Login** | `/login` | JWT login, link to register |
| **Register** | `/register` | Patient or Doctor account creation |
| **Dashboard** | `/` | KPI cards, risk distribution pie chart, risk trend area chart |
| **Predict** | `/predict` | Sectioned form (Personal / Symptoms / Vitals), validation |
| **Result** | `/result` | Animated SVG risk gauge, color-coded verdict, patient summary |
| **History** | `/history` | Server-side history when logged in, localStorage fallback for anonymous |
| **Doctor Profile** | `/doctor/profile` | Doctor-only: NPI, specialty, fee, insurance, accepting patients toggle |

**Header (when logged in):**
- Displays user name, role badge
- Notification bell with unread count
- Logout button (clears tokens, redirects to `/login`)

**Sidebar:**
- Patient: Dashboard, New Prediction, History
- Doctor: Dashboard, New Prediction, History, **My Profile**

---

## Database Schema

```
users          id, email, hashed_password, role, is_active, is_verified, created_at
patients       id, user_id, first_name, last_name, date_of_birth, insurance_id, insurance_provider, phone
doctors        id, user_id, first_name, last_name, npi_number, specialty, bio, phone,
               consultation_fee, accepted_insurance (JSON), is_npi_verified, is_accepting_patients, rating
predictions    id, user_id (nullable), risk_score, risk_level, prediction, features_json, created_at
```

Default: **SQLite** (`cardiosense.db` in project root).
Production: set `DATABASE_URL=postgresql://...` in `.env`.

---

## Docker

```powershell
docker build -t cardiosense:dev .
docker run -p 8080:8080 --env-file .env cardiosense:dev
```

> Ensure `models/rf_model.joblib` exists and `.env` is configured before building.

---

## MLflow

```powershell
mlflow ui --backend-store-uri ./mlruns
# open http://127.0.0.1:5000
```

---

## Roadmap

| Phase | Feature | Status |
|---|---|---|
| **1** | JWT Auth, Database, Doctor Profiles | ✅ Done |
| **2** | In-network insurance verification (Availity API), appointment booking | 🔜 Next |
| **3** | In-app WebSocket chat + Agora.io video calls (HIPAA-compliant) | 🔜 Planned |
| **4** | Stripe payments, doctor payouts, co-pay calculation | 🔜 Planned |
| **5** | HIPAA audit, encryption at rest, CI/CD, rate limiting | 🔜 Planned |

---

## Notes

- Preprocessing drops rows with missing values. An sklearn Pipeline with imputation can be added as a next step.
- The ML model is for **educational/research purposes only** and is not a medical diagnostic device.
- JWT access tokens expire in 30 minutes; refresh tokens in 7 days (configurable via `.env`).
- All predictions are linked to the authenticated user. Anonymous predictions (no token) are processed but not persisted.
