
import chromadb
from sqlalchemy.ext.asyncio import create_async_engine
from langchain_community.chat_message_histories import SQLChatMessageHistory
from langchain_core.messages import BaseMessage
from typing import List

# -- ChromaDB client --
client = chromadb.PersistentClient(path="db")

# -- Helper Functions --

async_engine = create_async_engine("sqlite+aiosqlite:///db/chat_memory.db", echo=False)

async def get_history_by_session_id(session_id: str, db_engine) -> List[BaseMessage]:
    """
    Retrieves the conversation history for a specific session ID from the database.
    This function uses the global 'async_engine' defined during startup.
    """
    history_store = SQLChatMessageHistory(
        session_id=session_id,
        connection=db_engine,
    )
    messages = await history_store.aget_messages()
    return messages
