# python/main.py

from contextlib import asynccontextmanager
import os
from fastapi import FastAPI, Depends, Request, HTTPException, Query, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.responses import JSONResponse , StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import chromadb
from sentence_transformers import SentenceTransformer
import uuid
from typing import List,Optional
import asyncio


# -- sentence - transformers  model
llmImport=True

try:

    from langchain_ollama import ChatOllama
    from langchain.prompts import PromptTemplate
    from langchain.memory import ConversationSummaryMemory
    from pydantic import BaseModel, Field
    from typing import Optional
    from collections import defaultdict  
except Exception as e:
    llmImport=False
    print("Error: " , e)
    raise


# llm model
llm_model="deepseek-r1:7b"
# some important global parameters 
model = None
model_ready = asyncio.Event()

llm = None
llm_ready= asyncio.Event()
llm_error: Optional[str] = None


summary_memory = None

prompt = None
raw_chain = None

# llm structured response
class StructuredResponse(BaseModel):
    Answer: str = Field(description="Main answer text, can include explanation or code")
    Command: Optional[str] = Field(default="", description="Custom command for tools, if any")





@asynccontextmanager
async def lifespan(app : FastAPI):
    global model
    async def load_model():
        global model
        if model is None:
            local_path = "../__models__/embedding-model/models--sentence-transformers--all-mpnet-base-v2/snapshots/e8c3b32edf5434bc2275fc9bab85f82640a19130"
            if os.path.exists(local_path):
                print("✅ Loading model from local cache...")
                model = await asyncio.to_thread(
                    lambda: SentenceTransformer(local_path)
                )
                print("Model loaded!")
                model_ready.set()
            else:
                print("🌐 Downloading model from Hugging Face...")
                model = await asyncio.to_thread(
                    lambda: SentenceTransformer(
                        "all-mpnet-base-v2",
                        cache_folder="../__models__/embedding-model"
                    )
                )
                print("Model loaded!")
                model_ready.set()
    async def load_llm_and_parser():
        global llm ,summary_memory,llm_error,prompt,raw_chain
        if llm is None:
            try: 
                


                # ---------------------------
                # 2. LLM + Memory
                # ---------------------------
                llm = ChatOllama(model=llm_model, temperature=0,disable_streaming=False)
                def health_check():
                        resp = llm.invoke("hello")
                        return resp
                
                summary_memory = defaultdict(lambda: ConversationSummaryMemory(llm=llm))
                await asyncio.to_thread(health_check)
                print("LLM (LangChain ChatOllama) ready.")
                llm_ready.set()
                print("Ollama LLM ready.") 
                                
                # llm Prompt template 
                prompt = PromptTemplate(
                    template="""
                You are the WevN Assistant.

                Conversation so far:
                {history}

                User input: {input}

                Please provide a relevant answer based on the Conversation so far .
                """,
                    input_variables=["input", "history"]
                    
                )

                # llm structured chain
                raw_chain = prompt | llm
            except Exception as e :
                llm_error = e
                print("llm error : " , e)
    asyncio.create_task(load_model())
    asyncio.create_task(load_llm_and_parser())

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

# For refactoring semantic links
class NodeSemanticRefactorModel(BaseModel):
    collection: str
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

class QueryModel(BaseModel):
    collection: str
    query: str
    conversation_id: str
    max_results: Optional[int] = 10
    distance_threshold: Optional[float] = 1.4



# -- ChromaDB client -- 
client = chromadb.PersistentClient(path="db")



# -- Helper Functions --(boring stuff)






# -- embedding --
async def model_embedding(text: str) -> list[float]:
    await model_ready.wait()
    return await asyncio.to_thread(lambda: model.encode(text))



async def ask_stream(question: str, conv_id: str):
    await llm_ready.wait()

    memory = summary_memory[conv_id]
    history_vars = memory.load_memory_variables({})
    history = history_vars.get("history", "")

    response_text = ""

    try:
        async for event in raw_chain.astream_events({"input": question, "history": history},version="v2"):
            # append token if present

            event_type = event["event"]
            if event_type == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if chunk.content:
                    response_text += chunk.content
                    print(chunk)
                    yield chunk.content

            # manually stop when LLM signals done
                done = chunk.response_metadata.get("done", False)
                if done:
                    break
            
    except Exception as e:
        yield f"\n\n[ERROR]: {str(e)}"
    finally:
        memory.save_context({"input": question}, {"output": response_text})
        # signal stream end
        yield ""
        return







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

@app.post("/nodes/refactor",dependencies=[Depends(verify_api_key)])
def refactor_nodes(payload:NodeSemanticRefactorModel, background_tasks: BackgroundTasks):
    try:
        collection = client.get_collection(payload.collection)
        nodes = collection.get(
            include=["metadatas","embeddings"]
        )
        ids = nodes.get("ids") or []
        metadatas = nodes.get("metadatas") or []
        embeddings=nodes.get("embeddings")
        if embeddings is None:
            embeddings = []
        meta_result = []
        id_result = []
        for node_id,meta,embedding in zip( ids, metadatas,embeddings):
            q_result= collection.query(
                query_embeddings = embedding,
                n_results=payload.max_links,
                include=["distances"]
            )
            s_links=[]
            for i,id in enumerate(q_result["ids"][0]):
                if id != node_id and q_result["distances"][0][i] <= payload.distance_threshold:
                    s_links.append(id)
            meta["s_links"] = json.dumps(s_links)
            meta_result.append(meta)
            id_result.append(node_id)

        collection.update(
            ids=id_result,
            metadatas=meta_result
        )
        background_tasks.add_task(notify_clients,"node")
        return StatusModel(status=f"Refactored semantic links for nodes in {payload.collection} Successfully.")

        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to refactored semantic links for nodes in  {payload.collection} - {str(e)}")

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
def rename_collection(payload:CollectionRenameModel, background_tasks: BackgroundTasks):
    try:
        collection = client.get_collection(payload.d_old)
        collection.modify(name=payload.d_new)
        background_tasks.add_task(notify_clients,   "domain")
        return StatusModel(status=f"Renamed  Domain {payload.d_old} to {payload.d_new} Successfully.")
    except Exception as e:
        raise HTTPException(status_code=400,detail=f"Domain Rename Failed with error: {str(e)}")

# -- insert a node --
@app.post("/nodes/insert", dependencies=[Depends(verify_api_key)])
async def createNode(payload:NodeInputModel, background_tasks: BackgroundTasks):
    try:
        collection = client.get_collection(payload.collection)
        embedding=await model_embedding(f"Name: {payload.name}. {payload.content}")
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
    

    
@app.post("/query/stream", dependencies=[Depends(verify_api_key)])
async def query_stream(payload: QueryModel):
    global node_input_model
    print("Stream ------------->")
    async def event_generator():
        try:
            async for token in ask_stream(payload.query,payload.conversation_id):
                yield token
        except Exception as e:
            yield f"\n\n[ERROR]: {str(e)}"

    return StreamingResponse(event_generator(), media_type="text/plain")
