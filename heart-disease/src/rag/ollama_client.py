"""
Thin HTTP client for a locally running Ollama server.

CardioSense's "Ask CardioSense" chat feature runs entirely on-machine:
no API keys, no third-party LLM calls. Ollama (https://ollama.com) must be
installed and running locally (`ollama serve`, or it auto-starts as a
service after install), with the chat and embedding models pulled:

    ollama pull llama3.2:1b
    ollama pull nomic-embed-text

All settings are overridable via environment variables so a deployment can
point at a different model or a remote Ollama instance.
"""

from __future__ import annotations

import os
from typing import List

import httpx

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "llama3.2:1b")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

_TIMEOUT = httpx.Timeout(60.0, connect=5.0)


class OllamaUnavailableError(RuntimeError):
    """Raised when the local Ollama server cannot be reached or errors out."""


def is_available() -> bool:
    """Quick reachability check against the Ollama server (used by /chat/health)."""
    try:
        with httpx.Client(timeout=httpx.Timeout(3.0, connect=2.0)) as client:
            resp = client.get(f"{OLLAMA_BASE_URL}/api/tags")
            return resp.status_code == 200
    except httpx.HTTPError:
        return False


def list_models() -> List[str]:
    """Return installed model names (empty list if Ollama is unreachable)."""
    try:
        with httpx.Client(timeout=httpx.Timeout(3.0, connect=2.0)) as client:
            resp = client.get(f"{OLLAMA_BASE_URL}/api/tags")
            resp.raise_for_status()
            return [m["name"] for m in resp.json().get("models", [])]
    except httpx.HTTPError:
        return []


def embed(text: str) -> List[float]:
    """Return an embedding vector for *text* using OLLAMA_EMBED_MODEL."""
    try:
        with httpx.Client(timeout=_TIMEOUT) as client:
            resp = client.post(
                f"{OLLAMA_BASE_URL}/api/embeddings",
                json={"model": OLLAMA_EMBED_MODEL, "prompt": text},
            )
            resp.raise_for_status()
            embedding = resp.json().get("embedding")
            if not embedding:
                raise OllamaUnavailableError("Ollama returned an empty embedding.")
            return embedding
    except httpx.HTTPError as exc:
        raise OllamaUnavailableError(
            f"Could not reach Ollama at {OLLAMA_BASE_URL} for embeddings: {exc}"
        ) from exc


def generate(prompt: str, system: str | None = None) -> str:
    """Generate a single-turn completion from OLLAMA_CHAT_MODEL."""
    payload = {
        "model": OLLAMA_CHAT_MODEL,
        "prompt": prompt,
        "stream": False,
    }
    if system:
        payload["system"] = system

    try:
        with httpx.Client(timeout=_TIMEOUT) as client:
            resp = client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
            resp.raise_for_status()
            return resp.json().get("response", "").strip()
    except httpx.HTTPError as exc:
        raise OllamaUnavailableError(
            f"Could not reach Ollama at {OLLAMA_BASE_URL} for generation: {exc}"
        ) from exc
