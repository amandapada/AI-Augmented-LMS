"""Quiz endpoints (QZ-1..QZ-6)."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user, get_quiz_service, require_role
from app.models.user import User, UserRole
from app.schemas.study import (
    QuizAttemptResult,
    QuizAttemptSummary,
    QuizGenerateResponse,
    QuizPayload,
    QuizSubmission,
)
from app.services.quiz_service import QuizService

router = APIRouter(tags=["quizzes"])


@router.post(
    "/handouts/{handout_id}/generate-quiz",
    response_model=QuizGenerateResponse,
)
def generate(
    handout_id: int,
    service: QuizService = Depends(get_quiz_service),
    _user: User = Depends(require_role(UserRole.LECTURER, UserRole.ADMIN)),
):
    """Generate a 5 MCQ + 2 short-answer quiz (QZ-1)."""
    quiz = service.generate_for_handout(handout_id)
    return QuizGenerateResponse(quiz_id=quiz.id, quiz=service.get_payload(quiz.id))


@router.get("/quizzes/{quiz_id}", response_model=QuizPayload)
def fetch(
    quiz_id: int,
    service: QuizService = Depends(get_quiz_service),
    _user: User = Depends(get_current_user),
):
    """Fetch a quiz's questions for display."""
    return service.get_payload(quiz_id)


@router.post("/quizzes/{quiz_id}/submit", response_model=QuizAttemptResult)
def submit(
    quiz_id: int,
    payload: QuizSubmission,
    service: QuizService = Depends(get_quiz_service),
    user: User = Depends(get_current_user),
):
    """Submit answers and receive instant feedback (QZ-4)."""
    return service.submit(quiz_id=quiz_id, user_id=user.id, submission=payload)


@router.get("/quizzes/attempts/me", response_model=List[QuizAttemptSummary])
def my_history(
    service: QuizService = Depends(get_quiz_service),
    user: User = Depends(get_current_user),
):
    """Return the calling student's attempt history (QZ-6)."""
    return [QuizAttemptSummary.model_validate(a) for a in service.history_for_user(user.id)]
