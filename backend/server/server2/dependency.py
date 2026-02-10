
from fastapi import Request, HTTPException, status
from .config import API_KEY
from .llm import llm_error

def verify_api_key(request: Request):
    key = request.headers.get("X-API-Key")
    if key != API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid API Key")

async def verify_llm_ready():
    if llm_error:
        raise HTTPException(status_code=503, detail=f"LLM not available: {llm_error}")

def validate_token(token: str) -> bool:
    return token == "api-token"
