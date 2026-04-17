"""Groq-backed :class:`AbstractAIClient`.

Wraps the official ``groq`` SDK. One instance per process (built in
:mod:`app.core.dependencies` via ``lru_cache``). Holds no per-request state,
so it's safe to share across threads.
"""

from __future__ import annotations

import hashlib
import math
from typing import List

from groq import Groq

from app.core.exceptions import ExternalServiceError
from app.services.ai.base import AbstractAIClient


class GroqClient(AbstractAIClient):
    """Thin adapter over ``groq.Groq``.

    We intentionally keep the surface small — any prompt engineering or output
    parsing lives in :class:`LLMService` / :class:`VLMService`. That keeps the
    provider swap painless.
    """

    def __init__(self, api_key: str, llm_model: str, vlm_model: str) -> None:
        self._client = Groq(api_key=api_key)
        self._llm_model = llm_model
        self._vlm_model = vlm_model

    # ---- Text completion ----

    def complete(self, prompt: str, *, temperature: float = 0.3, max_tokens: int = 1024) -> str:
        try:
            response = self._client.chat.completions.create(
                model=self._llm_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content or ""
        except Exception as exc:
            raise ExternalServiceError(f"Groq LLM call failed: {exc}") from exc

    # ---- Vision completion ----

    def complete_vision(
        self,
        prompt: str,
        image_b64: str,
        *,
        mime: str = "image/jpeg",
        temperature: float = 0.1,
        max_tokens: int = 2000,
    ) -> str:
        try:
            response = self._client.chat.completions.create(
                model=self._vlm_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:{mime};base64,{image_b64}"},
                            },
                        ],
                    }
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content or ""
        except Exception as exc:
            raise ExternalServiceError(f"Groq VLM call failed: {exc}") from exc

    # ---- Embeddings ----

    def embed(self, texts: List[str]) -> List[List[float]]:
        """Deterministic lightweight embedding stand-in.

        Groq does not currently expose an embedding endpoint. Rather than pull
        in a second provider for the MVP, we use a hashed 384-d "lexical"
        vector: stable per string, good enough for the cosine-similarity
        chunk selection the RAG service does. Swap for a real embedding API
        (Cohere / Voyage / self-hosted) post-MVP without touching callers.
        """

        return [self._hash_embed(t) for t in texts]

    # ---- helpers ----

    @staticmethod
    def _hash_embed(text: str, dim: int = 384) -> List[float]:
        """Produce a unit-norm pseudo-embedding from a stable hash of ``text``."""
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        # Expand the 32-byte digest to ``dim`` floats in [-1, 1].
        raw = [((digest[i % len(digest)] / 255.0) * 2.0) - 1.0 for i in range(dim)]
        norm = math.sqrt(sum(x * x for x in raw)) or 1.0
        return [x / norm for x in raw]
