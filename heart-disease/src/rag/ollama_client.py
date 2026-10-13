"""
Thin HTTP client for a locally running Ollama server.

CardioSense's "Ask CardioSense" chat feature runs entirely on-machine:
no API keys, no third-party LLM calls. Ollama (https://ollama.com) must be
installed and running locally (`ollama serve`, or it auto-starts as a
service after install), with the chat and embedding models pulled:

    ollama pull llama3.2:1b
    ollama pull nomic-embed-text

IMPORTANT: OLLAMA_BASE_URL must be localhost or 127.0.0.1 to ensure user
prediction data (probability, health features) never leaves the machine.
Remote Ollama instances are not supported to preserve privacy.
"""

from __future__ import annotations

import json
import os
import threading
from typing import Iterator, List
from urllib.parse import urlparse

import httpx

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "llama3.2:1b")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")


def _validate_base_url(url: str) -> None:
    """Ensure Ollama is only accessed locally to protect user data privacy."""
    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    if hostname.lower() not in ("localhost", "127.0.0.1", "::1"):
        raise ValueError(
            f"OLLAMA_BASE_URL must be localhost (not '{hostname}'). "
            "Remote Ollama instances are not supported to prevent prediction data "
            "and health features from leaving the machine."
        )


_validate_base_url(OLLAMA_BASE_URL)

# Keep models resident between requests (Ollama's default is 5 minutes) and
# cap output length / context so small local models answer quickly.
OLLAMA_KEEP_ALIVE = os.getenv("OLLAMA_KEEP_ALIVE", "30m")
OLLAMA_NUM_PREDICT = int(os.getenv("OLLAMA_NUM_PREDICT", "220"))
OLLAMA_NUM_CTX = int(os.getenv("OLLAMA_NUM_CTX", "2048"))

_TIMEOUT = httpx.Timeout(60.0, connect=5.0)

# One pooled client => keep-alive connections, no per-request TCP setup.
_client: httpx.Client | None = None
_client_lock = threading.Lock()


def _get_client() -> httpx.Client:
    global _client
    with _client_lock:
        if _client is None:
            _client = httpx.Client(base_url=OLLAMA_BASE_URL, timeout=_TIMEOUT)
        return _client


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
        resp = _get_client().post(
            "/api/embeddings",
            json={"model": OLLAMA_EMBED_MODEL, "prompt": text, "keep_alive": OLLAMA_KEEP_ALIVE},
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


def embed_many(texts: List[str]) -> List[List[float]]:
    """Embed several texts in a single round trip (falls back to one-by-one)."""
    if not texts:
        return []
    try:
        resp = _get_client().post(
            "/api/embed",
            json={"model": OLLAMA_EMBED_MODEL, "input": texts, "keep_alive": OLLAMA_KEEP_ALIVE},
        )
        if resp.status_code == 404:  # older Ollama without /api/embed
            return [embed(t) for t in texts]
        resp.raise_for_status()
        vectors = resp.json().get("embeddings") or []
        if len(vectors) != len(texts):
            raise OllamaUnavailableError("Ollama returned a mismatched embedding batch.")
        return vectors
    except httpx.HTTPError as exc:
        raise OllamaUnavailableError(
            f"Could not reach Ollama at {OLLAMA_BASE_URL} for embeddings: {exc}"
        ) from exc


def _payload(prompt: str, system: str | None, stream: bool) -> dict:
    payload = {
        "model": OLLAMA_CHAT_MODEL,
        "prompt": prompt,
        "stream": stream,
        "keep_alive": OLLAMA_KEEP_ALIVE,
        "options": {
            "num_predict": OLLAMA_NUM_PREDICT,
            "num_ctx": OLLAMA_NUM_CTX,
            "temperature": 0.3,
        },
    }
    if system:
        payload["system"] = system
    return payload


def generate(prompt: str, system: str | None = None) -> str:
    """Generate a single-turn completion from OLLAMA_CHAT_MODEL."""
    try:
        resp = _get_client().post("/api/generate", json=_payload(prompt, system, False))
        resp.raise_for_status()
        return resp.json().get("response", "").strip()
    except httpx.HTTPError as exc:
        raise OllamaUnavailableError(
            f"Could not reach Ollama at {OLLAMA_BASE_URL} for generation: {exc}"
        ) from exc


def generate_stream(prompt: str, system: str | None = None) -> Iterator[str]:
    """Yield completion tokens as they are produced."""
    try:
        with _get_client().stream(
            "POST", "/api/generate", json=_payload(prompt, system, True)
        ) as resp:
            resp.raise_for_status()
            for line in resp.iter_lines():
                if not line:
                    continue
                data = json.loads(line)
                if data.get("response"):
                    yield data["response"]
                if data.get("done"):
                    break
    except httpx.HTTPError as exc:
        raise OllamaUnavailableError(
            f"Could not reach Ollama at {OLLAMA_BASE_URL} for generation: {exc}"
        ) from exc


def warm_up() -> None:
    """Load both models into memory so the first user question isn't slow."""
    try:
        embed("warm up")
        _get_client().post(
            "/api/generate",
            json={
                "model": OLLAMA_CHAT_MODEL,
                "prompt": "",
                "keep_alive": OLLAMA_KEEP_ALIVE,
                "stream": False,
            },
        )
    except (httpx.HTTPError, OllamaUnavailableError):
        pass
