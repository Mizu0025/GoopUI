from __future__ import annotations

import os
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DEFAULT_OLLAMA_URL = "http://localhost:11434"

class ChatMessage(BaseModel):
    role: str = Field(description="Allowed roles: system, user, assistant")
    content: str


class ChatRequest(BaseModel):
    model: str
    messages: list[ChatMessage]
    stream: bool = False
    options: dict[str, Any] | None = None


class ChatResponseChunk(BaseModel):
    model: str
    created_at: str | None = None
    message: ChatMessage | None = None
    done: bool
    total_duration: int | None = None
    load_duration: int | None = None
    prompt_eval_count: int | None = None
    eval_count: int | None = None


def create_app() -> FastAPI:
    load_dotenv()
    ollama_url = os.getenv("OLLAMA_URL", DEFAULT_OLLAMA_URL)

    app = FastAPI(title="GoopUI Ollama Backend")

    allowed_origins = os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:5173,http://localhost:3000")
    origins = [origin.strip() for origin in allowed_origins.split(",") if origin.strip()]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    async def get_client() -> httpx.AsyncClient:
        if not hasattr(app.state, "client"):
            timeout = httpx.Timeout(60.0, connect=5.0)
            app.state.client = httpx.AsyncClient(base_url=ollama_url, timeout=timeout)
        return app.state.client

    @app.on_event("shutdown")
    async def shutdown_event() -> None:
        client = getattr(app.state, "client", None)
        if client:
            await client.aclose()

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/models")
    async def list_models() -> Any:
        client = await get_client()
        try:
            response = await client.get("/api/tags")
            response.raise_for_status()
        except httpx.HTTPError as exc:  # pragma: no cover - network failure branch
            raise HTTPException(status_code=502, detail=f"Failed to reach Ollama: {exc}") from exc
        return response.json()

    @app.post("/api/chat")
    async def chat(request: ChatRequest) -> Any:
        client = await get_client()
        payload = request.model_dump(exclude_none=True)
        try:
            response = await client.post("/api/chat", json=payload)
            response.raise_for_status()
        except httpx.HTTPError as exc:  # pragma: no cover - network failure branch
            raise HTTPException(status_code=502, detail=f"Failed to reach Ollama: {exc}") from exc
        data = response.json()
        if request.stream:
            return data
        return ChatResponseChunk(**data)

    return app


app = create_app()
