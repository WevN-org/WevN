# python/main.py

from fastapi import FastAPI, Depends, Request, HTTPException, Query, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import chromadb
from sentence_transformers import SentenceTransformer


# -- sentence - transformers  model

model = SentenceTransformer('all-MiniLM-L6-v2')

# -- websocket  clients
clients = []





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

# -- input models --

# For creating and Deleting Collections
class CollectionNameModel(BaseModel):
    name: str
    





# -- ChromaDB client -- 
client = chromadb.PersistentClient(path="db")



# -- Helper Functions --(boring stuff)


# -- Creating Collection --
def get_or_create_collection(name: str):
    return client.get_or_create_collection(name=name)








# -- fastapi endpoints -- 


# -- server helth inquiry
@app.get("/health", dependencies=[Depends(verify_api_key)])
def health():
    return StatusModel(status='ok')


# -- create  a new collection -- 
@app.post("/collections/create" , dependencies=[Depends(verify_api_key)])
def create_collection(payload : CollectionNameModel, background_tasks: BackgroundTasks):
    try :
        client.create_collection(name=payload.name)
        background_tasks.add_task(notify_clients,   "domain")
        return StatusModel(status=f"Created Domain {payload.name} Successfully.")
    except Exception as e:
        raise HTTPException(status_code=400,detail=f"Domain Creation Failed with error: {str(e)}")


# -- list all collections --
@app.get("/collections/list", dependencies=[Depends(verify_api_key)])
def list_collection():
    try:
        collections=client.list_collections()
        return JSONResponse(content=[{"name" : str(c.name) , "id" : str(c.id)} for c in collections])
        
    except Exception as e :
        raise HTTPException(status_code=400,detail=f"Domain Listing Failed with error: {str(e)}")
    
# -- delete a collection -- 
@app.post("/collections/delete",dependencies=[Depends(verify_api_key)])
def delete_collection(payload:CollectionNameModel, background_tasks: BackgroundTasks):
    try:
        client.delete_collection(payload.name)
        background_tasks.add_task(notify_clients,   "domain")
        return StatusModel(status=f"Deleted Domain {payload.name} Successfully.")
    except Exception as e:
        raise HTTPException(status_code=400,detail=f"Domain Deletion Failed with error: {str(e)}")




