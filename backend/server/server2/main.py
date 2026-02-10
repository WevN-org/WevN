
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from .llm import load_model, load_llm_and_parser
from .routes import router
from .websockets import websocket_endpoint

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles application startup logic."""
    
    # Start the loading tasks concurrently
    asyncio.create_task(load_model())
    asyncio.create_task(load_llm_and_parser(app)) # Pass app to set state

    yield  # ⚠️ This is required! The app runs after this point.

    print("Server shutting down")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Retrieved-Ids"],
)

app.include_router(router)
app.add_api_websocket_route("/ws", websocket_endpoint)
