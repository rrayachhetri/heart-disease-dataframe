"""
Distilled knowledge base + in-memory RAG retrieval for CardioSense's chat
assistant.

The corpus (src/rag/corpus/*.md) is small and hand-curated on purpose: a
feature glossary, an explanation of how scores/risk levels are computed, a
dataset/model overview, and general safety guidance. Because it's small, we
don't need a vector database — documents are split into paragraph-level
chunks, embedded in one batched call, cached on disk (keyed by corpus
content + embed model) and held in memory as a normalized matrix for fast
cosine-similarity search.
"""

from __future__ import annotations

import hashlib
import re
import threading
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import List

import numpy as np

from src.rag import ollama_client
from src.rag.ollama_client import embed, embed_many, OllamaUnavailableError

CORPUS_DIR = Path(__file__).resolve().parent / "corpus"
CACHE_DIR = Path(__file__).resolve().parent / ".cache"


@dataclass
class Chunk:
    source: str       # file name (used as a citation)
    heading: str      # nearest markdown heading
    text: str
    embedding: np.ndarray


_index: List[Chunk] | None = None
_matrix: np.ndarray | None = None
_index_lock = threading.Lock()


def _split_into_chunks(markdown_text: str, source: str) -> List[tuple[str, str]]:
    """Split a markdown document into (heading, paragraph) chunks."""
    chunks: List[tuple[str, str]] = []
    current_heading = source
    current_lines: List[str] = []

    def flush():
        text = "\n".join(current_lines).strip()
        if text:
            chunks.append((current_heading, text))

    for line in markdown_text.splitlines():
        heading_match = re.match(r"^#{1,6}\s+(.*)", line)
        if heading_match:
            flush()
            current_lines.clear()
            current_heading = heading_match.group(1).strip()
        elif line.strip() == "" and current_lines:
            flush()
            current_lines.clear()
        else:
            current_lines.append(line)
    flush()
    return chunks


def _corpus_chunks() -> List[tuple[str, str, str]]:
    out = []
    for path in sorted(CORPUS_DIR.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        for heading, chunk_text in _split_into_chunks(text, path.stem):
            out.append((path.stem, heading, chunk_text))
    return out


def _cache_key(items: List[tuple[str, str, str]]) -> str:
    h = hashlib.sha256(ollama_client.OLLAMA_EMBED_MODEL.encode())
    for item in items:
        h.update("\x00".join(item).encode())
    return h.hexdigest()


def build_index() -> List[Chunk]:
    """
    Build the chunk index. Embeddings come from the disk cache when the corpus
    and embed model are unchanged; otherwise all chunks are embedded in a
    single batched call and the cache is refreshed.
    Raises OllamaUnavailableError if embedding is needed but Ollama is down.
    """
    items = _corpus_chunks()
    key = _cache_key(items)
    cache_file = CACHE_DIR / "index.npz"

    vectors = None
    if cache_file.exists():
        try:
            with np.load(cache_file, allow_pickle=False) as data:
                if str(data["key"]) == key:
                    vectors = data["vectors"]
        except Exception:
            vectors = None

    if vectors is None:
        vectors = np.array(embed_many([t for _s, _h, t in items]), dtype=np.float32)
        try:
            CACHE_DIR.mkdir(exist_ok=True)
            np.savez(cache_file, key=np.array(key), vectors=vectors)
        except OSError:
            pass

    return [
        Chunk(source=s, heading=h, text=t, embedding=vectors[i])
        for i, (s, h, t) in enumerate(items)
    ]


def get_index(force_rebuild: bool = False) -> List[Chunk]:
    """Lazily build (and cache) the in-memory chunk index."""
    global _index, _matrix
    with _index_lock:
        if _index is None or force_rebuild:
            index = build_index()
            if index:
                m = np.stack([c.embedding for c in index])
                norms = np.linalg.norm(m, axis=1, keepdims=True)
                _matrix = m / np.where(norms == 0, 1e-9, norms)
            _index = index
        return _index


@lru_cache(maxsize=256)
def _embed_query(query: str) -> tuple:
    return tuple(embed(query))


def retrieve(query: str, top_k: int = 3) -> List[Chunk]:
    """Return the top_k most relevant chunks for *query* (cosine similarity)."""
    index = get_index()
    if not index or _matrix is None:
        return []
    q = np.array(_embed_query(query.strip().lower()), dtype=np.float32)
    q /= (np.linalg.norm(q) or 1e-9)
    top = np.argsort(-(_matrix @ q))[:top_k]
    return [index[i] for i in top]


def warm_up() -> None:
    """Pre-build the index; silent if Ollama isn't available yet."""
    try:
        get_index()
    except OllamaUnavailableError:
        pass


__all__ = ["Chunk", "build_index", "get_index", "retrieve", "warm_up", "OllamaUnavailableError"]
