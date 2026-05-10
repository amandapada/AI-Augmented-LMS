"""Handout endpoints: upload, status, audit, approve (UP-*, AUD-*)."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, File, UploadFile, status

from app.core.dependencies import (
    get_current_user,
    get_handout_service,
    get_llm_service,
    require_role,
)
from app.models.user import User, UserRole
from app.schemas.handout import (
    ApproveResponse,
    AuditUpdateRequest,
    HandoutDetail,
    HandoutStatusResponse,
    HandoutSummary,
    HandoutUploadResponse,
)
from app.services.ai.llm_service import LLMService
from app.services.handout_service import HandoutService

router = APIRouter(prefix="/handouts", tags=["handouts"])


@router.post("/upload", status_code=status.HTTP_201_CREATED, response_model=HandoutUploadResponse)
async def upload_handout(
    file: UploadFile = File(...),
    service: HandoutService = Depends(get_handout_service),
    user: User = Depends(require_role(UserRole.LECTURER, UserRole.ADMIN)),
):
    """Accept a PDF/image upload (UP-1, UP-2) and queue it for extraction."""
    content = await file.read()
    handout = service.upload(
        filename=file.filename or "untitled",
        content=content,
        content_type=file.content_type or "application/octet-stream",
        uploader=user,
    )
    return HandoutUploadResponse(
        id=handout.id,
        status=handout.status,
        message="Upload successful — processing queued.",
    )


@router.get("", response_model=List[HandoutSummary])
def list_handouts(
    service: HandoutService = Depends(get_handout_service),
    user: User = Depends(get_current_user),
):
    """List handouts visible to the caller (role-aware)."""
    return [HandoutSummary.model_validate(h) for h in service.list_for_viewer(user)]


@router.get("/{handout_id}/status", response_model=HandoutStatusResponse)
def get_status(
    handout_id: int,
    service: HandoutService = Depends(get_handout_service),
    _user: User = Depends(get_current_user),
):
    """Poll the processing pipeline (UP-3)."""
    h = service.get(handout_id)
    return HandoutStatusResponse(
        id=h.id, title=h.title, status=h.status, error_message=h.error_message
    )


@router.get("/{handout_id}", response_model=HandoutDetail)
def get_detail(
    handout_id: int,
    service: HandoutService = Depends(get_handout_service),
    _user: User = Depends(get_current_user),
):
    """Full handout payload for the audit screen (AUD-1)."""
    return HandoutDetail.model_validate(service.get(handout_id))


@router.patch("/{handout_id}/audit", response_model=HandoutDetail)
def audit(
    handout_id: int,
    payload: AuditUpdateRequest,
    service: HandoutService = Depends(get_handout_service),
    _user: User = Depends(require_role(UserRole.LECTURER, UserRole.ADMIN)),
):
    """Apply lecturer edits (AUD-3, AUD-4)."""
    return HandoutDetail.model_validate(service.update_audit(handout_id, payload))


@router.post("/{handout_id}/approve", response_model=ApproveResponse)
def approve(
    handout_id: int,
    service: HandoutService = Depends(get_handout_service),
    _user: User = Depends(require_role(UserRole.LECTURER, UserRole.ADMIN)),
):
    """Publish the handout to students (AUD-5)."""
    h = service.approve(handout_id)
    return ApproveResponse(id=h.id, status=h.status, approved_at=h.approved_at)


@router.post("/{handout_id}/suggest-topics")
def suggest_topics(
    handout_id: int,
    service: HandoutService = Depends(get_handout_service),
    llm: LLMService = Depends(get_llm_service),
    _user: User = Depends(require_role(UserRole.LECTURER, UserRole.ADMIN)),
):
    """Ask the LLM for 3–5 topic suggestions for the audit UI (AUD-4)."""
    handout = service.get(handout_id)
    topics = llm.suggest_topics(handout.extracted_text or "")
    return {"topics": topics}
