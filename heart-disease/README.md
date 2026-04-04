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
Token expiry (30 min) →  Re-login required (refresh endpoint available for Phase 2 auto-refresh)
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
│  SQLite DB    rf_model.joblib                                   │
│  (cardio-     (Random Forest                                    │
│  sense.db)     ML model)                                        │
└─────────────────────────────────────────────────────────────────┘
```

**The key point:** The React app never talks directly to the backend. Every `/api/*` request goes to Vite first, which proxies it to FastAPI on port 8080. This means **both servers must be running simultaneously**.

---

## Running the Servers (Detailed)

### Step 1 — Start the FastAPI Backend

Open **Terminal 1** in the project root:

```powershell
python -m uvicorn src.api.app:app --host 127.0.0.1 --port 8080 --reload
```

**What happens on startup:**
1. Python imports `src/api/app.py`
2. All routers are registered (auth, predictions, doctors)
3. `startup_event()` fires — loads `models/rf_model.joblib` into memory
4. `init_db()` creates the SQLite tables (`users`, `patients`, `doctors`, `predictions`) if they don't exist yet
5. Uvicorn begins accepting connections on `127.0.0.1:8080`

Expected output:
```
INFO:     Started reloader process
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8080
```

> `--reload` causes the server to auto-restart whenever you save a Python file.

---

### Step 2 — Start the React Frontend

Open **Terminal 2** inside the `ui/` folder:

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
          1. Imports _model from app global state (loaded at startup)
          2. Builds numpy array [[age, sex, cp, trestbps, ...]] shape (1, 13)
          3. _model.predict_proba(X)[0][1] → float probability (0.0–1.0)
          4. _model.predict(X)[0]          → binary prediction (0 or 1)
          5. _risk_level() → "low" / "moderate" / "high"
          6. If user authenticated → saves Prediction row to DB
          7. Returns {id, probability, prediction, risk_level}
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
| `503 Model not loaded` on predict | `rf_model.joblib` missing at startup | Verify `models/rf_model.joblib` exists; re-train if needed |
| CORS error in browser console | Frontend running on a port not in CORS allow-list | Add your port to `allow_origins` in `src/api/app.py` |
| `Email already registered` | Duplicate email on register | Use a different email address |
| `422 Unprocessable Entity` | Request body missing required fields | Check the request body matches the schema above |
