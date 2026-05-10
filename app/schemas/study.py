"""Study-tool DTOs: flashcards + quizzes."""

from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel, Field

from app.models.study import ReviewDifficulty


# ----- Flashcards ----- #


class FlashcardOut(BaseModel):
    id: int
    question: str
    answer: str

    model_config = {"from_attributes": True}


class FlashcardGenerateResponse(BaseModel):
    """Returned by POST /handouts/{id}/generate-flashcards (FC-1)."""

    count: int
    flashcards: List[FlashcardOut]


class FlashcardReviewRequest(BaseModel):
    """Body for POST /flashcards/{id}/review (FC-3)."""

    difficulty: ReviewDifficulty


class FlashcardReviewResponse(BaseModel):
    """Confirms the review and returns the next due date (FC-4)."""

    flashcard_id: int
    difficulty: ReviewDifficulty
    interval_days: int
    due_at: datetime


class FlashcardSessionSummary(BaseModel):
    """End-of-session summary (FC-6)."""

    reviewed: int
    due_remaining: int


# ----- Quizzes ----- #


class MCQQuestion(BaseModel):
    """Single MCQ (QZ-2)."""

    question: str
    options: List[str]
    correct: str  # "A" | "B" | "C" | "D"
    explanation: str


class ShortAnswerQuestion(BaseModel):
    """Single short-answer question (QZ-3)."""

    question: str
    sample_answer: str
    key_points: List[str]


class QuizPayload(BaseModel):
    """The full 5+2 quiz payload (QZ-1)."""

    mcq: List[MCQQuestion]
    short_answer: List[ShortAnswerQuestion]


class QuizGenerateResponse(BaseModel):
    quiz_id: int
    quiz: QuizPayload


class QuizSubmission(BaseModel):
    """Student answers (QZ-4)."""

    mcq_answers: List[str] = Field(
        default_factory=list, description="Letter answers in question order, e.g. ['A','C','B','D','A']"
    )
    short_answers: List[str] = Field(default_factory=list)


class MCQFeedback(BaseModel):
    index: int
    correct: bool
    correct_option: str
    explanation: str


class ShortAnswerFeedback(BaseModel):
    index: int
    sample_answer: str
    key_points: List[str]
    student_answer: str


class QuizAttemptResult(BaseModel):
    """Graded result returned from POST /quizzes/{id}/submit."""

    attempt_id: int
    score: float
    mcq_feedback: List[MCQFeedback]
    short_answer_feedback: List[ShortAnswerFeedback]


class QuizAttemptSummary(BaseModel):
    """Row in the student's quiz history (QZ-6)."""

    id: int
    quiz_id: int
    score: float
    submitted_at: datetime

    model_config = {"from_attributes": True}
