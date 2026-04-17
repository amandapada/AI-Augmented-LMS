"""Quizzes: generation, grading, attempt history (QZ-1..QZ-6, AN-1/2)."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationError
from app.models.handout import Handout, ProcessingStatus
from app.models.study import Quiz, QuizAttempt
from app.repositories.handout_repo import HandoutRepository
from app.repositories.quiz_repo import QuizAttemptRepository, QuizRepository
from app.schemas.study import (
    MCQFeedback,
    QuizAttemptResult,
    QuizPayload,
    QuizSubmission,
    ShortAnswerFeedback,
)
from app.services.ai.llm_service import LLMService


@dataclass
class _GradedMCQ:
    index: int
    correct: bool
    correct_option: str
    explanation: str


class QuizService:
    """End-to-end quiz workflow."""

    def __init__(self, db: Session, llm: LLMService) -> None:
        self._db = db
        self._quizzes = QuizRepository(db)
        self._attempts = QuizAttemptRepository(db)
        self._handouts = HandoutRepository(db)
        self._llm = llm

    # ---- Generation (QZ-1) ----

    def generate_for_handout(self, handout_id: int) -> Quiz:
        handout = self._require_ready_handout(handout_id)
        payload = self._llm.generate_quiz(handout.extracted_text or "")
        if not payload["mcq"] and not payload["short_answer"]:
            raise ValidationError("Quiz generation returned no questions.")
        quiz = Quiz(handout_id=handout.id, questions_json=json.dumps(payload))
        self._quizzes.add(quiz)
        return quiz

    def get_payload(self, quiz_id: int) -> QuizPayload:
        """Return the parsed quiz content for display to students."""
        quiz = self._quizzes.get(quiz_id)
        if quiz is None:
            raise NotFoundError(f"Quiz {quiz_id} not found")
        return QuizPayload(**json.loads(quiz.questions_json))

    # ---- Grading (QZ-4) ----

    def submit(
        self, *, quiz_id: int, user_id: int, submission: QuizSubmission
    ) -> QuizAttemptResult:
        """Grade an attempt, persist it, and return per-question feedback.

        MCQs are graded strictly (letter match). Short answers are *not*
        auto-graded — we return the sample answer + key points so the student
        can self-assess. Only MCQ correctness contributes to ``score`` for
        this reason; QZ-4 explicitly asks for "instant feedback".
        """
        quiz = self._quizzes.get(quiz_id)
        if quiz is None:
            raise NotFoundError(f"Quiz {quiz_id} not found")

        payload: Dict[str, Any] = json.loads(quiz.questions_json)
        mcq_graded = self._grade_mcq(payload.get("mcq", []), submission.mcq_answers)
        sa_feedback = self._feedback_short_answer(
            payload.get("short_answer", []), submission.short_answers
        )

        # Percentage of MCQs correct. If there are no MCQs, default to 0 —
        # the analytics dashboard treats quizzes without objective questions
        # as ungraded anyway.
        total_mcq = len(mcq_graded) or 1
        correct_count = sum(1 for g in mcq_graded if g.correct)
        score = round((correct_count / total_mcq) * 100.0, 2)

        attempt = QuizAttempt(
            quiz_id=quiz_id,
            user_id=user_id,
            answers_json=submission.model_dump_json(),
            score=score,
            breakdown_json=json.dumps(
                {"mcq_correct": [g.correct for g in mcq_graded]}
            ),
        )
        self._attempts.add(attempt)

        return QuizAttemptResult(
            attempt_id=attempt.id,
            score=score,
            mcq_feedback=[
                MCQFeedback(
                    index=g.index,
                    correct=g.correct,
                    correct_option=g.correct_option,
                    explanation=g.explanation,
                )
                for g in mcq_graded
            ],
            short_answer_feedback=sa_feedback,
        )

    def history_for_user(self, user_id: int) -> List[QuizAttempt]:
        return self._attempts.history_for_user(user_id)

    # ---- helpers ----

    def _grade_mcq(
        self, questions: List[Dict[str, Any]], student_answers: List[str]
    ) -> List[_GradedMCQ]:
        results: List[_GradedMCQ] = []
        for i, q in enumerate(questions):
            student_letter = (student_answers[i] if i < len(student_answers) else "").strip().upper()
            correct_letter = str(q.get("correct", "")).strip().upper()
            results.append(
                _GradedMCQ(
                    index=i,
                    correct=bool(student_letter) and student_letter == correct_letter,
                    correct_option=correct_letter,
                    explanation=str(q.get("explanation", "")),
                )
            )
        return results

    def _feedback_short_answer(
        self, questions: List[Dict[str, Any]], student_answers: List[str]
    ) -> List[ShortAnswerFeedback]:
        feedback: List[ShortAnswerFeedback] = []
        for i, q in enumerate(questions):
            feedback.append(
                ShortAnswerFeedback(
                    index=i,
                    sample_answer=str(q.get("sample_answer", "")),
                    key_points=[str(p) for p in q.get("key_points", [])],
                    student_answer=student_answers[i] if i < len(student_answers) else "",
                )
            )
        return feedback

    def _require_ready_handout(self, handout_id: int) -> Handout:
        handout = self._handouts.get(handout_id)
        if handout is None:
            raise NotFoundError(f"Handout {handout_id} not found")
        if handout.status not in {ProcessingStatus.READY, ProcessingStatus.APPROVED}:
            raise ValidationError(
                "Handout is not ready yet.", details={"status": handout.status.value}
            )
        if not handout.extracted_text:
            raise ValidationError("Handout has no extracted text.")
        return handout
