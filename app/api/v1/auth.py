"""Auth endpoints (AUTH-1, AUTH-2)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_auth_service, get_current_user
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
    TokenResponse,
    UserPublic,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


class _AuthPayload(UserPublic):
    """Response envelope combining user + token."""

    token: TokenResponse


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=_AuthPayload)
def register(payload: RegisterRequest, service: AuthService = Depends(get_auth_service)):
    """Register a new lecturer or student and return an access token."""
    user, token = service.register(payload)
    return _AuthPayload(**user.model_dump(), token=token)


@router.post("/login", response_model=_AuthPayload)
def login(payload: LoginRequest, service: AuthService = Depends(get_auth_service)):
    """Exchange email + password for a fresh JWT."""
    user, token = service.login(payload)
    return _AuthPayload(**user.model_dump(), token=token)


@router.get("/me", response_model=UserPublic)
def me(user: User = Depends(get_current_user)):
    """Return the currently authenticated user's public profile."""
    return UserPublic.model_validate(user)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, service: AuthService = Depends(get_auth_service)):
    """Request a password reset email (generic response)."""
    msg = service.request_password_reset(payload.email)
    return ForgotPasswordResponse(message=msg)


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(payload: ResetPasswordRequest, service: AuthService = Depends(get_auth_service)):
    """Consume a one-time token and set a new password."""
    service.reset_password(payload.token, payload.password)
    return ResetPasswordResponse(message="Your password has been updated. You can sign in now.")
