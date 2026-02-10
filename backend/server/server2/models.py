
from pydantic import BaseModel, Field
from typing import List, Optional

# --- Pydantic Models for Summarization Output ---

class CustomSummary(BaseModel):
    """A structured summary with a name and content."""
    name: str = Field(description="A concise, descriptive name or title for the summary.")
    content: str = Field(
        description="The main body of the summary. Must be descriptive, match the name, and be derived exclusively from the provided conversation history."
    )

class StatusModel(BaseModel):
    status: str

class NodeOut(BaseModel):
    node_id: str
    name: str
    content: str
    user_links: Optional[List[str]]
    s_links: Optional[List[str]]

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

class QueryModel(BaseModel):
    collection: str
    query: str
    conversation_id: str
    max_results: Optional[int] = 10
    distance_threshold: Optional[float] = 1.4

class ClearHistoryModel(BaseModel):
    conversation_id: str

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

class SummaryReturnModel(BaseModel):
    name: str
    content: str
    id : str
