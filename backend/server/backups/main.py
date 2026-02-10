# python/main.py

from fastapi import FastAPI, Depends, Request, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import chromadb
import uvicorn
from sentence_transformers import SentenceTransformer


# -- sentence - transformers  model

model = SentenceTransformer('all-MiniLM-L6-v2')


# --- FastAPI app ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

API_KEY = "mysecretkey"

# --- Dependency ---
def verify_api_key(request: Request):
    key = request.headers.get("X-API-Key")
    if key != API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid API Key")

# --- Pydantic Models ---
class NodeInput(BaseModel):
    collection: str
    id: str
    content: str
    user_links: list[str]
    links: list[str]

class DeleteNodeInput(BaseModel):
    collection: str
    id: str

class SearchInput(BaseModel):
    collection: str
    query: str

class CollectionNameInput(BaseModel):
    name: str

class UpdateLinksInput(BaseModel):
    collection: str
    id: str
    user_links: list[str]
    links: list[str]

# --- ChromaDB Client ---
client = chromadb.PersistentClient(path="db")

def dummy_embedding  (text: str, dim: int = 10) -> list[float]:
    embeddings = model.encode(text, convert_to_numpy=True)
    # print(type(embeddings))       
    # print(type(embeddings[0]))
    # print(len(embeddings[0]))
    return embeddings

def get_or_create_collection(name: str):
    return client.get_or_create_collection(name=name)

# --- CRUD Functions ---
def list_all_collections():
    return client.list_collections()

def delete_collection_by_name(name: str):
    client.delete_collection(name=name)

def add_node_to_collection(collection_name: str, doc_id: str, content: str, embedding: list[float], user_links: list[str], links: list[str]):
    collection = get_or_create_collection(collection_name)
    metadata = {
        "user_link": json.dumps(user_links),
        "link": json.dumps(links)
    }
    collection.add(
        documents=[content],
        ids=[doc_id],
        embeddings=[embedding],
        metadatas=[metadata]
    )

def get_all_nodes_with_metadata(collection_name: str):
    collection = get_or_create_collection(collection_name)
    count = collection.count()
    if count == 0:
        return {"ids": [], "documents": [], "metadatas": []}
    return collection.get(limit=count, include=["documents", "metadatas"])

def delete_node_from_collection(collection_name: str, doc_id: str):
    collection = get_or_create_collection(collection_name)
    collection.delete(ids=[doc_id])

def update_node_links(collection_name: str, doc_id: str, user_links: list[str], links: list[str]):
    collection = get_or_create_collection(collection_name)
    result = collection.get(ids=[doc_id], include=["documents", "embeddings"])
    if not result["ids"]:
        raise ValueError(f"Document '{doc_id}' not found")
    document = result["documents"][0]
    embedding = result["embeddings"][0]
    metadata = {
        "user_link": json.dumps(user_links),
        "link": json.dumps(links)
    }
    collection.delete(ids=[doc_id])
    collection.add(
        documents=[document],
        ids=[doc_id],
        embeddings=[embedding],
        metadatas=[metadata]
    )

def search_nodes_in_collection(collection_name: str, embedding: list, n_results: int = 5):
    collection = get_or_create_collection(collection_name)
    return collection.query(query_embeddings=[embedding], n_results=n_results)

# --- API Endpoints ---
@app.get("/collections", dependencies=[Depends(verify_api_key)])
def get_collections():
    collections = list_all_collections()
    return JSONResponse(content=[{"name": c.name, "id": str(c.id)} for c in collections])

@app.post("/collections/delete", dependencies=[Depends(verify_api_key)])
def delete_collection(payload: CollectionNameInput):
    delete_collection_by_name(payload.name)
    return {"status": "collection deleted successfully"}

@app.get("/nodes", dependencies=[Depends(verify_api_key)])
def list_nodes(collection: str = Query(...)):
    try:
        results = get_all_nodes_with_metadata(collection)
        documents = results.get("documents") or []
        ids = results.get("ids") or []
        metadatas = results.get("metadatas") or []

        formatted = []
        for _id, doc, meta in zip(ids, documents, metadatas):
            try:
                user_links = json.loads(meta.get("user_link", "[]"))
                links = json.loads(meta.get("link", "[]"))
            except Exception:
                user_links = []
                links = []
            formatted.append({
                "id": _id,
                "content": doc,
                "user_links": user_links,
                "links": links
            })
        return JSONResponse(content=formatted)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list nodes: {e}")

@app.post("/nodes/add")
def add_node(payload: NodeInput):
    embedding = dummy_embedding(payload.content)
    add_node_to_collection(payload.collection, payload.id, payload.content, embedding, payload.user_links, payload.links)
    return {"status": "success", "message": "Node added successfully."}

@app.post("/nodes/delete", dependencies=[Depends(verify_api_key)])
def delete_node(payload: DeleteNodeInput):
    delete_node_from_collection(payload.collection, payload.id)
    return {"status": "node deleted successfully"}

@app.post("/nodes/update-links", dependencies=[Depends(verify_api_key)])
def update_links(payload: UpdateLinksInput):
    update_node_links(payload.collection, payload.id, payload.user_links, payload.links)
    return {"status": "node links updated"}

@app.post("/search", dependencies=[Depends(verify_api_key)])
def search_node(payload: SearchInput):
    embedding = dummy_embedding(payload.query)
    results = search_nodes_in_collection(payload.collection, embedding)
    ids = results.get("ids", [[]])[0]
    documents = results.get("documents", [[]])[0]
    distances = results.get("distances", [[]])[0]

    return JSONResponse(content=[
        {"id": _id, "content": doc, "distance": dist}
        for _id, doc, dist in zip(ids, documents, distances)
    ])

# --- Uvicorn Launch ---
if __name__ == "__main__":
    try:
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except Exception as e:
        print(f"Exception during startup: {str(e)}\n")
        with open("error.log", "w") as f:
            f.write(f"Exception during startup: {str(e)}\n")
