# Backend API Documentation

## Endpoint

### POST /evaluate

Evaluates 10 arguments and returns a string result.

**URL:** `http://localhost:5001/evaluate`

**Method:** `POST`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "arg1": "value1",
  "arg2": "value2",
  "arg3": "value3",
  "arg4": "value4",
  "arg5": "value5",
  "arg6": "value6",
  "arg7": "value7",
  "arg8": "value8",
  "arg9": "value9",
  "arg10": "value10"
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "result": {
    "metric1": 42,
    "metric2": 100,
    "metric3": 75,
    "metric4": 88
  }
}
```

**Error Response (400) - Missing Arguments:**
```json
{
  "error": "All 10 arguments (arg1-arg10) are required"
}
```

**Error Response (500) - Server Error:**
```json
{
  "error": "error message"
}
```

## Example Usage

```bash
curl -X POST http://localhost:5001/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "arg1": "test1",
    "arg2": "test2",
    "arg3": "test3",
    "arg4": "test4",
    "arg5": "test5",
    "arg6": "test6",
    "arg7": "test7",
    "arg8": "test8",
    "arg9": "test9",
    "arg10": "test10"
  }'
```

## Notes

- All 10 arguments are **required**
- The result contains exactly **4 string-integer pairs**
- Keys are strings, values are integers
- The evaluation logic is implemented in `evaluator.py`