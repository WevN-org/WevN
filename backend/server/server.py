# python/main.py

from contextlib import asynccontextmanager
import os
from fastapi import FastAPI, Depends, Request, HTTPException, Query, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import chromadb
from sentence_transformers import SentenceTransformer
import numpy as np
import uuid
from typing import List,Optional
import asyncio

# -- sentence - transformers  model

model = None


@asynccontextmanager
async def lifespan(app : FastAPI):
    global model
    if model is None:
        local_path = "../__models__/embedding-model/models--sentence-transformers--all-mpnet-base-v2/snapshots/e8c3b32edf5434bc2275fc9bab85f82640a19130"
        if os.path.exists(local_path):
            print("✅ Loading model from local cache...")
            model = await asyncio.to_thread(
                lambda: SentenceTransformer(local_path)
            )
        else:
            print("🌐 Downloading model from Hugging Face...")
            model = await asyncio.to_thread(
                lambda: SentenceTransformer(
                    "all-mpnet-base-v2",
                    cache_folder="../__models__/embedding-model"
                )
            )
            print("Model loaded!")
    yield  # ⚠️ THIS is required! App runs after this
    print("Server shutting down")

# -- websocket  clients
clients = []





# --- FastAPI app ---
app = FastAPI(lifespan=lifespan)

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
# -- token validate function --

def validate_token(token: str) -> bool:
    return token == 'api-token'
    







# -- permenent ws connection -- 
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str = Query(...)):
    if not validate_token(token):
        await ws.close(code=1008)  # Policy violation
        return
    await ws.accept()
    clients.append(ws)
    # await load_model()
    try:
        while True:
            await ws.receive_text()  # keep connection alive
    except WebSocketDisconnect:
        clients.remove(ws)

# -- notification sender
async def notify_clients(change_type):
    message = json.dumps({"type": change_type})
    for ws in clients:
        await ws.send_text(message)
    

# -- Pydantic Models -- this is the structure for each http request start with a Model suffix for each class


# -- output models --
class StatusModel(BaseModel):
    status: str

# for a single node in list node
class NodeOut(BaseModel):
    node_id : str
    name : str
    content : str
    user_links : Optional[List[str]]
    s_links : Optional[List[str]]
    


# -- input models --

# For creating and Deleting Collections
class CollectionNameModel(BaseModel):
    name: str


# for renaming a collection
class CollectionRenameModel(BaseModel):
    d_old: str
    d_new: str

# For creating or updating a node
class NodeInputModel(BaseModel):
    collection: str
    name: str
    content: str
    user_links: list[str]
    distance_threshold: float
    max_links: int


class NodeUpdateModel(BaseModel):
    collection: str
    node_id: str
    name: str
    content: str
    user_links: list[str]
    distance_threshold: float
    max_links: int

class NodeDeleteModel(BaseModel):
    collection: str
    node_id: str



# -- ChromaDB client -- 
client = chromadb.PersistentClient(path="db")



# -- Helper Functions --(boring stuff)

# -- cosine similarity listing for creating semantic linking
def distance_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# -- embedding --
async def model_embedding(text: str) -> list[float]:
    return await asyncio.to_thread(lambda: model.encode(text))





# -- fastapi endpoints -- 

# -- server GET requests --

# -- helth inquiry
@app.get("/health", dependencies=[Depends(verify_api_key)])
def health():
    return StatusModel(status='ok')


# -- list all collections --
@app.get("/collections/list", dependencies=[Depends(verify_api_key)])
def list_collection():
    try:
        collections=client.list_collections()
        return JSONResponse(content=[{"name" : str(c.name) , "id" : str(c.id)} for c in collections])
        
    except Exception as e :
        raise HTTPException(status_code=400,detail=f"Domain Listing Failed with error: {str(e)}")
    
# -- list all nodes for a given collection -- 
@app.post("/nodes/list",dependencies=[Depends(verify_api_key)])
def list_nodes(payload:CollectionNameModel):
    try:
        collection = client.get_collection(payload.name)
        print(collection.metadata)
        nodes = collection.get(
            include=["documents","metadatas"]
        )
        documents = nodes.get("documents") or []
        ids = nodes.get("ids") or []
        metadatas = nodes.get("metadatas") or []
        result = []
        for node_id,doc,meta in zip( ids, documents, metadatas):
            try:
                user_links = json.loads(meta.get("user_links", "[]"))
                s_links = json.loads(meta.get("s_links", "[]"))
            except Exception:
                user_links = []
                s_links = []
            result.append(NodeOut(
                node_id=node_id,
                name=meta.get("name", ""),
                content=doc,
                user_links=user_links,
                s_links=s_links
            ))
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to list nodes: {str(e)}")




# -- POST requests --

# TODO : create reafactor for semantic links.
# we have a max link and dist thereshold value. on insertion of a node :
# - check 

# -- create  a new collection -- 
@app.post("/collections/create" , dependencies=[Depends(verify_api_key)])
def create_collection(payload : CollectionNameModel, background_tasks: BackgroundTasks):
    try :
        client.create_collection(name=payload.name)
        background_tasks.add_task(notify_clients,   "domain")
        return StatusModel(status=f"Created Domain {payload.name} Successfully.")
    except Exception as e:
        raise HTTPException(status_code=400,detail=f"Domain Creation Failed with error: {str(e)}")
    


# -- delete a collection -- 
@app.post("/collections/delete",dependencies=[Depends(verify_api_key)])
def delete_collection(payload:CollectionNameModel, background_tasks: BackgroundTasks):
    try:
        client.delete_collection(payload.name)
        background_tasks.add_task(notify_clients,   "domain")
        return StatusModel(status=f"Deleted Domain {payload.name} Successfully.")
    except Exception as e:
        raise HTTPException(status_code=400,detail=f"Domain Deletion Failed with error: {str(e)}")


# -- rename a collection --
@app.post("/collections/rename",dependencies=[Depends(verify_api_key)])
def delete_collection(payload:CollectionRenameModel, background_tasks: BackgroundTasks):
    try:
        collection = client.get_collection(payload.d_old)
        collection.modify(name=payload.d_new)
        background_tasks.add_task(notify_clients,   "domain")
        return StatusModel(status=f"Renamed  Domain {payload.d_old} to {payload.d_new} Successfully.")
    except Exception as e:
        raise HTTPException(status_code=400,detail=f"Domain Deletion Failed with error: {str(e)}")

# -- insert a node --
@app.post("/nodes/insert", dependencies=[Depends(verify_api_key)])
async def createNode(payload:NodeInputModel, background_tasks: BackgroundTasks):
    try:
        collection = client.get_collection(payload.collection)
        embedding=await model_embedding(f"Name: {payload.name}, {payload.content}")
        node_id = str(uuid.uuid1())
        q_result=collection.query(
            query_embeddings = embedding,
            n_results=payload.max_links,
            include=["distances"]
        )

        s_links=[]
        for i,id in enumerate(q_result["ids"][0]):
            if q_result["distances"][0][i] <= payload.distance_threshold:
                s_links.append(id)
        metadata= {
            "name" : payload.name,
            "user_links" : json.dumps(payload.user_links),
            "s_links" : json.dumps(s_links)
        }
        collection.add(
            documents=[payload.content],
            ids=[node_id],
            embeddings=[embedding],
            metadatas=[metadata]
        )
        background_tasks.add_task(notify_clients,   "node")
        return StatusModel(status=f"Added Node {payload.name} Successfully.")

    except Exception as e:
        raise HTTPException(status_code=400,detail=f"Node insertion failed with error: {str(e)}")
    

@app.post("/nodes/update", dependencies=[Depends(verify_api_key)])
async def updateNode(payload:NodeUpdateModel, background_tasks: BackgroundTasks):
    try:
        collection = client.get_collection(payload.collection)
        embedding=await model_embedding(f"Name: {payload.name}. {payload.content}")
        q_result=collection.query(
            query_embeddings = embedding,
            n_results=payload.max_links,
            include=["distances"]
        )

        s_links=[]
        for i,id in enumerate(q_result["ids"][0]):
            if q_result["distances"][0][i] <= payload.distance_threshold:
                s_links.append(id)
        metadata= {
            "name" : payload.name,
            "user_links" : json.dumps(payload.user_links),
            "s_links" : json.dumps(s_links)
        }
        collection.update(
            documents=[payload.content],
            ids=[payload.node_id],
            embeddings=[embedding],
            metadatas=[metadata]
        )
        background_tasks.add_task(notify_clients,   "node")
        return StatusModel(status=f"Updated Node {payload.name} Successfully.")

    except Exception as e:
        raise HTTPException(status_code=400,detail=f"Node Update failed with error: {str(e)}")
    

@app.post("/nodes/delete", dependencies=[Depends(verify_api_key)])
async def deleteNode(payload:NodeDeleteModel, background_tasks: BackgroundTasks):
    try:
        collection = client.get_collection(payload.collection)
        collection.delete(
            ids=[payload.node_id]
        )
        background_tasks.add_task(notify_clients,   "node")
        return StatusModel(status=f"Deleted Node Successfully.")

    except Exception as e:
        raise HTTPException(status_code=400,detail=f"Node delete failed with error: {str(e)}")