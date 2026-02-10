# Backend Server Documentation

## 1. Setup & Execution

### Environment Setup
```bash
# From {root}/server
python -m venv venv

# Activate Virtual Environment
# Windows: venv/Scripts/Activate
# Linux/Mac: source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt
```

### Running the Server
```bash
# Recommended Command (Development)
uvicorn server2:app --reload --reload-exclude "db"

# Production Command
uvicorn server:app --host 0.0.0.0 --port 8000 --workers 2 --http httptools
```

---

## 2. Mass Data Insertion

To populate the database with initial data (e.g., for testing), use the `populate_db.py` script located in the `scripts/` directory.

```bash
# Run from backend/server/ directory
python scripts/populate_db.py
```
This script creates a 'medicine' domain and inserts several sample nodes.

---

## 3. API Endpoints

### Health Check
- **GET** `/health`
- **Returns**: `{"status": "ok"}`

### Collections (Domains)

#### List Collections
- **GET** `/collections/list`

#### Create Collection
- **POST** `/collections/create`
- **Body**: `{"name": "string"}`

#### Delete Collection
- **POST** `/collections/delete`
- **Body**: `{"name": "string"}`

#### Rename Collection
- **POST** `/collections/rename`
- **Body**: `{"d_old": "string", "d_new": "string"}`

### Nodes

#### List Nodes in Collection
- **POST** `/nodes/list`
- **Body**: `{"name": "collection_name"}`

#### Insert Node
- **POST** `/nodes/insert`
- **Body**:
  ```json
  {
    "collection": "string",
    "name": "string",
    "content": "string",
    "user_links": ["string"],
    "distance_threshold": 1.4,
    "max_links": 5
  }
  ```

#### Update Node
- **POST** `/nodes/update`
- **Body**:
  ```json
  {
    "collection": "string",
    "node_id": "string",
    "name": "string",
    "content": "string",
    "user_links": ["string"],
    "distance_threshold": 1.4,
    "max_links": 5
  }
  ```

#### Delete Node
- **POST** `/nodes/delete`
- **Body**:
  ```json
  {
    "collection": "string",
    "node_id": "string"
  }
  ```

#### Refactor Semantic Links
- **POST** `/nodes/refactor`
- **Body**:
  ```json
  {
    "collection": "string",
    "distance_threshold": 1.4,
    "max_links": 5
  }
  ```

### AI & Chat History

#### Stream Query (LLM)
- **POST** `/query/stream`
- **Body**:
  ```json
  {
    "collection": "string",
    "query": "string",
    "conversation_id": "string",
    "max_results": 10,
    "distance_threshold": 1.4
  }
  ```

#### Summarize History
- **POST** `/history/summarize`
- **Body**:
  ```json
  {
    "session_id": "string",
    "query": "optional_focus_topic",
    "collection": "target_collection",
    "max_results": 10,
    "distance_threshold": 1.4
  }
  ```

#### Clear History
- **POST** `/history/clear`
- **Body**: `{"conversation_id": "string"}`

---

## 4. Example Usage (PowerShell)

### Create a Domain
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/collections/create" `
  -Method POST `
  -Headers @{ "X-API-Key" = "mysecretkey"; "Content-Type" = "application/json" } `
  -Body '{"name": "test56"}'
```

### Add Node
```powershell
$body = @{
    name = "Node Name"
    content = "This is the content of the test node."
    collection = "test56"
    max_links = 5
    distance_threshold = 0.7
    user_links = @("link1", "link2")
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/nodes/insert" `
    -Method POST `
    -Headers @{
        "X-API-Key" = "mysecretkey"
        "Content-Type" = "application/json"
    } `
    -Body $body
```

## 5. Example Usage (Curl)

### Test LLM Stream
```bash
curl -N http://127.0.0.1:8000/query/stream \
  -H "X-API-Key: mysecretkey" \
  -H "Content-Type: application/json" \
  -d '{
        "collection": "Anshul",
        "query": "hello world",
        "conversation_id": "abc123",
        "max_results": 5,
        "distance_threshold": 1.0
      }'
```