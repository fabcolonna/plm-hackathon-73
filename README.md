# Battery Passport Control Tower ~ PLM Hackathon Group 72 @ ESILV

End-to-end prototype that synchronizes battery passport data between garages, recyclers, and owners. The stack couples a Neo4j-backed Flask API with a role-aware React/Vite frontend, all focused on Problem 7 of the PLM Hackathon.

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
│ React/Vite │ <──────────────> │   Flask API  │ <──────────────────────>│  Neo4j DB  │
│ Frontend   │  REST + Web QR   │   (app.py)   │   Digital twin queries  │            │
└────────────┘                  └──────────────┘                         └────────────┘
			│                                │                                       │
			│ Role routing & auth context    │ DecisionEngine + BusinessRules        │
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
source venv/bin/activate         # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # then fill in your Neo4j credentials
python3 app.py                   # runs on http://localhost:5001
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
```

The frontend expects the API to be reachable at `VITE_API_BASE_URL`. During local dev, launch the backend first or change the env var to match.

## Local Development Workflow

1. **Start Neo4j** locally (Desktop app or Docker) and import `db/batterypass.dump` if you need demo data.
2. **Run the backend** (`python app.py`) with `.env` configured.
3. **Run the frontend** (`npm run dev`) and ensure `VITE_API_BASE_URL` points to the Flask port.
4. Use the Home page to sign in as a role (garage/recycler) and exercise each workspace.

- **Port conflicts**: If port 5000 is occupied, Flask falls back to 5001—update `VITE_API_BASE_URL` to match.
- **Neo4j authentication errors**: Verify `.env` credentials and that the database name exists.
- **`Battery not found`** responses: Confirm the battery ID exists in Neo4j and that passport relationships are in place.
- **QR scanner not working**: Barcode detection requires HTTPS or `localhost` plus a Chromium-based browser. Provide manual ID entry as a fallback.
- **CORS issues**: Ensure the backend stays on the configured origin and that no proxies strip the `Origin` header.
