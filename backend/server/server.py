# python/main.py

from contextlib import asynccontextmanager
import os
from fastapi import (
    FastAPI,
    Depends,
    Request,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    BackgroundTasks,
)
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import pprint
import chromadb
from sentence_transformers import SentenceTransformer
import uuid
from typing import List, Optional
import asyncio


# -- sentence - transformers  model
llmImport = True

try:

    from langchain_ollama import ChatOllama
    from langchain.prompts import PromptTemplate
    from langchain_core.messages import BaseMessage
    # from sqlalchemy import create_engine
    # from langchain.memory import ConversationSummaryBufferMemory
    from pydantic import BaseModel, Field
    from typing import Optional
    from langchain_community.chat_message_histories import SQLChatMessageHistory
    from sqlalchemy.ext.asyncio import create_async_engine
    from langchain_core.runnables.history import RunnableWithMessageHistory
except Exception as e:
    llmImport = False
    print("Error: ", e)
    raise


# llm model
llm_model = "deepseek-r1:7b"
# llm_model="llama3.1:8b"

# some important global parameters
model = None
model_ready = asyncio.Event()

llm = None
llm_ready = asyncio.Event()
summary_llm_ready = asyncio.Event()
llm_error: Optional[str] = None


memory_dict = {}
app_state = {} 

prompt = None
raw_chain = None

async_engine = create_async_engine("sqlite+aiosqlite:///chat_memory.db", echo=False)
chain_with_memory = None





# --- Pydantic Models for Summarization Output ---

class CustomSummary(BaseModel):
    """A structured summary with a name and content."""
    name: str = Field(description="A concise, descriptive name or title for the summary.")
    content: str = Field(
        description="The main body of the summary. Must be descriptive, match the name, and be derived exclusively from the provided conversation history."
    )



# --- Function to build the summarization chain ---
# In your main.py, replace the old create_summarization_chain function

# In your main.py, replace the old create_summarization_chain function

def create_summarization_chain():
    """Builds a chain that returns a structured CustomSummary object."""
    
    summarizer_llm = ChatOllama(model=llm_model, temperature=0)
    
    # Use with_structured_output with our new CustomSummary model
    structured_llm = summarizer_llm.with_structured_output(CustomSummary)
    
    # Update the prompt to instruct the LLM on the new 'name' and 'content' fields
    prompt = PromptTemplate.from_template("""
        You are an expert at creating concise, self-contained knowledge nodes from conversations.
        Your response MUST be a valid JSON object with the keys "name" and "content".

        The user's instruction is: {task_description}.
        When the instruction is to create a 'node', you must analyze the conversation below and distill its core ideas into a single summary.

        - The 'name' for the node should be a very short, descriptive title (under 5 words) that captures the main subject.
        - The 'content' for the node should be a clear and concise paragraph summarizing the key information, question, or conclusion from the text.

        Based ONLY on the provided text, generate the 'name' and 'content'.

        --- CONVERSATION START ---
        {formatted_memory}
        --- CONVERSATION END ---
    """)
    
    # The chain now ends with the structured output parser
    return prompt | structured_llm
@asynccontextmanager
async def lifespan(app: FastAPI):
    global model

    async def load_model():
        global model
        if model is None:
            local_path = "../__models__/embedding-model/models--sentence-transformers--all-mpnet-base-v2/snapshots/e8c3b32edf5434bc2275fc9bab85f82640a19130"
            if os.path.exists(local_path):
                print("✅ Loading model from local cache...")
                model = await asyncio.to_thread(lambda: SentenceTransformer(local_path))
                print("Model loaded!")
                model_ready.set()
            else:
                print("🌐 Downloading model from Hugging Face...")
                model = await asyncio.to_thread(
                    lambda: SentenceTransformer(
                        "all-mpnet-base-v2",
                        cache_folder="../__models__/embedding-model",
                    )
                )
                print("Model loaded!")
                model_ready.set()

    async def load_llm_and_parser():
        global llm, llm_error, prompt, raw_chain, chain_with_memory
        if llm is None:
            try:

                # ---------------------------
                # 2. LLM + Memory
                # ---------------------------
                llm = ChatOllama(
                    model=llm_model,
                    temperature=0,
                    disable_streaming=False,
                    num_ctx=4096,
                    verbose=True,
                    
                )
                print(f"ChatOllama context size has been set to: {llm.num_ctx}")

                def health_check():
                    resp = llm.invoke("hello")
                    return resp

                await asyncio.to_thread(health_check)
                print("LLM (LangChain ChatOllama) ready.")
                llm_ready.set()
                print("Ollama LLM ready.")

                # llm Prompt template

                # It's good practice to add dynamic data like the current date

                template = """
                    You are **WevN Assistant**, a versatile and helpful AI companion. 
                    Your job is to provide accurate, relevant, and natural answers.

                    ### Core Rules
                    1. First, check the `<retrieved_documents>` and `<chat_history>` for answers. If found, integrate them naturally.
                    2. If context is missing or insufficient, rely on your own knowledge.
                    3. Adapt your tone: friendly for casual chat, professional for technical topics.
                    4. Do not repeat the user’s question. Start directly with the answer.
                    5. Never output meta-reasoning or instructions.

                    ### Information Sources
                    - Chat history:
                    {conversation}

                    - Retrieved documents:
                    {context}

                    ### Task
                    User question: {question}

                    ### Response
                    Provide a clear, helpful answer below:
                    """

                prompt = PromptTemplate(
                    
                    template=template,
                    input_variables=["conversation", "context", "question"],
                )

                # llm structured chain
                core_chain = prompt | llm
                chain_with_memory = RunnableWithMessageHistory(
                    core_chain,
                    # This lambda function creates an ASYNC history object on the fly for each session
                    lambda session_id: SQLChatMessageHistory(
                        session_id=session_id,
                        connection=async_engine,
                    ),
                    input_messages_key="question",
                    history_messages_key="conversation",
                )

                print("✅ Chain with async memory history is ready.")
                print("LLM model:", llm.model)
                print("Initializing Summarization chain...")
                app.state.db_engine = async_engine
                summarization_chain = create_summarization_chain()
                app.state.summarization_chain = summarization_chain
                summary_llm_ready.set()
                print("✅ Summarization chain is ready.")

            except Exception as e:
                llm_error = e
                print("llm error : ", e)

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
    allow_headers=["*"],
    expose_headers=["X-Retrieved-Ids"],
)

API_KEY = "mysecretkey"


# --- Dependency ---
def verify_api_key(request: Request):
    key = request.headers.get("X-API-Key")
    if key != API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid API Key")
    
async def verify_llm_ready():

    if llm_error:
        raise HTTPException(status_code=503, detail=f"LLM not available: {llm_error}")




# -- token validate function --


def validate_token(token: str) -> bool:
    return token == "api-token"

async def get_history_by_session_id(session_id: str,db_engine) -> List[BaseMessage]:
    """
    Retrieves the conversation history for a specific session ID from the database.
    This function uses the global 'async_engine' defined during startup.
    """
    history_store = SQLChatMessageHistory(
        session_id=session_id,
        connection=async_engine,
    )
    messages = await history_store.aget_messages()
    return messages

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
    node_id: str
    name: str
    content: str
    user_links: Optional[List[str]]
    s_links: Optional[List[str]]


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


class ClearHistoryModel(BaseModel):
    conversation_id: str

# -- Pydantic Models -- this is the structure for each http request start with a Model suffix for each class

# --- ADD THESE NEW MODELS ---
class HistoryRequest(BaseModel):
    """The request body for getting a session's history."""
    session_id: str

class ResponseMessage(BaseModel):
    """Structures a single message for the API response."""
    type: str
    content: str

class SummarizeHistoryRequest(BaseModel):
    session_id: str
    query: Optional[str] = None
    collection: str
    max_results: Optional[int] = 10
    distance_threshold: Optional[float] = 1.4






# -- ChromaDB client --
client = chromadb.PersistentClient(path="db")


# -- Helper Functions --(boring stuff)


# -- embedding --
async def model_embedding(text: str) -> list[float]:
    await model_ready.wait()
    return await asyncio.to_thread(lambda: model.encode(text))


# -- fastapi endpoints --

# -- server GET requests --


# -- helth inquiry
@app.get("/health", dependencies=[Depends(verify_api_key)])
def health():
    return StatusModel(status="ok")


# -- list all collections --
@app.get("/collections/list", dependencies=[Depends(verify_api_key)])
def list_collection():
    try:
        collections = client.list_collections()
        return JSONResponse(
            content=[{"name": str(c.name), "id": str(c.id)} for c in collections]
        )

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Domain Listing Failed with error: {str(e)}"
        )


# -- list all nodes for a given collection --
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
            result.append(
                NodeOut(
                    node_id=node_id,
                    name=meta.get("name", ""),
                    content=doc,
                    user_links=user_links,
                    s_links=s_links,
                )
            )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to list nodes: {str(e)}")


@app.post("/nodes/refactor", dependencies=[Depends(verify_api_key)])
def refactor_nodes(
    payload: NodeSemanticRefactorModel, background_tasks: BackgroundTasks
):
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
                include=["distances"],
            )
            s_links = []
            for i, id in enumerate(q_result["ids"][0]):
                if (
                    id != node_id
                    and q_result["distances"][0][i] <= payload.distance_threshold
                ):
                    s_links.append(id)
            meta["s_links"] = json.dumps(s_links)
            meta_result.append(meta)
            id_result.append(node_id)

        collection.update(ids=id_result, metadatas=meta_result)
        background_tasks.add_task(notify_clients, "node")
        return StatusModel(
            status=f"Refactored semantic links for nodes in {payload.collection} Successfully."
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to refactored semantic links for nodes in  {payload.collection} - {str(e)}",
        )


# -- POST requests --

# TODO : create reafactor for semantic links.
# we have a max link and dist thereshold value. on insertion of a node :
# - check


# -- create  a new collection --
@app.post("/collections/create", dependencies=[Depends(verify_api_key)])
def create_collection(payload: CollectionNameModel, background_tasks: BackgroundTasks):
    try:
        client.create_collection(name=payload.name)
        background_tasks.add_task(notify_clients, "domain")
        return StatusModel(status=f"Created Domain {payload.name} Successfully.")
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Domain Creation Failed with error: {str(e)}"
        )


# -- delete a collection --
@app.post("/collections/delete", dependencies=[Depends(verify_api_key)])
def delete_collection(payload: CollectionNameModel, background_tasks: BackgroundTasks):
    try:
        client.delete_collection(payload.name)
        background_tasks.add_task(notify_clients, "domain")
        return StatusModel(status=f"Deleted Domain {payload.name} Successfully.")
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Domain Deletion Failed with error: {str(e)}"
        )


# -- rename a collection --
@app.post("/collections/rename", dependencies=[Depends(verify_api_key)])
def rename_collection(
    payload: CollectionRenameModel, background_tasks: BackgroundTasks
):
    try:
        collection = client.get_collection(payload.d_old)
        collection.modify(name=payload.d_new)
        background_tasks.add_task(notify_clients, "domain")
        return StatusModel(
            status=f"Renamed  Domain {payload.d_old} to {payload.d_new} Successfully."
        )
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Domain Rename Failed with error: {str(e)}"
        )



async def _create_node_logic(payload: NodeInputModel):
    """
    Core logic for creating a node in ChromaDB.
    This function can be called from anywhere.
    """
    collection = client.get_collection(payload.collection)
    embedding = await model_embedding(f"Name: {payload.name}. {payload.content}")
    node_id = str(uuid.uuid1())
    q_result = collection.query(
        query_embeddings=embedding,
        n_results=payload.max_links,
        include=["distances"],
    )

    s_links = []
    for i, id in enumerate(q_result["ids"][0]):
        if q_result["distances"][0][i] <= payload.distance_threshold:
            s_links.append(id)
    metadata = {
        "name": payload.name,
        "user_links": json.dumps(payload.user_links),
        "s_links": json.dumps(s_links),
    }
    collection.add(
        documents=[payload.content],
        ids=[node_id],
        embeddings=[embedding],
        metadatas=[metadata],
    )
    return node_id


# -- insert a node --
@app.post("/nodes/insert", dependencies=[Depends(verify_api_key)])
async def createNode(payload: NodeInputModel, background_tasks: BackgroundTasks):
    try:

        await _create_node_logic(payload)
        background_tasks.add_task(notify_clients, "node")
        return StatusModel(status=f"Added Node {payload.name} Successfully.")

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Node insertion failed with error: {str(e)}"
        )


@app.post("/nodes/update", dependencies=[Depends(verify_api_key)])
async def updateNode(payload: NodeUpdateModel, background_tasks: BackgroundTasks):
    try:
        collection = client.get_collection(payload.collection)
        embedding = await model_embedding(f"Name: {payload.name}. {payload.content}")
        q_result = collection.query(
            query_embeddings=embedding,
            n_results=payload.max_links,
            include=["distances"],
        )

        s_links = []
        for i, id in enumerate(q_result["ids"][0]):
            if q_result["distances"][0][i] <= payload.distance_threshold:
                s_links.append(id)
        metadata = {
            "name": payload.name,
            "user_links": json.dumps(payload.user_links),
            "s_links": json.dumps(s_links),
        }
        collection.update(
            documents=[payload.content],
            ids=[payload.node_id],
            embeddings=[embedding],
            metadatas=[metadata],
        )
        background_tasks.add_task(notify_clients, "node")
        return StatusModel(status=f"Updated Node {payload.name} Successfully.")

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Node Update failed with error: {str(e)}"
        )


@app.post("/nodes/delete", dependencies=[Depends(verify_api_key)])
async def deleteNode(payload: NodeDeleteModel, background_tasks: BackgroundTasks):
    try:
        collection = client.get_collection(payload.collection)
        collection.delete(ids=[payload.node_id])
        background_tasks.add_task(notify_clients, "node")
        return StatusModel(status=f"Deleted Node Successfully.")

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Node delete failed with error: {str(e)}"
        )


@app.post("/query/stream", dependencies=[Depends(verify_api_key) , Depends(verify_llm_ready)])
async def query_stream(payload: QueryModel):
    retrieved_docs = []
    retrieved_ids = []
    context = "No relevant context found."
    print(f"distance Threshold: {payload.distance_threshold}, maxlinks: {payload.max_results}")

    try:
        collection = client.get_collection(payload.collection)
        q_embedding = await model_embedding(payload.query)

        q_result = collection.query(
            query_embeddings=q_embedding,
            n_results=payload.max_results,
            include=["documents", "distances", "metadatas"],
        )

        # filter by distance threshold
        for i, doc in enumerate(q_result["documents"][0]):
            if q_result["distances"][0][i] <= payload.distance_threshold:
                retrieved_docs.append(doc)
                retrieved_ids.append(q_result["ids"][0][i])

        if retrieved_docs:
            context = "\n\n".join(retrieved_docs)

    except Exception as e:
        print("Failed to load context:", e)

    async def event_generator():
        try:
            await llm_ready.wait()
            # The config dictionary tells RunnableWithMessageHistory which session to use.
            # It will automatically load history and save the new Q&A pair.
            config = {"configurable": {"session_id": payload.conversation_id}}
            # Call the chain directly. No more manual memory management!
            async for chunk in chain_with_memory.astream(
                {"question": payload.query, "context": context},
                config=config,
            ):
                if chunk.content:
                    yield chunk.content
        except Exception as e:
            yield f"\n\n[ERROR]: {str(e)}"

    headers = {"X-Retrieved-Ids": json.dumps(retrieved_ids)}

    try:
        return StreamingResponse(
            event_generator(), media_type="text/plain", headers=headers
        )
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"LLM query failed with error: {str(e)}"
        )

# @app.post("/history/get", dependencies=[Depends(verify_api_key)], response_model=List[ResponseMessage])
# async def get_history(payload: HistoryRequest):
#     """
#     API endpoint to retrieve conversation history for a given session_id.
#     """
#     session_id = payload.session_id
#     print(f"\nReceived request to fetch history for session_id: '{session_id}'")

#     try:
#         # Call the retriever function
#         messages = await get_history_by_session_id(session_id)

#         # Print the raw messages to the server console
#         print("\n--- Raw Messages from Store ---")
#         for msg in messages:
#             print(msg)
        
#         # Format the messages for the JSON API response
#         response_data = [{"type": msg.type, "content": msg.content} for msg in messages]
#         return response_data
        
#     except Exception as e:
#         raise HTTPException(
#             status_code=500, detail=f"Failed to retrieve history: {str(e)}"
#         )




@app.post("/history/summarize", dependencies=[Depends(verify_api_key)], response_model=CustomSummary)
async def summarize_history(request: Request, payload: SummarizeHistoryRequest, background_tasks: BackgroundTasks):
    """
    Summarizes a conversation history and returns a single, structured JSON object.
    If a query is provided, the summary is targeted. Otherwise, a general summary is created.
    """
    session_id = payload.session_id
    query = payload.query
    
    print(f"\nReceived request to summarize history for session_id: '{session_id}'")

    try:
        await summary_llm_ready.wait()
        db_engine = request.app.state.db_engine
        summarization_chain = request.app.state.summarization_chain

        history_messages = await get_history_by_session_id(session_id, db_engine)
        if not history_messages:
            raise HTTPException(status_code=404, detail="No history found for this session_id.")

        formatted_memory = "\n".join([f"{msg.type.capitalize()}: {msg.content}" for msg in history_messages])
        
        if query:
            task_description = f"create a detailed summary focused specifically on: '{query}'"
        else:
            task_description = "create a concise, general summary of the entire conversation"
        
        # Invoke the chain ONCE and await the final Pydantic object
        summary_response = await summarization_chain.ainvoke({
            "formatted_memory": formatted_memory,
            "task_description": task_description
        })

        print("Creating a new node from the summary...")
        try:
            new_node_payload = NodeInputModel(
                collection=payload.collection, # Or wherever you want to save it
                name=summary_response.name,
                content=summary_response.content,
                user_links=[],
                distance_threshold=payload.distance_threshold, # Default values
                max_links=payload.max_results
            )
            
            # Call the same reusable logic function
            new_node_id = await _create_node_logic(new_node_payload)
            
            # You have access to background_tasks here, so you can use it
            background_tasks.add_task(notify_clients, "node")
            
            print(f"Successfully created summary node with ID: {new_node_id}")

        except Exception as e:
            print(f"Warning: Failed to create summary node. Error: {e}")
        
        # Return the Pydantic object directly. FastAPI handles the JSON conversion.
        return summary_response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")



@app.post("/history/clear", dependencies=[Depends(verify_api_key)])
async def clear_history(payload: ClearHistoryModel):
    """
    Clears the entire conversation history for a given session_id.
    """
    try:
        # 1. Get an instance of the history backend for the specific conversation
        history = SQLChatMessageHistory(
            session_id=payload.conversation_id,
            connection=async_engine,
        )

        # 2. Call the async clear() method
        await history.aclear()

        # Optional: Remove the memory object from the in-memory cache if you want
        if payload.conversation_id in memory_dict:
            del memory_dict[payload.conversation_id]

        return StatusModel(
            status=f"History for conversation_id '{payload.conversation_id}' has been cleared."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to clear history: {str(e)}"
        )
