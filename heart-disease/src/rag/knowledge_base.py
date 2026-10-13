"""
Distilled knowledge base + in-memory RAG retrieval for CardioSense's chat
assistant.

The corpus (src/rag/corpus/*.md) is small and hand-curated on purpose: a
feature glossary, an explanation of how scores/risk levels are computed, a
dataset/model overview, and general safety guidance. Because it's small
(a handful of markdown files), we don't need a heavyweight vector database —
documents are split into paragraph-level chunks, embedded once via the local
Ollama embedding model, and cached in memory for cosine-similarity search.
"""

from __future__ import annotations

import re
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import List

import numpy as np

from src.rag.ollama_client import embed, OllamaUnavailableError

CORPUS_DIR = Path(__file__).resolve().parent / "corpus"


@dataclass
class Chunk:
    source: str       # file name (used as a citation)
    heading: str       # nearest markdown heading
    text: str
    embedding: np.ndarray


_index: List[Chunk] | None = None
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


def build_index() -> List[Chunk]:
    """
    Embed every chunk of every corpus document via Ollama and return the
    list of Chunk objects. Raises OllamaUnavailableError if embedding fails
    (e.g. Ollama isn't running) — callers should handle this gracefully.
    """
    chunks: List[Chunk] = []
    for path in sorted(CORPUS_DIR.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        for heading, chunk_text in _split_into_chunks(text, path.stem):
            vector = np.array(embed(chunk_text), dtype=np.float32)
            chunks.append(Chunk(source=path.stem, heading=heading, text=chunk_text, embedding=vector))
    return chunks


def get_index(force_rebuild: bool = False) -> List[Chunk]:
    """Lazily build (and cache) the in-memory chunk index."""
    global _index
    with _index_lock:
        if _index is None or force_rebuild:
            _index = build_index()
        return _index


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    denom = (np.linalg.norm(a) * np.linalg.norm(b)) or 1e-9
    return float(np.dot(a, b) / denom)


def retrieve(query: str, top_k: int = 4) -> List[Chunk]:
    """Return the top_k most relevant chunks for *query* (cosine similarity)."""
    index = get_index()
    if not index:
        return []
    query_vec = np.array(embed(query), dtype=np.float32)
    scored = [(c, _cosine_similarity(query_vec, c.embedding)) for c in index]
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return [c for c, _score in scored[:top_k]]


__all__ = ["Chunk", "build_index", "get_index", "retrieve", "OllamaUnavailableError"]
