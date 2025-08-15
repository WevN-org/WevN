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

# -- create  a new collection -- 
@app.post("/collections/create" , dependencies=[Depends(verify_api_key)])
def create_collection(payload : CollectionNameModel):
    try :
        client.create_collection(name=payload.name)
        return StatusModel(status="Created Domain Successfully.")
    except Exception as e:
        raise HTTPException(status_code=400,detail=f"Domain Creation Failed with error: {str(e)}")
    

@app.get("/collections/list", dependencies=[Depends(verify_api_key)])
def list_collection():
    try:
        collections=client.list_collections()
        return JSONResponse(content=[{"name" : str(c.name) , "id" : str(c.id)} for c in collections])
        
    except Exception as e :
        raise HTTPException(status_code=400,detail=f"Domain Listing Failed with error: {str(e)}")
    






