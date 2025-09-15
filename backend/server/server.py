# python/main.py
"""
Remade FastAPI server using Ollama + LangChain JsonOutputParser + RetryWithErrorOutputParser.
Features:
- Loads embedding model (sentence-transformers) in background
- Uses Ollama via langchain_ollama ChatOllama wrapper
- Enforces strict JSON schema via Pydantic + JsonOutputParser
- Uses RetryWithErrorOutputParser to auto-retry and return helpful errors
- Provides blocking (/query) and SSE streaming (/query/stream) endpoints
- Keeps existing ChromaDB collection/node endpoints

Note: This file uses langchain and langchain_ollama APIs. Install the following (example):
pip install langchain langchain-ollama ollama-client chromadb sentence-transformers uvicorn fastapi

Adjust model names, paths, and env/config as needed.
"""

from contextlib import asynccontextmanager
import os
import json
import uuid
import asyncio
import threading
import queue as thread_queue
from typing import List, Optional, Dict, Any, TypedDict

from fastapi import FastAPI, Depends, Request, HTTPException, Query, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import chromadb
from sentence_transformers import SentenceTransformer
import numpy as np

# LangChain + Ollama
try:
    from langchain_ollama import ChatOllama
    from langchain_core.output_parsers import JsonOutputParser
    from langchain.output_parsers import RetryWithErrorOutputParser
    from langchain.prompts import ChatPromptTemplate
    from langgraph.graph import StateGraph, END
    from langgraph.checkpoint.memory import MemorySaver # Simple in-memory persistence
    from langchain_core.messages import BaseMessage
    from langchain_core.messages import AIMessage, HumanMessage
    
except Exception:
    # If langchain or adapters are missing, we still want the server to start but llm calls will error clearly
    ChatOllama = None
    JsonOutputParser = None
    RetryWithErrorOutputParser = None
    ChatPromptTemplate = None
    StateGraph = None
    MemorySaver = None

# Local Ollama client fallback (if you used direct ollama SDK elsewhere)

# Configuration
llm_model = os.environ.get("LLM_MODEL", "gemma3:4b")
API_KEY = os.environ.get("API_KEY", "mysecretkey")
EMBEDDING_LOCAL_PATH = os.environ.get("EMBEDDING_LOCAL_PATH", "../__models__/embedding-model/models--sentence-transformers--all-mpnet-base-v2/snapshots/e8c3b32edf5434bc2275fc9bab85f82640a19130")
CHROMA_PATH = os.environ.get("CHROMA_PATH", "db")

# Globals
embedding_model = None
embedding_model_ready = asyncio.Event()

llm: Optional[Any] = None
llm_ready = asyncio.Event()
llm_load_error: Optional[str] = None

# Chroma client
client = chromadb.PersistentClient(path=CHROMA_PATH)

# FastAPI app and lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load embedding model in background
    async def load_embedding_model():
        global embedding_model
        try:
            if os.path.exists(EMBEDDING_LOCAL_PATH):
                print("✅ Loading embedding model from local cache...")
                embedding_model = await asyncio.to_thread(lambda: SentenceTransformer(EMBEDDING_LOCAL_PATH))
            else:
                print("🌐 Downloading embedding model from Hugging Face (to cache folder)...")
                embedding_model = await asyncio.to_thread(lambda: SentenceTransformer(
                    "all-mpnet-base-v2",
                    cache_folder="../__models__/embedding-model"
                ))
            print("Embedding model ready.")
            embedding_model_ready.set()
        except Exception as e:
            print("Failed to load embedding model:", str(e))

    # Initialize LangChain Ollama + parsers
    async def load_llm_and_parsers():
        global llm, llm_ready, llm_load_error
        if ChatOllama is None or JsonOutputParser is None or RetryWithErrorOutputParser is None:
            llm_load_error = "LangChain or Ollama adapter not installed. Install langchain and langchain-ollama."
            print(llm_load_error)
            return
        try:
            # instantiate ChatOllama LLM
            def health_check():
                resp = llm.invoke([HumanMessage(content="Hello")])
                return resp
            llm = ChatOllama(model=llm_model, temperature=0)
            # quick health call -- some wrappers provide ping or simple generation
            # we run a short sync generation inside a thread to ensure client works
            await asyncio.to_thread(health_check)
            print("LLM (LangChain ChatOllama) ready.")
            llm_ready.set()
        except Exception as e:
            llm_load_error = str(e)
            print("LLM load error:", llm_load_error)

    # Kick off background tasks
    asyncio.create_task(load_embedding_model())
    asyncio.create_task(load_llm_and_parsers())

    yield
    print("Server shutting down")

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Security / dependencies ---

def verify_api_key(request: Request):
    key = request.headers.get("X-API-Key")
    if key != API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid API Key")

# --- Websocket clients ---
clients: List[Any] = []

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str = Query(...)):
    if token != "api-token":
        await ws.close(code=1008)
        return
    await ws.accept()
    clients.append(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        clients.remove(ws)

async def notify_clients(change_type: str):
    message = json.dumps({"type": change_type})
    for ws in list(clients):
        try:
            await ws.send_text(message)
        except Exception:
            try:
                clients.remove(ws)
            except Exception:
                pass

# --- Pydantic models ---
class StatusModel(BaseModel):
    status: str

class NodeOut(BaseModel):
    node_id: str
    name: str
    content: str
    user_links: Optional[List[str]] = None
    s_links: Optional[List[str]] = None

class CollectionNameModel(BaseModel):
    name: str

class CollectionRenameModel(BaseModel):
    d_old: str
    d_new: str

class NodeInputModel(BaseModel):
    collection: str
    name: str
    content: str
    user_links: List[str]
    distance_threshold: float
    max_links: int

class NodeSemanticRefactorModel(BaseModel):
    collection: str
    distance_threshold: float
    max_links: int

class NodeUpdateModel(BaseModel):
    collection: str
    node_id: str
    name: str
    content: str
    user_links: List[str]
    distance_threshold: float
    max_links: int

class NodeDeleteModel(BaseModel):
    collection: str
    node_id: str

class QueryModel(BaseModel):
    collection: str
    query: str
    conversation_id: Optional[str] = None  # Add this line
    max_results: Optional[int] = 5
    distance_threshold: Optional[float] = 0.8
    include_semantic_links: Optional[bool] = True
    stream: Optional[bool] = False

# --- Structured response schema (Pydantic for JsonOutputParser) ---
class CodeBlock(BaseModel):
    language: str
    content: str

class StructuredResponse(BaseModel):
    answer: str
    code: List[CodeBlock] = Field(default_factory=list)
    commands: List[str] = Field(default_factory=list)
    references: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

# --- Embeddings helper ---
async def model_embedding(text: str) -> List[float]:
    await embedding_model_ready.wait()
    arr = await asyncio.to_thread(lambda: embedding_model.encode(text))
    if isinstance(arr, np.ndarray):
        return arr.tolist()
    return list(arr)

# --- Document retrieval ---
async def retrieve_documents(collection_name: str, query: str, k: int = 5, include_semantic_links: bool = True, distance_threshold: float = 1.0) -> List[Dict[str, Any]]:
    collection = client.get_collection(collection_name)
    q_emb = await model_embedding(query)
    q_result = collection.query(
        query_embeddings=q_emb,
        n_results=k,
        include=["documents", "metadatas", "distances"]
    )
    docs = []
    if not q_result:
        return docs
    docs_list = q_result.get("documents", [[]])[0]
    metas_list = q_result.get("metadatas", [[]])[0]
    ids_list = q_result.get("ids", [[]])[0]
    dists_list = q_result.get("distances", [[]])[0] if q_result.get("distances") else [None]*len(ids_list)

    for doc, meta, _id, dist in zip(docs_list, metas_list, ids_list, dists_list):
        docs.append({"id": _id, "content": doc, "meta": meta or {}, "distance": dist})

    if include_semantic_links:
        extra = []
        seen = set([d["id"] for d in docs if d.get("id")])
        limit_extra = k
        for d in docs:
            try:
                s_links = json.loads(d["meta"].get("s_links", "[]"))
            except Exception:
                s_links = []
            for sid in s_links:
                if sid and sid not in seen and len(extra) < limit_extra:
                    got = collection.get(ids=[sid], include=["documents", "metadatas"])
                    got_docs = got.get("documents", [])
                    if got_docs:
                        extra.append({"id": sid, "content": got_docs[0], "meta": (got.get("metadatas") or [])[0] if got.get("metadatas") else {}, "distance": None})
                        seen.add(sid)
        docs.extend(extra)
    return docs

# --- LangChain prompt & parsers setup helper ---


class GraphState(TypedDict):
    """
    Represents the state of our graph.
    """
    query: str
    collection_name: str  # <-- ADD THIS LINE
    messages: List[BaseMessage]
    documents: List[Dict[str, Any]]
    response: Dict[str, Any]

# --- LangChain prompt & parsers setup helper ---
def build_parser_and_prompt():
    json_parser = JsonOutputParser(pydantic_object=StructuredResponse)
    template_string = """You are the Wevn assistant. You can have a friendly conversation with the user.
Using the provided CONTEXT (documents from a knowledge base) and the CHAT HISTORY, answer the user's query.
{format_instructions}
CHAT HISTORY:
{chat_history}
CONTEXT:
{context}
USER_QUERY:
{query}
Respond with valid JSON only."""
    prompt = ChatPromptTemplate.from_template(
        template_string,
        partial_variables={"format_instructions": json_parser.get_format_instructions()},
    )
    return json_parser, prompt

# --- Memory Management ---
# python/main.py

# --- LangGraph Nodes ---

# python/main.py

async def retrieve_documents_node(state: GraphState) -> Dict[str, Any]:
    """
    Node to retrieve documents from ChromaDB based on the user's query.
    """
    print("---NODE: RETRIEVING DOCUMENTS---")
    
    # Get the collection name and query from the state
    collection = state["collection_name"]
    query = state["query"]
    
    # Pass the dynamic collection name to your retrieval function
    documents = await retrieve_documents(
        collection_name=collection,
        query=query
    )
    
    return {"documents": documents}



async def generate_response_node(state: GraphState) -> Dict[str, Any]:
    print("---NODE: GENERATING RESPONSE---")
    json_parser, prompt = build_parser_and_prompt()
    context_str = "\n\n---\n\n".join([f"ID: {d.get('id', 'N/A')}\nCONTENT: {d.get('content', '')}" for d in state["documents"]]) or "No context"
    chat_history_str = "\n".join([f"{type(msg).__name__}: {msg.content}" for msg in state["messages"]])
    
    chain = prompt | llm | json_parser
    parsed_dict = await chain.ainvoke({
        "context": context_str,
        "query": state["query"],
        "chat_history": chat_history_str
    })
    
    new_messages = [HumanMessage(content=state["query"]), AIMessage(content=json.dumps(parsed_dict))]
    return {"response": parsed_dict, "messages": state["messages"] + new_messages}


workflow = StateGraph(GraphState)
workflow.add_node("retrieve", retrieve_documents_node)
workflow.add_node("generate", generate_response_node)
workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "generate")
workflow.add_edge("generate", END)
memory = MemorySaver()
graph_app = workflow.compile(checkpointer=memory)
# --- Generate structured response (blocking) ---


# --- Existing endpoints (collections, nodes) ---
@app.get("/health", dependencies=[Depends(verify_api_key)])
def health():
    return StatusModel(status="ok")

@app.get("/collections/list", dependencies=[Depends(verify_api_key)])
def list_collection():
    try:
        collections = client.list_collections()
        return JSONResponse(content=[{"name": str(c.name), "id": str(c.id)} for c in collections])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Domain Listing Failed with error: {str(e)}")

@app.post("/nodes/list", dependencies=[Depends(verify_api_key)])
def list_nodes(payload: CollectionNameModel):
    try:
        collection = client.get_collection(payload.name)
        nodes = collection.get(include=["documents", "metadatas"])
        documents = nodes.get("documents") or []
        ids = nodes.get("ids") or []
        metadatas = nodes.get("metadatas") or []
        result = []
        for node_id, doc, meta in zip(ids, documents, metadatas):
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

@app.post("/nodes/refactor", dependencies=[Depends(verify_api_key)])
def refactor_nodes(payload: NodeSemanticRefactorModel, background_tasks: BackgroundTasks):
    try:
        collection = client.get_collection(payload.collection)
        nodes = collection.get(include=["metadatas", "embeddings"])
        ids = nodes.get("ids") or []
        metadatas = nodes.get("metadatas") or []
        embeddings = nodes.get("embeddings") or []
        meta_result = []
        id_result = []
        for node_id, meta, embedding in zip(ids, metadatas, embeddings):
            q_result = collection.query(
                query_embeddings=embedding,
                n_results=payload.max_links,
                include=["distances"]
            )
            s_links = []
            for i, id in enumerate(q_result["ids"][0]):
                if id != node_id and q_result["distances"][0][i] <= payload.distance_threshold:
                    s_links.append(id)
            meta["s_links"] = json.dumps(s_links)
            meta_result.append(meta)
            id_result.append(node_id)

        collection.update(ids=id_result, metadatas=meta_result)
        background_tasks.add_task(notify_clients, "node")
        return StatusModel(status=f"Refactored semantic links for nodes in {payload.collection} Successfully.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to refactored semantic links for nodes in  {payload.collection} - {str(e)}")

@app.post("/collections/create", dependencies=[Depends(verify_api_key)])
def create_collection(payload: CollectionNameModel, background_tasks: BackgroundTasks):
    try:
        client.create_collection(name=payload.name)
        background_tasks.add_task(notify_clients, "domain")
        return StatusModel(status=f"Created Domain {payload.name} Successfully.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Domain Creation Failed with error: {str(e)}")

@app.post("/collections/delete", dependencies=[Depends(verify_api_key)])
def delete_collection(payload: CollectionNameModel, background_tasks: BackgroundTasks):
    try:
        client.delete_collection(payload.name)
        background_tasks.add_task(notify_clients, "domain")
        return StatusModel(status=f"Deleted Domain {payload.name} Successfully.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Domain Deletion Failed with error: {str(e)}")

@app.post("/collections/rename", dependencies=[Depends(verify_api_key)])
def rename_collection(payload: CollectionRenameModel, background_tasks: BackgroundTasks):
    try:
        collection = client.get_collection(payload.d_old)
        collection.modify(name=payload.d_new)
        background_tasks.add_task(notify_clients, "domain")
        return StatusModel(status=f"Renamed  Domain {payload.d_old} to {payload.d_new} Successfully.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Domain Rename Failed with error: {str(e)}")

@app.post("/nodes/insert", dependencies=[Depends(verify_api_key)])
async def createNode(payload: NodeInputModel, background_tasks: BackgroundTasks):
    try:
        collection = client.get_collection(payload.collection)
        embedding = await model_embedding(f"Name: {payload.name}. {payload.content}")
        node_id = str(uuid.uuid1())
        q_result = collection.query(query_embeddings=embedding, n_results=payload.max_links, include=["distances"])

        s_links = []
        for i, id in enumerate(q_result["ids"][0]):
            if q_result["distances"][0][i] <= payload.distance_threshold:
                s_links.append(id)
        metadata = {
            "name": payload.name,
            "user_links": json.dumps(payload.user_links),
            "s_links": json.dumps(s_links)
        }
        collection.add(
            documents=[payload.content],
            ids=[node_id],
            embeddings=[embedding],
            metadatas=[metadata]
        )
        background_tasks.add_task(notify_clients, "node")
        return StatusModel(status=f"Added Node {payload.name} Successfully.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Node insertion failed with error: {str(e)}")

@app.post("/nodes/update", dependencies=[Depends(verify_api_key)])
async def updateNode(payload: NodeUpdateModel, background_tasks: BackgroundTasks):
    try:
        collection = client.get_collection(payload.collection)
        embedding = await model_embedding(f"Name: {payload.name}. {payload.content}")
        q_result = collection.query(query_embeddings=embedding, n_results=payload.max_links, include=["distances"])

        s_links = []
        for i, id in enumerate(q_result["ids"][0]):
            if q_result["distances"][0][i] <= payload.distance_threshold:
                s_links.append(id)
        metadata = {
            "name": payload.name,
            "user_links": json.dumps(payload.user_links),
            "s_links": json.dumps(s_links)
        }
        collection.update(
            documents=[payload.content],
            ids=[payload.node_id],
            embeddings=[embedding],
            metadatas=[metadata]
        )
        background_tasks.add_task(notify_clients, "node")
        return StatusModel(status=f"Updated Node {payload.name} Successfully.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Node Update failed with error: {str(e)}")

@app.post("/nodes/delete", dependencies=[Depends(verify_api_key)])
async def deleteNode(payload: NodeDeleteModel, background_tasks: BackgroundTasks):
    try:
        collection = client.get_collection(payload.collection)
        collection.delete(ids=[payload.node_id])
        background_tasks.add_task(notify_clients, "node")
        return StatusModel(status=f"Deleted Node Successfully.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Node delete failed with error: {str(e)}")

# --- New endpoints using LangChain parser ---
# python/main.py

@app.post("/query", dependencies=[Depends(verify_api_key)])
async def query_endpoint(payload: QueryModel):
    # ... (code to check if LLM is ready) ...
    
    conversation_id = payload.conversation_id or f"conv_{uuid.uuid4()}"
    config = {"configurable": {"thread_id": conversation_id}}
    # Pass both the query AND the collection name into the graph
    initial_input = {
        "query": payload.query,
        "collection_name": payload.collection
    }

    try:
        final_state = await graph_app.ainvoke(initial_input, config=config)
        # ... (rest of the function is the same)
        response_content = {
            "conversation_id": conversation_id,
            "response": final_state.get("response")
        }
        return JSONResponse(content=response_content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"LLM query failed: {str(e)}")

# Remember to make the same change to `initial_input` in your /query/stream endpoint!


@app.post("/query/stream", dependencies=[Depends(verify_api_key)])
async def query_stream_endpoint(payload: QueryModel):
    if not llm_ready.is_set():
        raise HTTPException(status_code=503, detail=f"LLM not ready: {llm_load_error}")

    conversation_id = payload.conversation_id or f"conv_{uuid.uuid4()}"
    config = {"configurable": {"thread_id": conversation_id}}
    initial_input = {"query": payload.query}

    async def stream_generator():
        try:
            async for event in graph_app.astream(initial_input, config=config):
                # We are interested in the output of the 'generate' node
                if "generate" in event:
                    final_response = event["generate"].get("response")
                    response_obj = {
                        "type": "final",
                        "conversation_id": conversation_id,
                        "payload": final_response
                    }
                    yield f"data: {json.dumps(response_obj, ensure_ascii=False)}\n\n"
        except Exception as e:
            error_obj = {"type": "error", "message": f"LLM stream failed: {str(e)}"}
            yield f"data: {json.dumps(error_obj)}\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")


# End of file
