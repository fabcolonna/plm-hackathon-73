# Battery Passport Control Tower (PLM Hackathon 73)

End-to-end prototype that synchronizes battery passport data between garages, recyclers, and owners. The stack couples a Neo4j-backed Flask API with a role-aware React/Vite frontend, all focused on Problem 7 of the PLM Hackathon.

## Table of Contents

- [Battery Passport Control Tower (PLM Hackathon 73)](#battery-passport-control-tower-plm-hackathon-73)
  - [Table of Contents](#table-of-contents)
  - [Solution Overview](#solution-overview)
  - [Architecture](#architecture)
  - [Technology Stack](#technology-stack)
  - [Backend API (Flask + Neo4j)](#backend-api-flask--neo4j)
    - [Environment variables](#environment-variables)
    - [Setup \& run](#setup--run)
    - [API surface](#api-surface)
  - [Decision Engine Highlights](#decision-engine-highlights)
  - [Data Layer \& Neo4j](#data-layer--neo4j)
  - [Frontend (React + Vite)](#frontend-react--vite)
    - [Key capabilities](#key-capabilities)
    - [Environment variables](#environment-variables-1)
    - [Setup \& run](#setup--run-1)
  - [Local Development Workflow](#local-development-workflow)
  - [Testing \& Quality Notes](#testing--quality-notes)
  - [Deployment Tips](#deployment-tips)
  - [Troubleshooting](#troubleshooting)

## Solution Overview

- **Single source of truth**: Neo4j stores every battery, passport, diagnosis, market config, and decision node so all personas read the same data.
- **Two core personas**:
	- *Garagist (mechanic)* pushes fresh measurements, flags safety statuses, and queues owner notifications.
	- *Recycler* runs the decision engine to receive weighted scores for reuse/remanufacture/repurpose/recycle paths.
- **Open passport mode**: Owners (or anyone with a QR/ID) can inspect the live status without authentication.
- **Decision transparency**: A Python engine translates 12+ passport attributes into an auditable scorecard.

## Architecture

```
┌────────────┐      HTTPS       ┌──────────────┐       Bolt Driver       ┌────────────┐
│ React/Vite │ <──────────────> │ Flask API    │ <──────────────────────>│  Neo4j DB   │
│ Frontend   │  REST + Web QR  │ (app.py)     │  Digital twin queries   │ Battery TWN │
└────────────┘                  └──────────────┘                         └────────────┘
			│                                │                                       │
			│ Role routing & auth context    │ DecisionEngine + BusinessRules         │
			└────────────────────────────────┴───────────────────────────────────────┘
```

- **frontend/** exposes the portal for all personas (public status view + authenticated workspaces) and provides QR scanning powered by the browser `BarcodeDetector` API.
- **backend/** contains Flask endpoints (`app.py`), the decision engine (`src/engine`), and the Neo4j repository layer (`src/database`).
- **db/** archives BatteryPass dumps that can be imported into a local Neo4j instance for demo data.

## Technology Stack

- **Backend**: Python 3.11+, Flask 3, Gunicorn (optional), Neo4j Python Driver, NumPy, python-dotenv.
- **Database**: Neo4j 5.x, using nodes for `Battery`, `BatteryPassport`, `SortingDiagnosis`, `MarketConfig`, and `Decision`.
- **Frontend**: React 19, React Router 7, Vite 7, TailwindCSS 3, TypeScript 5.9.
- **Tooling**: ESLint 9, localStorage-based auth stubs, QR scanning via modern browser APIs.

## Backend API (Flask + Neo4j)

**Location**: `backend/`

### Environment variables

| Name                | Example                 | Description                                   |
| ------------------- | ----------------------- | --------------------------------------------- |
| `NEO4J_URI`         | `bolt://localhost:7687` | Bolt URI of the Neo4j instance.               |
| `NEO4J_USER`        | `neo4j`                 | Database username.                            |
| `NEO4J_DB_PASSWORD` | `s3cret`                | Database password.                            |
| `NEO4J_DB_NAME`     | `neo4j`                 | Optional database name (defaults to `neo4j`). |

Create a `.env` file from `.env.example` before running the API.

### Setup & run

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then fill in your Neo4j credentials
python app.py                   # runs on http://localhost:5001

# Production-style launch
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

Flask automatically enables CORS, so the Vite dev server can call the API without extra proxying.

### API surface

| Endpoint                   | Method  | Role          | Purpose                                                                                             |
| -------------------------- | ------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `/recycler/evaluate`       | `POST`  | Recycler      | Fetch digital twin (battery + passport + market), run decision engine, and persist `Decision` node. |
| `/garagist/battery`        | `POST`  | Garagist      | Upsert a battery’s live telemetry (voltage, capacity, temperature).                                 |
| `/garagist/battery/:id`    | `GET`   | Garagist      | Return ~10 passport + telemetry fields.                                                             |
| `/garagist/battery/:id`    | `PATCH` | Garagist      | Update any subset of voltage/capacity/temperature.                                                  |
| `/proprietaire/status/:id` | `GET`   | Owner         | Owner-facing digest (status, voltage, capacity, SOH).                                               |
| `/battery/status/:id`      | `PUT`   | Owner/Recyler | Overwrite `BatteryPassport.battery_status`.                                                         |
| `/health`                  | `GET`   | Ops           | Basic service heartbeat.                                                                            |

Responses follow the structure documented in `backend/README.md` and return descriptive error payloads (`{ "error": "Battery not found" }`).

## Decision Engine Highlights

- Encoded in `backend/src/engine/decision.py` with centralized thresholds in `src/engine/rules.py`.
- Implements a **kill-switch** for critical defects or abuse history before any scoring occurs.
- Builds an **11-criteria weighting matrix** (SOH, SOC, chemistry, age, throughput, fade, design for disassembly, manufacturer intent, model, status, internal resistance).
- Applies **market weights** (from `MarketConfig` nodes) so regional policy can skew decisions.
- Returns both the top recommendation and the raw scores, then persists them as a `Decision` node tied to the latest `SortingDiagnosis`.

## Data Layer & Neo4j

- Repository lives in `backend/src/database/repository.py` using the official Neo4j driver.
- `db/` includes sample `batterypass.dump` archives to seed local databases (see `database/NEO4J_SCHEMA.md` for more context).
- Key relationships:
	- `(Battery)-[:HAS_PASSPORT]->(BatteryPassport)`
	- `(Battery)-[:UNDERWENT_DIAGNOSIS]->(SortingDiagnosis)` (ordered by `date`)
	- `(Decision)-[:CONTEXTUALIZED_BY]->(MarketConfig)` and optionally `SortingDiagnosis-[:GENERATED_DECISION]->(Decision)`
- The repository exposes helpers to fetch digital twins, upsert telemetry, update statuses, and persist decision results while ensuring sessions close cleanly.

## Frontend (React + Vite)

**Location**: `frontend/`

### Key capabilities

- **Role-aware navigation**: `AuthProvider` stores the selected role in `localStorage`; `ProtectedRoute` guards recycler/garagist workspaces.
- **QR-powered lookups**: `useQrScanner` + `QrScannerOverlay` leverage the `BarcodeDetector` API for scanning IDs.
- **Workspaces**:
	- `BatteryInfo` (garagist) mirrors the `/garagist` API response, supports in-place edits of voltage/capacity/temperature, and queues owner status updates via pending requests stored client-side.
	- `BatteryRecommendations` (recycler) triggers the `/recycler/evaluate` endpoint, visualizes the four-path scorecard, and highlights confidence separation.
	- `BatteryStatus` (public/owner) fetches `/proprietaire/status/:id`, applies themed tiles per lifecycle state, and lets owners approve pending status changes.

### Environment variables

Frontend clients need a single variable to point to the Flask API:

```
VITE_API_BASE_URL=http://localhost:5001
```

Create a `.env.local` (ignored by Git) inside `frontend/` to override the default.

### Setup & run

```bash
cd frontend
npm install              # or pnpm/yarn
npm run dev              # http://localhost:5173 by default

npm run lint             # ESLint powered by the Vite React template
npm run build            # Type-check + production bundle
npm run preview          # Serves the build output
```

The frontend expects the API to be reachable at `VITE_API_BASE_URL`. During local dev, launch the backend first or change the env var to match.

## Local Development Workflow

1. **Start Neo4j** locally (Desktop app or Docker) and import `db/batterypass.dump` if you need demo data.
2. **Run the backend** (`python app.py`) with `.env` configured.
3. **Run the frontend** (`npm run dev`) and ensure `VITE_API_BASE_URL` points to the Flask port.
4. Use the Home page to sign in as a role (garage/recycler) and exercise each workspace.

Recommended IDE add-ons: Python linting/formatting, Neo4j Browser/Desk for inspecting graph results, and React DevTools for UI debugging.

## Testing & Quality Notes

- Automated tests are not yet defined. Focus on manual verification:
	- Backend: exercise each endpoint with `curl`/Postman; ensure Neo4j nodes and relationships are created as expected.
	- Frontend: run through each persona workflow in multiple browsers (Chrome/Edge for QR scanning support).
- Consider adding pytest + React Testing Library suites in future iterations.

## Deployment Tips

- **Backend**: Containerize with Gunicorn + environment variables, or deploy to services like Render/Fly.io. Ensure the Neo4j instance is reachable and secured (TLS, strong passwords).
- **Frontend**: `npm run build` creates a static bundle suitable for Vercel, Netlify, or any static host. Set `VITE_API_BASE_URL` in the hosting provider’s env settings.
- **Neo4j**: For production, run AuraDB or a managed Neo4j server with proper networking and user roles.

## Troubleshooting

- **Port conflicts**: If port 5000 is occupied, Flask falls back to 5001—update `VITE_API_BASE_URL` to match.
- **Neo4j authentication errors**: Verify `.env` credentials and that the database name exists.
- **`Battery not found`** responses: Confirm the battery ID exists in Neo4j and that passport relationships are in place.
- **QR scanner not working**: Barcode detection requires HTTPS or `localhost` plus a Chromium-based browser. Provide manual ID entry as a fallback.
- **CORS issues**: Ensure the backend stays on the configured origin and that no proxies strip the `Origin` header.