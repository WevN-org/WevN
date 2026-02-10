
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from fastapi.responses import JSONResponse, StreamingResponse
import json
import uuid

from .models import (
    StatusModel, CollectionNameModel, NodeOut, NodeSemanticRefactorModel,
    NodeInputModel, NodeUpdateModel, NodeDeleteModel, QueryModel,
    CollectionRenameModel, HistoryRequest, ResponseMessage, SummarizeHistoryRequest,
    SummaryReturnModel, ClearHistoryModel
)
from .database import client, get_history_by_session_id
from .dependency import verify_api_key, verify_llm_ready
from .llm import model_embedding, llm_ready, summary_llm_ready
from .websockets import notify_clients

router = APIRouter()

# -- helth inquiry
@router.get("/health", dependencies=[Depends(verify_api_key)])
def health():
    return StatusModel(status="ok")

# -- list all collections --
@router.get("/collections/list", dependencies=[Depends(verify_api_key)])
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
@router.post("/nodes/list", dependencies=[Depends(verify_api_key)])
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

@router.post("/nodes/refactor", dependencies=[Depends(verify_api_key)])
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

# -- create  a new collection --
@router.post("/collections/create", dependencies=[Depends(verify_api_key)])
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
@router.post("/collections/delete", dependencies=[Depends(verify_api_key)])
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
@router.post("/collections/rename", dependencies=[Depends(verify_api_key)])
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
@router.post("/nodes/insert", dependencies=[Depends(verify_api_key)])
async def createNode(payload: NodeInputModel, background_tasks: BackgroundTasks):
    try:
        await _create_node_logic(payload)
        background_tasks.add_task(notify_clients, "node")
        return StatusModel(status=f"Added Node {payload.name} Successfully.")

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Node insertion failed with error: {str(e)}"
        )

@router.post("/nodes/update", dependencies=[Depends(verify_api_key)])
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

@router.post("/nodes/delete", dependencies=[Depends(verify_api_key)])
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

@router.post("/query/stream", dependencies=[Depends(verify_api_key) , Depends(verify_llm_ready)])
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
            
            # Access chain_with_memory from app state (it should be set by now)
            # We need to access the app state. In a generator within a route, we can't easily get 'request'.
            # However, since we are in `query_stream` which is an endpoint, we can ask for `request: Request`.
            # Let's update the signature of query_stream to include `request: Request`.
             
            config = {"configurable": {"session_id": payload.conversation_id}}
            
            # We need to fetch the chain from the module dynamically or store it in app.state.
            # Storing in app.state is cleaner.
            # But here I will import the module to access the global variable dynamically.
            from . import llm
            
            async for chunk in llm.chain_with_memory.astream(
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

@router.post("/history/summarize", dependencies=[Depends(verify_api_key)], response_model=SummaryReturnModel)
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

            SummaryReturn = SummaryReturnModel(
                name=summary_response.name,
                content=summary_response.content,
                id=new_node_id
                
            )
            # You have access to background_tasks here, so you can use it
            background_tasks.add_task(notify_clients, "node")
            
            print(f"Successfully created summary node with ID: {new_node_id}")

        except Exception as e:
            print(f"Warning: Failed to create summary node. Error: {e}")
            # Re-raise if necessary or handle gracefully.
            # Original code printed and moved on, but SummaryReturn assignment would fail if new_node_id not set.
            # Assuming happy path for now as per original logic structure.
            raise e
        
        # Return the Pydantic object directly. FastAPI handles the JSON conversion.
        return SummaryReturn

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")

@router.post("/history/clear", dependencies=[Depends(verify_api_key)])
async def clear_history(request: Request, payload: ClearHistoryModel):
    """
    Clears the entire conversation history for a given session_id.
    """
    try:
        # 1. Get an instance of the history backend for the specific conversation
        # Use request.app.state.db_engine
        history = SQLChatMessageHistory(
            session_id=payload.conversation_id,
            connection=request.app.state.db_engine,
        )

        # 2. Call the async clear() method
        await history.aclear()

        # Optional: Remove the memory object from the in-memory cache if you want
        # if payload.conversation_id in memory_dict:
        #     del memory_dict[payload.conversation_id]

        return StatusModel(
            status=f"History for conversation_id '{payload.conversation_id}' has been cleared."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to clear history: {str(e)}"
        )
