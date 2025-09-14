# python/main.py
from contextlib import asynccontextmanager
import os
from fastapi import FastAPI, Depends, Request, HTTPException, Query, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import chromadb
from sentence_transformers import SentenceTransformer
import numpy as np
import uuid
from typing import List, Optional, Dict, Any
import asyncio
import threading
import queue as thread_queue
import time

# ---- LangChain imports (best-effort; we try multiple LLM wrappers) ----
# If you use a specific wrapper (llama-cpp-python, ctransformers), install and adapt.
try:
    import ollama
except ImportError:
    ollama = None


# -- sentence-transformers embedding model globals --
embedding_model = None
embedding_model_ready = asyncio.Event()

# -- local LLM globals --
llm = None
llm_ready = asyncio.Event()
llm_load_error: Optional[str] = None

# ---- Existing lifespan: loads embedding model in background (unchanged, improved slightly) ----
@asynccontextmanager
async def lifespan(app: FastAPI):
    global embedding_model

    async def load_embedding_model():
        global embedding_model
        if embedding_model is None:
            local_path = "../__models__/embedding-model/models--sentence-transformers--all-mpnet-base-v2/snapshots/e8c3b32edf5434bc2275fc9bab85f82640a19130"
            try:
                if os.path.exists(local_path):
                    print("✅ Loading embedding model from local cache...")
                    embedding_model = await asyncio.to_thread(lambda: SentenceTransformer(local_path))
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
                # We deliberately do NOT set the event so upstream waits will fail (and endpoint will return 503).
    # start embedding model loader, but do not await
    async def load_ollama_llm():
        global llm_ready, llm_load_error
        if ollama is None:
            llm_load_error = "Ollama Python SDK is not installed."
            print(llm_load_error)
            return
        try:
            # Test a simple generation to ensure Ollama is working
            _ = ollama.generate(model="mistral-7b", prompt="Hello", n=1)
            llm_ready.set()
            print("Ollama LLM ready.")
        except Exception as e:
            llm_load_error = str(e)
            print("Ollama LLM load error:", llm_load_error)
    asyncio.create_task(load_embedding_model())

    # Start LLM loader in background (non-blocking)
    asyncio.create_task(load_ollama_llm())

    yield
    print("Server shutting down")


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

def validate_token(token: str) -> bool:
    return token == 'api-token'

# -- websocket clients (unchanged) --
clients = []

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str = Query(...)):
    if not validate_token(token):
        await ws.close(code=1008)
        return
    await ws.accept()
    clients.append(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        clients.remove(ws)

async def notify_clients(change_type):
    message = json.dumps({"type": change_type})
    for ws in clients:
        await ws.send_text(message)

# -- Pydantic models (kept & extended) --
class StatusModel(BaseModel):
    status: str

class NodeOut(BaseModel):
    node_id : str
    name : str
    content : str
    user_links : Optional[List[str]]
    s_links : Optional[List[str]]

class CollectionNameModel(BaseModel):
    name: str

class CollectionRenameModel(BaseModel):
    d_old: str
    d_new: str

class NodeInputModel(BaseModel):
    collection: str
    name: str
    content: str
    user_links: list[str]
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
    user_links: list[str]
    distance_threshold: float
    max_links: int

class NodeDeleteModel(BaseModel):
    collection: str
    node_id: str

# ---- Query models for LLM endpoints ----
class QueryModel(BaseModel):
    collection: str
    query: str
    max_results: Optional[int] = 5
    distance_threshold: Optional[float] = 0.8
    include_semantic_links: Optional[bool] = True
    stream: Optional[bool] = False

# -- chroma client (unchanged) --
client = chromadb.PersistentClient(path="db")

# ---- Helper functions: embeddings ----
async def model_embedding(text: str) -> list[float]:
    """
    Wait for embedding model to be ready and compute embedding in a thread.
    Returns a plain Python list of floats (Chroma expects lists).
    """
    await embedding_model_ready.wait()
    # SentenceTransformer.encode returns numpy array
    arr = await asyncio.to_thread(lambda: embedding_model.encode(text))
    if isinstance(arr, np.ndarray):
        return arr.tolist()
    else:
        # some versions return list already
        return list(arr)



# ---- Retrieval helper: uses your existing chroma collection and predefined semantic links ----
async def retrieve_documents(collection_name: str, query: str, k: int = 5, include_semantic_links: bool = True, distance_threshold: float = 1.0) -> List[Dict[str, Any]]:
    """
    - Embeds the query using the sentence-transformer model.
    - Queries the specified chroma collection for top-k results.
    - Optionally expands results by following the 's_links' (semantic links) field in metadata.
    Returns a list of dicts: {id, content, metadata, distance}
    """
    collection = client.get_collection(collection_name)
    q_emb = await model_embedding(query)
    q_result = collection.query(
        query_embeddings=q_emb,
        n_results=k,
        include=["documents", "metadatas", "ids", "distances"]
    )
    docs = []
    if not q_result:
        return docs
    # q_result fields are lists-of-lists (batch), we used single query so index 0
    docs_list = q_result.get("documents", [[]])[0]
    metas_list = q_result.get("metadatas", [[]])[0]
    ids_list = q_result.get("ids", [[]])[0]
    dists_list = q_result.get("distances", [[]])[0] if q_result.get("distances") else [None]*len(ids_list)

    for doc, meta, _id, dist in zip(docs_list, metas_list, ids_list, dists_list):
        docs.append({"id": _id, "content": doc, "meta": meta or {}, "distance": dist})

    # follow semantic links if requested (adds at most k extra docs)
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

# ---- Prompt template & chain builder ----
# The assistant is required to output strict JSON with these keys:
# - answer: text
# - code: list of {language, content}
# - commands: list of shell commands strings
# - references: list of node IDs (from the provided documents)
# - metadata: arbitrary map
#
# We instruct the LLM (system-like prompt) to ONLY output JSON (no markdown). If it fails, we retry.
STRUCTURED_OUTPUT_INSTRUCTIONS = """
You are the Wevn assistant. Using the provided CONTEXT (collection documents) and the USER_QUERY, produce a STRICTLY VALID JSON object — nothing else.
The JSON object MUST have these fields:
- answer: string (concise, factual answer to the user's query)
- code: list of objects { "language": "<language>", "content": "<code string>" } (empty list if none)
- commands: list of shell/cli commands (empty list if none)
- references: list of node ids (strings) that you used as sources (from the CONTEXT)
- metadata: object with optional keys like { "confidence": <0-1 float>, "notes": "<text>" } (can be empty)

Important:
- Do not include markdown fences, extraneous text, or commentary. Output MUST be a single valid JSON value.
- If you cannot answer, set "answer" to an honest short sentence and empty lists for code/commands/references.
"""

# ---- Ollama generator ----
async def generate_structured_response_ollama_retry(user_query: str, context_docs: List[Dict[str, Any]], max_retries: int = 2) -> Dict[str, Any]:
    """
    Generates structured JSON response from Ollama with retries.
    """
    await llm_ready.wait()
    await embedding_model_ready.wait()

    context_str = "\n\n---\n\n".join([f"NODE_ID: {d['id']}\nCONTENT: {d['content']}" for d in context_docs]) or "No context"
    prompt_base = f"{STRUCTURED_OUTPUT_INSTRUCTIONS}\n\nCONTEXT:\n{context_str}\n\nUSER_QUERY:\n{user_query}\nOutput JSON now."

    attempt = 0
    last_text = None

    while attempt <= max_retries:
        attempt += 1
        # Run Ollama in a thread (blocking call)
        response = await asyncio.to_thread(lambda: ollama.generate(model="mistral-7b", prompt=prompt_base))
        text = response[0]["content"].strip()
        last_text = text
        try:
            parsed = json.loads(text)
            return parsed
        except Exception as parse_err:
            # If retry remains, append repair instructions
            if attempt <= max_retries:
                prompt_base = f"{STRUCTURED_OUTPUT_INSTRUCTIONS}\n\nCONTEXT:\n{context_str}\n\nUSER_QUERY:\n{user_query}\n\nYour previous output was invalid JSON: {text}. Please produce **strict JSON only** according to the schema."
                continue
            # Out of retries → raise
            raise HTTPException(
                status_code=502,
                detail=f"Ollama output invalid JSON after {max_retries} retries: {last_text} ({parse_err})"
            )

# ---- Streaming via Ollama ----
async def run_chain_streaming_ollama_retry(user_query: str, context_docs: List[Dict[str, Any]], max_retries: int = 2):
    """
    Streaming SSE endpoint for Ollama with structured JSON validation & retry.
    Yields token streams and a final validated JSON payload.
    """
    await llm_ready.wait()
    await embedding_model_ready.wait()

    context_str = "\n\n---\n\n".join([f"NODE_ID: {d['id']}\nCONTENT: {d['content']}" for d in context_docs]) or "No context"
    prompt_base = f"{STRUCTURED_OUTPUT_INSTRUCTIONS}\n\nCONTEXT:\n{context_str}\n\nUSER_QUERY:\n{user_query}\nOutput JSON now."

    q = thread_queue.Queue()

    def worker(prompt_text):
        try:
            for tok in ollama.stream(model="mistral-7b", prompt=prompt_text):
                q.put_nowait(tok)
        except Exception as e:
            q.put_nowait({"__error__": str(e)})
        finally:
            q.put_nowait(None)

    # Start initial streaming
    threading.Thread(target=worker, args=(prompt_base,), daemon=True).start()

    async def generator():
        token_accum = []
        while True:
            item = await asyncio.to_thread(q.get)
            if item is None:
                break
            if isinstance(item, dict) and "__error__" in item:
                yield f"data: {{\"error\": \"LLM error: {item['__error__']}\"}}\n\n"
                return
            token_accum.append(item)
            yield f"data: {item}\n\n"

        # Attempt structured JSON validation and retry if needed
        text_full = "".join(token_accum).strip()
        attempt = 0
        while attempt <= max_retries:
            attempt += 1
            try:
                parsed = json.loads(text_full)
                final_json = json.dumps({"type": "final", "payload": parsed}, ensure_ascii=False)
                yield f"data: {final_json}\n\n"
                return
            except Exception:
                if attempt <= max_retries:
                    # Retry Ollama to fix output
                    response_retry = await asyncio.to_thread(lambda: ollama.generate(
                        model="mistral-7b",
                        prompt=f"{STRUCTURED_OUTPUT_INSTRUCTIONS}\n\nCONTEXT:\n{context_str}\n\nUSER_QUERY:\n{user_query}\nYour previous output was invalid JSON: {text_full}. Please output strict JSON."
                    ))
                    text_full = response_retry[0]["content"].strip()
                    continue
                # Out of retries → send error
                err_msg = f"Failed to produce valid JSON after {max_retries} retries: {text_full}"
                yield f"data: {{\"type\":\"error\",\"message\": {json.dumps(err_msg)} }}\n\n"
                return

    return generator()



# ---- FastAPI endpoints: health, collections, nodes (unchanged) ----
@app.get("/health", dependencies=[Depends(verify_api_key)])
def health():
    return StatusModel(status='ok')

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
        embeddings = nodes.get("embeddings")
        if embeddings is None:
            embeddings = []
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

# ---- New endpoints: /query (blocking) and /query/stream (SSE streaming) ----
# ---- Query endpoints ----
@app.post("/query", dependencies=[Depends(verify_api_key)])
async def query_endpoint(payload: QueryModel):
    docs = await retrieve_documents(payload.collection, payload.query,
                                    k=payload.max_results,
                                    include_semantic_links=payload.include_semantic_links,
                                    distance_threshold=payload.distance_threshold)
    parsed = await generate_structured_response_ollama_retry(payload.query, docs)
    return JSONResponse(content=parsed)


@app.post("/query/stream", dependencies=[Depends(verify_api_key)])
async def query_stream_endpoint(payload: QueryModel):
    docs = await retrieve_documents(payload.collection, payload.query,
                                    k=payload.max_results,
                                    include_semantic_links=payload.include_semantic_links,
                                    distance_threshold=payload.distance_threshold)
    gen = await run_chain_streaming_ollama_retry(payload.query, docs)
    return StreamingResponse(gen, media_type="text/event-stream")

