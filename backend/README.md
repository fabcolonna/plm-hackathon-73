# Backend API Documentation

## Endpoints

### 1. POST /recycler/evaluate

Evaluates a battery for recycling based on its ID.

**URL:** `http://localhost:5001/recycler/evaluate`

**Method:** `POST`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "id": "BATTERY_12345"
}
```

**Success Response (200):**
```json
{
  "recyclability_score": 85,
  "material_value": 120,
  "condition_rating": 70,
  "processing_priority": 3
}
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
  "health_status": "Good",
  "cycle_count": 150,
  "manufacturer": "Tesla",
  "model": "Model S",
  "last_maintenance": "2024-10-15"
}
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
  "capacity": 75.5
}
```

---

## Error Responses

**400 - Bad Request:**
```json
{
  "error": "Required field missing"
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
  "error": "error message"
}
```

---

## Example Usage

```bash
# Recycler - Evaluate battery
curl -X POST http://localhost:5001/recycler/evaluate \
  -H "Content-Type: application/json" \
  -d '{"id": "BATTERY_12345"}'

# Garagist - Create battery record
curl -X POST http://localhost:5001/garagist/battery \
  -H "Content-Type: application/json" \
  -d '{
    "battery_id": "BATTERY_12345",
    "voltage": 12.6,
    "capacity": 75.5,
    "temperature": 25.3
  }'

# Garagist - Get all battery data
curl http://localhost:5001/garagist/battery/BATTERY_12345

# Proprietaire - Get battery status
curl http://localhost:5001/proprietaire/status/BATTERY_12345
```

---

## Database Setup

Make sure Neo4j is running and update the connection details in `db_operations.py`:
- URI: `bolt://localhost:7687`
- Username: `neo4j`
- Password: (your Neo4j password)

---

## Notes

- **Recycler endpoint**: Takes only a battery ID and returns 4 evaluation metrics
- **Garagist POST**: Creates a battery record with 4 required fields
- **Garagist GET**: Returns approximately 10 fields of battery data
- **Proprietaire GET**: Returns battery status information
- All database operations are in `db_operations.py`
- Evaluation logic is in `evaluator.py`