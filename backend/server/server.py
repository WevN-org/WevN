# python/main.py

from contextlib import asynccontextmanager
import os
import warnings
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
    from sqlalchemy import create_engine
    from langchain.memory import ConversationSummaryBufferMemory
    from pydantic import BaseModel, Field
    from typing import Optional
    from langchain_community.chat_message_histories import SQLChatMessageHistory
except Exception as e:
    llmImport=False
    print("Error: " , e)
    raise


# llm model
llm_model="gemma3:4b"
# llm_model="llama3.1:8b"

# some important global parameters 
model = None
model_ready = asyncio.Event()

llm = None
llm_ready= asyncio.Event()
llm_error: Optional[str] = None


memory_dict = {}

prompt = None
raw_chain = None

# llm structured response
class StructuredResponse(BaseModel):
    Answer: str = Field(description="Main answer text, can include explanation or code")
    Command: Optional[str] = Field(default="", description="Custom command for tools, if any")


# Combination of summery memory and buffer memory 








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
        global llm ,llm_error,prompt,raw_chain
        if llm is None:
            try: 
                


                # ---------------------------
                # 2. LLM + Memory
                # ---------------------------
                llm = ChatOllama(model=llm_model, temperature=0,disable_streaming=False)
                def health_check():
                        resp = llm.invoke("hello")
                        return resp
                
                # await asyncio.to_thread(health_check)
                print("LLM (LangChain ChatOllama) ready.")
                llm_ready.set()
                print("Ollama LLM ready.") 
                                
                # llm Prompt template 
                
                prompt = PromptTemplate(
                template="""
                You are the WevN Assistant.

                Conversation so far:
                {conversation}

                Relevant retrieved documents:
                {context}

                User question:
                {question}

                Please provide a relevant answer based on the conversation and context.
                """,
                    input_variables=["conversation", "context", "question"]
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


def get_or_create_memory(conv_id: str):
    """
    Returns a synchronous ConversationBufferWindowMemory for a conversation.
    Uses sync SQLite backend.
    """
    if conv_id in memory_dict:
        # Memory already exists, return it
        return memory_dict[conv_id]

    # --- Sync SQLite connection ---
    

    sync_engine = create_engine("sqlite:///chat_memory.db", echo=False)

    # Sync chat history
    chat_history_db = SQLChatMessageHistory(
        session_id=conv_id,
        connection=sync_engine,
        async_mode=False,               # ⚠️ sync mode
        table_name=f"chat_history_{conv_id}"
    )

    summary_prompt = PromptTemplate(
    template="""
    Progressively summarize the conversation provided, adding onto the previous summary.

    Current summary:
    {summary}

    New lines of conversation:
    {new_lines}

    New summary:
    """,
    input_variables=["summary", "new_lines"]
)

    # Create sync memory
    memory = ConversationSummaryBufferMemory(
    llm=llm,                          # your sync LLM
    chat_memory=chat_history_db,       # sync SQLite storage
    max_token_limit=5000,              # older messages summarized
    buffer_size=5,                     # keep last 8 messages in buffer
    input_key="question",
    memory_key="conversation",         # key to access later
    return_messages=True,              # returns messages instead of text
    prompt=summary_prompt              # custom summary prompt
)

    # Store in dict for reuse
    memory_dict[conv_id] = memory
    return memory


async def ask_stream(question: str, conv_id: str, collection_name: str, max_results: int , distance_threshold: float ):
    if llm_error:
        raise HTTPException(status_code=400, detail=llm_error)
    await llm_ready.wait()

    # Conversation memory
    memory =  get_or_create_memory(conv_id)
    memory_vars =  memory.load_memory_variables({})
    conversation_text = memory_vars["conversation"]  # all combined (buffer + summary)
    print(f"------------> {distance_threshold , max_results}")

    response_text = ""

    try:
        # --- NEW PART: retrieve context from ChromaDB ---
        collection = client.get_collection(collection_name)
        q_embedding = await model_embedding(question)

        q_result = collection.query(
            query_embeddings=q_embedding,
            n_results=max_results,
            include=["documents", "distances", "metadatas"],
        )

        # filter by distance threshold
        retrieved_docs = []
        for i, doc in enumerate(q_result["documents"][0]):
            if q_result["distances"][0][i] <= distance_threshold:
                retrieved_docs.append(doc)

        # Build a context string for the LLM
        context = "\n\n".join(retrieved_docs) if retrieved_docs else "No relevant context found."

        # Final prompt for the LLM
        llm_input = {
            "conversation": conversation_text,
            "context": context,
            "question": question
        }

        formatted_prompt = prompt.format(**llm_input)
        print(formatted_prompt)


        # --- STREAMING RESPONSE ---
        async for event in raw_chain.astream_events(llm_input, version="v2"):
            event_type = event["event"]

            if event_type == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if chunk.content:
                    response_text += chunk.content
                    yield chunk.content

                done = chunk.response_metadata.get("done", False)
                if done:
                    break

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")
    
    finally:
        memory.save_context({"question": question}, {"output_text": response_text})
        # signal stream end
        return

# async def ask_stream(question: str, conv_id: str):
#     if llm_error : raise HTTPException(status_code=400,detail=llm_error)
#     await llm_ready.wait()
#     memory = memory_dict[conv_id]
#     history_vars = memory.load_memory_variables({})
#     history = history_vars.get("history", "")

#     response_text = ""

#     try:
#         async for event in raw_chain.astream_events({"input": question, "history": history},version="v2"):
#             # append token if present

#             event_type = event["event"]
#             if event_type == "on_chat_model_stream":
#                 chunk = event["data"]["chunk"]
#                 if chunk.content:
#                     response_text += chunk.content
#                     yield chunk.content

#             # manually stop when LLM signals done
#                 done = chunk.response_metadata.get("done", False)
#                 if done:
#                     break
            
#     except Exception as e:
#         yield f"\n\n[ERROR]: {str(e)}"
#     finally:
#         memory.save_context({"input": question}, {"output": response_text})
#         # signal stream end
#         yield ""
#         return







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
            async for token in ask_stream(
                payload.query,
                payload.conversation_id,
                collection_name=payload.collection,
                distance_threshold=payload.distance_threshold,
                max_results=payload.max_results
                ):

                yield token
        except Exception as e:
            yield f"\n\n[ERROR]: {str(e)}"

    return StreamingResponse(event_generator(), media_type="text/plain")
