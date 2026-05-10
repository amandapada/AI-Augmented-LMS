"""Retrieval-augmented generation over handout content.

The MVP uses a tiny in-memory cosine similarity: we hash-embed both the query
and the chunks (see :class:`GroqClient`), score, and take the top-K. This is
good enough for 5–10 page handouts and avoids wiring a second provider for
real embeddings before we need one.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Iterable, List

from app.services.ai.llm_service import LLMService


@dataclass
class Chunk:
    """Minimal shape the retriever needs."""

    text: str
    page_number: int | None = None


@dataclass
class RagAnswer:
    answer: str
    sources: List[Chunk]


class RAGService:
    """Orchestrates chunking, retrieval, and grounded answer generation (CH-2/3/4)."""

    #: Character size of each chunk when we split extracted text on the fly.
    CHUNK_SIZE = 1000
    DEFAULT_TOP_K = 5

    def __init__(self, llm: LLMService) -> None:
        self._llm = llm

    # ---- Chunking ----

    def chunk_text(self, text: str) -> List[Chunk]:
        """Slice the extracted text into fixed-size windows.

        Simple by design — when we promote to pgvector, this will be replaced
        with sentence-aware chunking. Keeping the interface now means callers
        don't change later.
        """
        if not text:
            return []
        step = self.CHUNK_SIZE
        return [
            Chunk(text=text[i : i + step], page_number=(i // step) + 1)
            for i in range(0, len(text), step)
        ]

    # ---- Retrieval ----

    def retrieve(self, question: str, chunks: Iterable[Chunk], *, top_k: int | None = None) -> List[Chunk]:
        """Return the top-K chunks most similar to ``question``.

        Falls back to "first K chunks" when we don't have embeddings — still
        useful for very short handouts where every chunk is likely relevant.
        """
        chunk_list = list(chunks)
        if not chunk_list:
            return []
        k = top_k or self.DEFAULT_TOP_K

        # Lazy embedding — only hit the AI client when we actually retrieve.
        question_vec = self._safe_embed(question)
        if question_vec is None:
            return chunk_list[:k]

        scored: List[tuple[float, Chunk]] = []
        for chunk in chunk_list:
            vec = self._safe_embed(chunk.text)
            if vec is None:
                scored.append((0.0, chunk))
            else:
                scored.append((self._cosine(question_vec, vec), chunk))
        scored.sort(key=lambda pair: pair[0], reverse=True)
        return [chunk for _, chunk in scored[:k]]

    # ---- Answering ----

    def answer(self, question: str, chunks: Iterable[Chunk], *, top_k: int | None = None) -> RagAnswer:
        """Retrieve, prompt the LLM, and return a grounded answer with citations (CH-4)."""
        top = self.retrieve(question, chunks, top_k=top_k)
        answer_text = self._llm.answer_with_context(
            question,
            [{"text": c.text, "page_number": c.page_number} for c in top],
        )
        return RagAnswer(answer=answer_text, sources=top)

    # ---- helpers ----

    def _safe_embed(self, text: str) -> List[float] | None:
        try:
            return self._llm._groq.embed([text])[0]  # private access is fine inside the AI package
        except Exception:
            return None

    @staticmethod
    def _cosine(a: List[float], b: List[float]) -> float:
        if len(a) != len(b):
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        na = math.sqrt(sum(x * x for x in a)) or 1.0
        nb = math.sqrt(sum(x * x for x in b)) or 1.0
        return dot / (na * nb)
