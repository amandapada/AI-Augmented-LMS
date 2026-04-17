"""Abstract AI client interface.

Keeping an interface (rather than passing a concrete Groq client everywhere)
means we can swap providers (OpenAI, Anthropic, self-hosted) without touching
VLMService / LLMService. Tests also inject a :class:`FakeAIClient`.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List


class AbstractAIClient(ABC):
    """Minimal surface that an AI provider must offer to be usable here."""

    @abstractmethod
    def complete(
        self,
        prompt: str,
        *,
        temperature: float = 0.3,
        max_tokens: int = 1024,
    ) -> str:
        """Return the model's completion for a plain-text prompt."""

    @abstractmethod
    def complete_vision(
        self,
        prompt: str,
        image_b64: str,
        *,
        mime: str = "image/jpeg",
        temperature: float = 0.1,
        max_tokens: int = 2000,
    ) -> str:
        """Return the VLM's completion for a prompt + base64-encoded image."""

    @abstractmethod
    def embed(self, texts: List[str]) -> List[List[float]]:
        """Return one embedding per input string."""
