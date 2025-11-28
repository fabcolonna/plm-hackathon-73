# Backend API Documentation

## Project Structure
```
backend/
├── src/
│   ├── __init__.py
│   ├── database/
│   │   ├── __init__.py
│   │   └── repository.py
│   └── engine/
│       ├── __init__.py
│       ├── decision.py
│       └── rules.py
├── app.py
├── requirements.txt
├── .env.example
├── .env (create this)
└── README.md
```

## Setup Instructions

### 1. Create Virtual Environment
```bash
cd backend

# On Linux/Mac
python3 -m venv venv
source venv/bin/activate

# On Windows
python -m venv venv
venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Set up Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your Neo4j credentials
nano .env  # or use your preferred editor
```

Update `.env` with your actual Neo4j credentials:
```
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_DB_PASSWORD=your_actual_password
NEO4J_DB_NAME=neo4j
```

### 4. Create Directory Structure
```bash
mkdir -p src/database src/engine
touch src/__init__.py src/database/__init__.py src/engine/__init__.py
```

### 5. Copy Algorithm Files
Place the algorithm team's files:
- `decision.py` → `src/engine/decision.py`
- `rules.py` → `src/engine/rules.py`
- `repository.py` → `src/database/repository.py`

### 6. Run the Application

**Development Mode:**
```bash
python app.py
```

**Production Mode (with Gunicorn):**
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

The API will run on `http://localhost:5001` (or port 5000 if available).

---

## API Endpoints

### 1. POST /recycler/evaluate

Evaluates a battery for recycling using the decision algorithm.

**URL:** `http://localhost:5001/recycler/evaluate`

**Method:** `POST`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "id": "BAT_002",
  "market_id": "MKT_STD_2024"
}
```

**Success Response (200):**
```json
{
  "Reuse": 85.5,
  "Remanufacture": 45.2,
  "Repurpose": 30.8,
  "Recycle": 25.0
}
```

**Example:**
```bash
curl -X POST http://localhost:5001/recycler/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "id": "BAT_002",
    "market_id": "MKT_STD_2024"
  }'
```

---

### 2. POST /garagist/battery

Create a new battery record in the Neo4j database.

**URL:** `http://localhost:5001/garagist/battery`

**Method:** `POST`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "battery_id": "BATTERY_12345",
  "voltage": 12.6,
  "capacity": 75.5,
  "temperature": 25.3
}
```

**Success Response (201):**
```json
{
  "message": "Battery record created successfully",
  "battery_id": "BATTERY_12345"
}
```

**Example:**
```bash
curl -X POST http://localhost:5001/garagist/battery \
  -H "Content-Type: application/json" \
  -d '{
    "battery_id": "BATTERY_12345",
    "voltage": 12.6,
    "capacity": 75.5,
    "temperature": 25.3
  }'
```

---

### 3. GET /garagist/battery/:battery_id

Read all battery information from the Neo4j database (approximately 10 fields).

**URL:** `http://localhost:5001/garagist/battery/BATTERY_12345`

**Method:** `GET`

**Success Response (200):**
```json
{
  "battery_id": "BATTERY_12345",
  "voltage": 12.6,
  "capacity": 75.5,
  "temperature": 25.3,
  "created_at": "2024-11-27T10:30:00Z",
  "soh_percent": 85.5,
  "chemistry": "NMC",
  "battery_model": "Tesla Model S",
  "battery_status": "Good",
  "energy_throughput": 150000
}
```

**Example:**
```bash
curl http://localhost:5001/garagist/battery/BATTERY_12345
```

---

### 4. GET /proprietaire/status/:battery_id

Get the status of a battery for the owner.

**URL:** `http://localhost:5001/proprietaire/status/BATTERY_12345`

**Method:** `GET`

**Success Response (200):**
```json
{
  "battery_id": "BATTERY_12345",
  "status": "Good",
  "voltage": 12.6,
  "capacity": 75.5,
  "soh_percent": 85.5
}
```

**Example:**
```bash
curl http://localhost:5001/proprietaire/status/BATTERY_12345
```

---

### 5. GET /health

Health check endpoint.

**URL:** `http://localhost:5001/health`

**Method:** `GET`

**Success Response (200):**
```json
{
  "status": "healthy"
}
```

**Example:**
```bash
curl http://localhost:5001/health
```

---

## Error Responses

**400 - Bad Request:**
```json
{
  "error": "Battery ID is required"
}
```

**404 - Not Found:**
```json
{
  "error": "Battery not found"
}
```

**500 - Server Error:**
```json
{
  "error": "Database error: connection failed"
}
```

---

## Database Setup

### Neo4j Requirements

1. Install Neo4j (Desktop or Server)
2. Create a database (or use the default `neo4j` database)
3. Ensure Neo4j is running on `bolt://localhost:7687`
4. Update credentials in `.env` file

### Database Schema

The application expects the following Neo4j graph structure:

- **Battery** nodes with `id` property
- **BatteryPassport** nodes (connected via `HAS_PASSPORT` relationship)
- **SortingDiagnosis** nodes (connected via `UNDERWENT_DIAGNOSIS` relationship)
- **MarketConfig** nodes with `id` property
- **Decision** nodes (created by the algorithm)

---

## Algorithm Integration

The recycler endpoint uses the decision algorithm with the following flow:

1. Receive battery ID from request
2. Query Neo4j for digital twin data (12 Battery Passport attributes)
3. Run `DecisionEngine.evaluate_battery()` algorithm
4. Save decision to Neo4j
5. Return the 4 scores: Reuse, Remanufacture, Repurpose, Recycle

The algorithm evaluates batteries based on:
- State of Health (SOH)
- Battery chemistry
- Design for disassembly
- Market conditions
- And 8 other Battery Passport attributes

---

## Notes

- **Recycler endpoint**: Takes battery ID, returns 4 evaluation scores
- **Garagist POST**: Creates a battery record with 4 required fields
- **Garagist GET**: Returns approximately 10 fields of battery data
- **Proprietaire GET**: Returns battery status information
- CORS is enabled for React frontend communication
- All database operations properly open/close connections
- Environment variables are loaded from `.env` file
- The decision algorithm automatically saves results to Neo4j

---

## Troubleshooting

**Port already in use:**
If port 5000 is taken, Flask will automatically use 5001. Update your curl commands accordingly.

**Neo4j connection failed:**
- Ensure Neo4j is running
- Check credentials in `.env`
- Verify the URI (bolt://localhost:7687)

**Module not found errors:**
- Ensure all `__init__.py` files exist in src directories
- Verify virtual environment is activated
- Re-run `pip install -r requirements.txt`

**Battery not found:**
- Ensure the battery exists in Neo4j with the correct ID format
- Check that BatteryPassport and MarketConfig nodes exist
- Verify the database name in `.env` matches your Neo4j database