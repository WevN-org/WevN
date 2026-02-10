
import os
from dotenv import load_dotenv

load_dotenv()

# Embedding Model
LLM_IMPORT = True
try:
    from langchain_groq import ChatGroq
    from langchain_openai import ChatOpenAI
    from langchain_core.prompts import PromptTemplate
    from langchain_core.messages import BaseMessage
    from pydantic import BaseModel, Field
    from typing import Optional
    from langchain_community.chat_message_histories import SQLChatMessageHistory
    from sqlalchemy.ext.asyncio import create_async_engine
    from langchain_core.runnables.history import RunnableWithMessageHistory
except Exception as e:
    LLM_IMPORT = False
    print("Error: ", e)
    # Don't raise here, allow partial import if just running non-LLM parts?
    # But original code raised.
    # raise

LLM_MODEL = os.getenv("MODEL_NAME", "llama3-8b-8192")

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "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")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE_URL", "https://openrouter.ai/api/v1")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

API_KEY = "mysecretkey"
