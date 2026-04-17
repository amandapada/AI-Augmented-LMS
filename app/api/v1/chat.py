"""RAG chat endpoints (CH-1..CH-6)."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends

from app.core.dependencies import get_chat_service, get_current_user
from app.models.user import User
from app.schemas.chat import ChatAnswerResponse, ChatAskRequest, ChatMessageOut
from app.services.chat_service import ChatService

router = APIRouter(tags=["chat"])


@router.post("/handouts/{handout_id}/chat", response_model=ChatAnswerResponse)
def ask(
    handout_id: int,
    payload: ChatAskRequest,
    service: ChatService = Depends(get_chat_service),
    user: User = Depends(get_current_user),
):
    """Ask a grounded question against a handout (CH-1..CH-4, CH-6)."""
    return service.ask(
        user_id=user.id, handout_id=handout_id, question=payload.question
    )


@router.get("/handouts/{handout_id}/chat/history", response_model=List[ChatMessageOut])
def history(
    handout_id: int,
    service: ChatService = Depends(get_chat_service),
    user: User = Depends(get_current_user),
):
    """Return the full message history for this user + handout (CH-5)."""
    messages = service.history(user_id=user.id, handout_id=handout_id)
    return [ChatMessageOut.model_validate(m) for m in messages]
