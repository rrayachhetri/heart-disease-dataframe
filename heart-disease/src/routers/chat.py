"""
Chat router — "Ask CardioSense".

Lets a user ask natural-language questions about a specific prediction
result. Answers are grounded in two sources:

1. The user's own prediction facts (probability, risk level, top factors,
   population percentiles) — either looked up from the database by
   `prediction_id` (authenticated, owns the record) or passed inline as
   `context` (anonymous / not-yet-saved result).
2. A small, distilled knowledge corpus (src/rag/corpus) retrieved via
   in-memory cosine-similarity RAG — feature definitions, how scores are
   computed, dataset/model limitations, and general safety guidance.

The LLM itself runs locally via Ollama — no data leaves the machine.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from src.db.database import get_db
from src.db.models import Prediction
from src.auth.routes import get_optional_user
from src.rag import ollama_client
from src.rag.knowledge_base import retrieve, OllamaUnavailableError
from src.models.explain import FEATURE_LABELS

router = APIRouter(prefix="/chat", tags=["chat"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class PredictionContext(BaseModel):
    """Inline prediction facts, used when the result hasn't been persisted
    (e.g. anonymous users) or the caller already has the result in hand."""
    probability: float
    prediction: int
    risk_level: str
    top_factors: List[Dict[str, Any]] = []
    population_percentiles: List[Dict[str, Any]] = []
    features: Optional[Dict[str, float]] = None

    @field_validator("probability")
    @classmethod
    def validate_probability(cls, v: float) -> float:
        if not (0 <= v <= 1):
            raise ValueError("probability must be 0-1")
        return v

    @field_validator("features")
    @classmethod
    def validate_features_size(cls, v: Optional[Dict[str, float]]) -> Optional[Dict[str, float]]:
        if v and len(str(v)) > 2000:
            raise ValueError("features context too large (>2000 chars)")
        return v



class ChatRequest(BaseModel):
    question: str
    prediction_id: Optional[str] = None
    context: Optional[PredictionContext] = None

    @field_validator("question")
    @classmethod
    def validate_question_length(cls, v: str) -> str:
        if not v or len(v) > 1000:
            raise ValueError("question must be 1-1000 characters")
        return v.strip()



class ChatSource(BaseModel):
    source: str
    heading: str


class ChatResponse(BaseModel):
    answer: str
    sources: List[ChatSource] = []
    grounded_in_prediction: bool


class ChatHealthResponse(BaseModel):
    available: bool
    chat_model: str
    embed_model: str
    models_installed: List[str]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _format_prediction_context(ctx: PredictionContext) -> str:
    pct = round(ctx.probability * 100, 1)
    lines = [
        f"- Risk level: {ctx.risk_level} ({pct}% predicted probability)",
    ]
    if ctx.features:
        feature_bits = ", ".join(
            f"{FEATURE_LABELS.get(k, k)}={v}" for k, v in ctx.features.items()
        )
        lines.append(f"- Submitted values: {feature_bits}")
    if ctx.top_factors:
        factor_bits = []
        for f in ctx.top_factors[:6]:
            direction = "increases" if f.get("direction") == "increases_risk" else "decreases"
            factor_bits.append(f"{f.get('label', f.get('feature'))} ({direction} risk)")
        lines.append("- Top contributing factors: " + "; ".join(factor_bits))
    if ctx.population_percentiles:
        pct_bits = []
        for p in ctx.population_percentiles[:6]:
            combined = p.get("percentiles", {}).get("combined")
            if combined is not None:
                pct_bits.append(f"{p.get('label', p.get('feature'))} at the {round(combined)}th percentile")
        if pct_bits:
            lines.append("- Population comparison: " + "; ".join(pct_bits))
    return "\n".join(lines)


def _resolve_context(
    body: ChatRequest, db: Session, current_user,
) -> Optional[PredictionContext]:
    if body.prediction_id:
        record = db.query(Prediction).filter(Prediction.id == body.prediction_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Prediction not found")
        if current_user is None or record.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this prediction")
        # Recompute top factors and percentiles from the stored result
        # so the assistant can explain the reasoning for this prediction.
        try:
            from src.models.explain import explain_prediction
            features_dict = json.loads(record.features_json)
            top_factors, pop_pctls = explain_prediction(
                record.prediction, record.risk_score, features_dict
            )
        except Exception:
            top_factors, pop_pctls = [], []
        
        return PredictionContext(
            probability=record.risk_score,
            prediction=record.prediction,
            risk_level=record.risk_level,
            features=json.loads(record.features_json),
            top_factors=top_factors,
            population_percentiles=pop_pctls,
        )
    return body.context


_SYSTEM_PROMPT = (
    "You are the 'Ask CardioSense' assistant embedded in the CardioSense "
    "heart-disease risk app. Answer the user's question using ONLY the "
    "'Prediction facts' and 'Reference knowledge' provided below — do not "
    "invent clinical facts beyond them. Be concise (3-6 sentences), plain-"
    "language, and always:\n"
    "- Make clear this is an educational research tool, not a diagnosis.\n"
    "- Encourage discussing results with a licensed clinician.\n"
    "- If the question describes emergency symptoms (e.g. chest pain, "
    "shortness of breath), tell the user to seek emergency care immediately.\n"
    "- If you don't have enough information to answer, say so honestly."
)


def _build_prompt(question: str, ctx: Optional[PredictionContext], chunks) -> str:
    parts = []
    if ctx:
        parts.append("Prediction facts:\n" + _format_prediction_context(ctx))
    else:
        parts.append("Prediction facts: none provided for this question.")

    if chunks:
        knowledge_block = "\n\n".join(f"[{c.source}: {c.heading}]\n{c.text}" for c in chunks)
        parts.append("Reference knowledge:\n" + knowledge_block)

    parts.append(f"User question: {question}")
    return "\n\n".join(parts)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/health", response_model=ChatHealthResponse)
def chat_health():
    """Public — lets the UI show a friendly 'assistant unavailable' state."""
    models = ollama_client.list_models()
    return ChatHealthResponse(
        available=ollama_client.is_available(),
        chat_model=ollama_client.OLLAMA_CHAT_MODEL,
        embed_model=ollama_client.OLLAMA_EMBED_MODEL,
        models_installed=models,
    )


def _prepare(body: ChatRequest, db: Session, current_user):
    if not body.question or not body.question.strip():
        raise HTTPException(status_code=422, detail="question must not be empty")
    ctx = _resolve_context(body, db, current_user)
    try:
        chunks = retrieve(body.question, top_k=3)
    except OllamaUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return ctx, chunks, _build_prompt(body.question, ctx, chunks)


@router.post("/stream")
def ask_stream(
    body: ChatRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    """Same as /ask but streams NDJSON: a `meta` line, `token` lines, then `done`."""
    ctx, chunks, prompt = _prepare(body, db, current_user)
    meta = {
        "type": "meta",
        "sources": [{"source": c.source, "heading": c.heading} for c in chunks],
        "grounded_in_prediction": ctx is not None,
    }

    def events():
        yield json.dumps(meta) + "\n"
        try:
            for token in ollama_client.generate_stream(prompt, system=_SYSTEM_PROMPT):
                yield json.dumps({"type": "token", "text": token}) + "\n"
            yield json.dumps({"type": "done"}) + "\n"
        except OllamaUnavailableError as exc:
            yield json.dumps({"type": "error", "detail": str(exc)}) + "\n"

    return StreamingResponse(events(), media_type="application/x-ndjson")


@router.post("/ask", response_model=ChatResponse)
def ask(
    body: ChatRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    if not body.question or not body.question.strip():
        raise HTTPException(status_code=422, detail="question must not be empty")

    ctx, chunks, prompt = _prepare(body, db, current_user)

    try:
        answer = ollama_client.generate(prompt, system=_SYSTEM_PROMPT)
    except OllamaUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    if not answer:
        answer = (
            "I wasn't able to generate a response just now. Please try "
            "rephrasing your question, or discuss your result directly "
            "with a clinician."
        )

    return ChatResponse(
        answer=answer,
        sources=[ChatSource(source=c.source, heading=c.heading) for c in chunks],
        grounded_in_prediction=ctx is not None,
    )
