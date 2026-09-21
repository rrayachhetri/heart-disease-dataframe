# CardioSense — Web UI

React + TypeScript single-page app for CardioSense: heart-disease risk prediction, dashboards, and the doctor/patient booking flow. This README covers everything needed to run the **whole stack** (backend + database + trained model + this UI) locally, plus how to test it end to end.

> Looking for the backend/API/ML documentation? See the [repository root README](../README.md).

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 18 (function components + hooks) |
| Build tool | Vite 5 |
| Language | TypeScript |
| State | Redux Toolkit + RTK Query (caching, mutations, auto-refetch) |
| HTTP client | axios (single shared instance in `src/sideeffects/api/api.ts`) |
| Routing | React Router v6 |
| Styling | LESS Modules (`*.module.less`) + shared tokens in `src/styles/variables.less` |
| Charts | Recharts |
| Notifications | Inline button/form state (checkmark on success, error text on failure) + a custom in-app Notification Center (persistent bell-icon feed) |
| Icons | lucide-react |
| Unit/component tests | Vitest + Testing Library |
| End-to-end tests | Playwright |

---

## 1. Prerequisites

You need **both** the backend and the frontend running for the app to be fully functional (predictions, auth, doctor search, and booking all call the FastAPI backend — there is currently no mock/offline mode, see [Mock/offline mode](#mockoffline-mode) below).

- Node.js 18+ and npm
- Python 3.10+ with the project virtual environment set up (see root README §Quick Start)
- The backend API running on `http://127.0.0.1:8080` (Vite proxies `/api` and `/health` to this address — see `vite.config.ts`)

### 1a. Start the backend (from the repository root, not `ui/`)

```powershell
cd c:\heart-disease-dataframe\heart-disease
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env    # first time only — set SECRET_KEY at minimum
```

**Database — tables & migrations.** On a fresh checkout you have two options:

- **Fast path (default dev behavior):** just start the API — tables are created automatically via `AUTO_CREATE_TABLES` on first startup, no Alembic step required.
- **Explicit migrations (recommended if you plan to make schema changes, or if `AUTO_CREATE_TABLES` is disabled):**

  ```powershell
  # Run from the repo root — alembic.ini lives here and expects to be invoked from this cwd
  python -m alembic upgrade head
  ```

  If you ever see `No 'script_location' key found` or similar, you're running Alembic from the wrong directory (e.g. from inside `.venv\Scripts`) — `cd` back to the repo root first.

  If tables already exist from the `AUTO_CREATE_TABLES` path and Alembic has no version history yet, stamp the baseline instead of re-creating tables:

  ```powershell
  python -m alembic stamp 0001_initial
  python -m alembic upgrade head
  ```

**Train the ML model** (required — the API loads this at startup and `/api/predictions/model-info` / the Dashboard will error without it):

```powershell
python -m src.models.train
```

This downloads/merges the 4 UCI cohorts, trains the ensemble model, and writes artifacts to `.data/models/`. It only needs to be re-run when you want to retrain; the trained artifact persists across backend restarts.

**Start the API:**

```powershell
python -m uvicorn src.api.app:app --host 127.0.0.1 --port 8080 --reload
```

**Verify the backend is actually healthy before touching the UI:**

```powershell
Invoke-RestMethod http://127.0.0.1:8080/api/health
# Expect: { "status": "ok", "model_loaded": true }
```

If `model_loaded` is `false`, the training step above hasn't produced a usable artifact yet — predictions, the Dashboard, and Model Insights pages will fail until it's `true`. If this request fails entirely (connection refused), the UI will show a global **"System temporarily unavailable"** banner and auto-retry — that's expected behavior (see [Troubleshooting](#troubleshooting)), not a UI bug.

### 1b. Start the UI

```powershell
cd ui
npm install
npm run dev
```

Open **http://localhost:3000**. You'll be redirected to `/register` — create a `patient` or `doctor` account to explore the app (no seed/demo accounts ship with the repo).

---

## 2. Available scripts (run inside `ui/`)

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server on port 3000 (proxies `/api` → `127.0.0.1:8080`) |
| `npm run build` | Type-check (`tsc`) + production build |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run the Vitest unit/component suite once, with a summary reporter |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:coverage` | Run Vitest with a coverage report (see `ui/coverage/index.html`) |
| `npx playwright test` | Run the end-to-end suite (see below) |
| `npx tsc --noEmit` | Type-check only, no build output |

---

## 3. Testing

### 3a. Unit / component tests (Vitest)

```powershell
cd ui
npm run test
```

These are self-contained (no backend required) and mock RTK Query hooks / axios at the module level. Test files live next to their subject in `test/` folders, e.g. `src/pages/Doctors/test/`.

### 3b. End-to-end tests (Playwright)

The E2E suite (`ui/e2e/doctor-booking.spec.ts`) drives a **real browser against the real backend** — it does not use mocks. It's the most reliable way to confirm the whole stack (DB + model + API + UI) actually works together, because it exercises the exact same HTTP calls a real user's browser makes.

**One-time setup:**

```powershell
cd ui
npx playwright install chromium
```

**Before running:** both the backend (`127.0.0.1:8080`) and the frontend (`localhost:3000`, via `npm run dev`) must already be running — Playwright does not start them for you.

```powershell
npx playwright test
```

What it covers, end to end:
1. Register a doctor account → set NPI/specialty/accepted-insurance on the profile page → publish an appointment slot (`datetime-local` inputs) → confirm it renders with the correct local time.
2. Register a patient account → search `/doctors` by insurance + specialty → confirm the "Verified in network" badge appears on the matching doctor's card → open the booking modal → book the published slot → confirm the "Appointment confirmed" success state.

If a test fails, check `ui/test-results/<test-name>/test-failed-1.png` and `error-context.md` for a screenshot and DOM snapshot at the point of failure, and `trace.zip` for a full replay (`npx playwright show-trace <path-to-trace.zip>`). `ui/test-results/` and `ui/playwright-report/` are gitignored — safe to delete freely.

> **Test data note:** the suite runs against your real local SQLite dev database and doesn't clean up after itself. Doctor/patient accounts it creates use a timestamp-suffixed name/email per run so repeated runs don't collide with each other in list-based assertions.

### 3c. Backend tests

Backend (pytest) tests live outside `ui/`, at the repo root — see the root README's Testing section. Run them whenever you touch API/DB code, since the UI's RTK Query layer and the Playwright suite both depend on the API contract they verify.

### Mock/offline mode

There is currently **no** mock server (e.g. MSW) wired into the UI — every environment (dev, Vitest, Playwright) that needs real data talks to the real FastAPI backend, and Vitest unit tests mock at the RTK Query/axios call-site level instead. This was a deliberate simplicity trade-off: the Playwright suite already proves the full real flow works, which is a stronger guarantee than a hand-maintained mock layer. If you want a frontend-only "offline demo" mode (no backend required) for design/UX iteration, that would be a separate addition — ask and it can be scaffolded with MSW.

---

## 4. Manually verifying the app end to end

A quick manual pass to sanity-check a fresh environment, in order:

1. **Register** a `doctor` account at `/register` → should land on `/` (Dashboard) immediately (auto-login after registration).
2. **Doctor Profile** (`/doctor/profile`): fill NPI number, specialty, accepted insurance (comma-separated) → **Save profile** → the button briefly changes to "✓ Saved".
3. **Publish an appointment slot**: pick a Start/End date & time using the calendar picker → **Publish time** → the new slot should appear in the list below, showing the time you entered in your local timezone (not shifted), and the button briefly shows "✓ Published".
4. **Sign out**, then **register** a `patient` account.
5. **Find Doctors** (`/doctors`): search by the same insurance plan + specialty → the doctor card should show a green **"Verified in network: \<plan\>"** line.
6. Click **View appointments** → the modal should list the published slot as a button labeled with its local date/time → click it → look for the **"Appointment confirmed for …"** message inline in the modal.
7. Check the notification bell (top-right avatar menu) — it's a persistent feed, separate from the inline button/form feedback used elsewhere; both should be visually consistent (rounded cards, consistent color tokens from `src/styles/variables.less`).
8. Run a **New Prediction** and confirm the Result page renders the risk gauge, top factors, and population-percentile comparison — this exercises the ML model path end to end.

If every step above works, the full stack (DB, model, API, UI) is healthy.

---

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Full-page **"System temporarily unavailable"** banner | Backend unreachable, or a request returned 5xx | Confirm `Invoke-RestMethod http://127.0.0.1:8080/api/health` succeeds; restart the backend if not |
| `model_loaded: false` in `/api/health` | Model hasn't been trained yet | Run `python -m src.models.train` from the repo root |
| Alembic `No 'script_location' key found` | Alembic invoked from the wrong working directory | Run `python -m alembic ...` from the repo root, where `alembic.ini` lives |
| Alembic `table users already exists` | Tables were created by `AUTO_CREATE_TABLES` before Alembic ran | `python -m alembic stamp 0001_initial` then `python -m alembic upgrade head` |
| Playwright "Project(s) chromium not found" | `--project=chromium` flag used, but `playwright.config.ts` doesn't define named projects | Run `npx playwright test` without `--project` |
| Playwright strict-mode "resolved to N elements" | A locator matched more than one element (common when repeated E2E runs accumulate test data in the dev DB) | Scope the locator (e.g. `page.getByRole('dialog').getByText(...)`) instead of searching the whole page |
| CORS errors in the browser console | Hitting the backend directly on port 8080 from the UI instead of going through the Vite proxy on port 3000 | Always use `http://localhost:3000` in the browser during development, not `127.0.0.1:8080` |

---

## 6. Project structure (`ui/src`)

```
src/
├── App.tsx                 # Routes, ProtectedRoute wiring
├── main.tsx                 # React root, global styles import
├── pages/                   # One folder per route (Dashboard, Predict, Result, History,
│                            #   Auth, DoctorProfile, Doctors, ModelInsights, SessionTimeout...)
├── components/              # Reusable UI: Layout/Sidebar/Header, Dashboard cards,
│                            #   Form fields, Notification center
├── sideeffects/
│   ├── api/                 # axios instance (api.ts), RTK Query endpoints, error helpers
│   └── slices/              # RTK Query-adjacent slices that cache API responses
├── store/                   # Redux store + local-state-only slices (session, system, notification)
├── styles/                  # variables.less (design tokens), global.less (resets)
├── content/                 # Copy/text constants (per-page strings)
└── types/                   # Shared TypeScript types
```

---

## 7. Design conventions

- All page/component styling uses LESS Modules (`*.module.less`) importing shared tokens from `src/styles/variables.less` (spacing scale `@space-*`, radii `@radius-*`, shadows, colors) — don't hardcode raw pixel/hex values in new components.
- Feedback for user actions (form saves, booking confirmations) is inline and contextual: buttons show a transient "✓ Saved"/"Failed" state (see `DoctorProfile/index.tsx`), and forms/modals show their own success or error text directly where the action happened, instead of a separate floating toast. Use the existing Notification Center (`notificationSlice`) for longer-lived, dismissible items the user should be able to revisit.
- Modals (e.g. the booking dialog in `Doctors/index.tsx`) follow a consistent pattern: a fixed, semi-transparent backdrop (`.modalBackdrop`) + a centered card (`role="dialog"`, `aria-modal="true"`) with a header (title + close button) and a bordered content area.
