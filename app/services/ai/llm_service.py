"""Higher-level LLM operations built on top of :class:`AbstractAIClient`.

Every public method returns already-parsed Python data, never raw model text,
so callers never have to worry about JSON / markdown fences.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List

from app.core.exceptions import ExternalServiceError
from app.services.ai.base import AbstractAIClient
from app.services.ai.prompts import (
    FLASHCARD_GENERATION,
    MCQ_GENERATION,
    RAG_ANSWER,
    SHORT_ANSWER_GENERATION,
    TOPIC_SUGGESTION,
)

logger = logging.getLogger(__name__)


class LLMService:
    """Prompt + parse layer over the AI client."""

    # Limit prompt windows — we only pass the first N chars of a handout to
    # stay cheap and inside context budgets for the MVP's 5–10 page handouts.
    CHAR_BUDGET_SHORT = 3000
    CHAR_BUDGET_LONG = 4000

    def __init__(self, groq: AbstractAIClient) -> None:
        self._groq = groq

    # ---- Topic suggestion (AUD-4) ----

    def suggest_topics(self, text: str) -> List[str]:
        """Return 3–5 topic tags (never more)."""
        raw = self._groq.complete(
            TOPIC_SUGGESTION.format(text=text[: self.CHAR_BUDGET_SHORT]),
            temperature=0.3,
            max_tokens=200,
        )
        parsed = self._safe_json(raw)
        if isinstance(parsed, list):
            return [str(t).strip() for t in parsed][:5]
        # Fallback: naive comma split so the lecturer still sees something.
        return [t.strip().strip("\"'") for t in raw.split(",") if t.strip()][:5]

    # ---- Flashcards (FC-1) ----

    def generate_flashcards(self, text: str) -> List[Dict[str, str]]:
        """Return up to 10 ``{"question", "answer"}`` dicts."""
        raw = self._groq.complete(
            FLASHCARD_GENERATION.format(text=text[: self.CHAR_BUDGET_LONG]),
            temperature=0.5,
            max_tokens=2000,
        )
        parsed = self._safe_json(raw)
        if not isinstance(parsed, list):
            logger.warning("Flashcard parse failed; model returned %r", raw[:120])
            return []
        return [
            {"question": str(c.get("question", "")), "answer": str(c.get("answer", ""))}
            for c in parsed[:10]
            if c.get("question") and c.get("answer")
        ]

    # ---- Quiz (QZ-1) ----

    def generate_quiz(self, text: str) -> Dict[str, List[Dict[str, Any]]]:
        """Return ``{"mcq": [...], "short_answer": [...]}`` ready to persist."""
        if not text or len(text.strip()) < 100:
            logger.info("Skipping quiz generation — text too short (%d chars)", len(text or ""))
            return {"mcq": [], "short_answer": []}

        try:
            mcq_raw = self._groq.complete(
                MCQ_GENERATION.format(text=text[: self.CHAR_BUDGET_SHORT]),
                temperature=0.7,
                max_tokens=2000,
            )
            sa_raw = self._groq.complete(
                SHORT_ANSWER_GENERATION.format(text=text[: self.CHAR_BUDGET_SHORT]),
                temperature=0.7,
                max_tokens=1500,
            )
        except ExternalServiceError:
            # Let this bubble — handout endpoint surfaces it as 502.
            raise

        mcq_list = self._safe_json(mcq_raw) or []
        sa_list = self._safe_json(sa_raw) or []
        return {
            "mcq": mcq_list[:5] if isinstance(mcq_list, list) else [],
            "short_answer": sa_list[:2] if isinstance(sa_list, list) else [],
        }

    # ---- RAG answer (CH-3) ----

    def answer_with_context(
        self, question: str, context_chunks: List[Dict[str, Any]]
    ) -> str:
        """Return a grounded answer using only the provided context."""
        context = "\n\n".join(str(c.get("text", "")) for c in context_chunks)
        return self._groq.complete(
            RAG_ANSWER.format(context=context, question=question),
            temperature=0.3,
            max_tokens=500,
        ).strip()

    # ---- helpers ----

    @staticmethod
    def _safe_json(raw: str) -> Any:
        """Parse JSON from a model response, tolerating ```json fences."""
        text = (raw or "").strip()
        if "```" in text:
            parts = text.split("```")
            # Pick the fenced body if present.
            text = parts[1] if len(parts) > 1 else text
            if text.lower().startswith("json"):
                text = text[4:]
        text = text.strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            logger.debug("safe_json parse failed: %r", text[:120])
            return None
