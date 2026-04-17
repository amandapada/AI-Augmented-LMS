"""Vision-language extraction from uploaded handouts (UP-4, PERF-1).

The service produces both text and confidence signals. Confidence drives the
lecturer audit UI (AUD-2): chunks under 0.7 are rendered red so the lecturer
can fix them.
"""

from __future__ import annotations

import base64
import logging
import mimetypes
from dataclasses import dataclass
from pathlib import Path
from typing import List

from PyPDF2 import PdfReader

from app.services.ai.base import AbstractAIClient
from app.services.ai.prompts import VLM_IMAGE_OCR

logger = logging.getLogger(__name__)


@dataclass
class ExtractedChunk:
    """One page (or page-like slice) of extracted text."""

    text: str
    confidence: float
    page_number: int | None = None


@dataclass
class ExtractionResult:
    """Structured output of a VLM run.

    ``full_text`` is the concatenated handout (used by LLM prompts that work
    on the whole document); ``chunks`` drive per-page UI and RAG.
    """

    full_text: str
    confidence: float
    chunks: List[ExtractedChunk]
    error: str | None = None


class VLMService:
    """Extracts text from PDFs and images.

    Strategy:
      - PDFs: try native text extraction first (cheap, accurate for digital
        PDFs). Pages that return <50 chars are treated as scanned and marked
        low-confidence. A future enhancement will rasterise those pages and
        feed them to the VLM too.
      - Images: always run through the VLM.
    """

    #: Below this length we assume a page was scanned art and fail over.
    SCANNED_TEXT_THRESHOLD = 50
    LOW_CONFIDENCE = 0.6
    HIGH_CONFIDENCE = 0.9
    IMAGE_CONFIDENCE = 0.8

    def __init__(self, groq: AbstractAIClient) -> None:
        self._groq = groq

    # ---- Public API ----

    def extract(self, file_path: str | Path) -> ExtractionResult:
        """Dispatch to the right extractor based on file extension/MIME."""
        path = Path(file_path)
        mime, _ = mimetypes.guess_type(path.name)
        if path.suffix.lower() == ".pdf" or mime == "application/pdf":
            return self.extract_from_pdf(path)
        return self.extract_from_image(path)

    def extract_from_pdf(self, path: str | Path) -> ExtractionResult:
        """Pull per-page text out of a PDF with PyPDF2."""
        path = Path(path)
        try:
            reader = PdfReader(str(path))
        except Exception as exc:
            logger.exception("PDF parse failed: %s", path)
            return ExtractionResult(full_text="", confidence=0.0, chunks=[], error=str(exc))

        chunks: List[ExtractedChunk] = []
        low_confidence = 0
        for page_num, page in enumerate(reader.pages):
            text = (page.extract_text() or "").strip()
            if len(text) < self.SCANNED_TEXT_THRESHOLD:
                low_confidence += 1
                # Keep the low-confidence marker so the lecturer sees where
                # the VLM should retry once we rasterise scanned pages.
                chunks.append(
                    ExtractedChunk(
                        text=text, confidence=self.LOW_CONFIDENCE, page_number=page_num + 1
                    )
                )
            else:
                chunks.append(
                    ExtractedChunk(
                        text=text, confidence=self.HIGH_CONFIDENCE, page_number=page_num + 1
                    )
                )

        overall = self.HIGH_CONFIDENCE if low_confidence == 0 else self.LOW_CONFIDENCE
        full_text = "\n\n".join(
            f"=== Page {c.page_number} ===\n{c.text}" for c in chunks if c.text
        )
        return ExtractionResult(full_text=full_text, confidence=overall, chunks=chunks)

    def extract_from_image(self, path: str | Path) -> ExtractionResult:
        """Base64-encode an image and ask the VLM to OCR it."""
        path = Path(path)
        mime, _ = mimetypes.guess_type(path.name)
        mime = mime or "image/jpeg"
        try:
            image_b64 = base64.b64encode(path.read_bytes()).decode("utf-8")
            text = self._groq.complete_vision(
                prompt=VLM_IMAGE_OCR,
                image_b64=image_b64,
                mime=mime,
                temperature=0.1,
                max_tokens=2000,
            ).strip()
        except Exception as exc:
            logger.exception("VLM call failed for %s", path)
            return ExtractionResult(full_text="", confidence=0.0, chunks=[], error=str(exc))

        chunk = ExtractedChunk(text=text, confidence=self.IMAGE_CONFIDENCE, page_number=1)
        return ExtractionResult(
            full_text=text, confidence=self.IMAGE_CONFIDENCE, chunks=[chunk]
        )
