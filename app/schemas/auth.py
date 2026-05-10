"""Auth-related request/response DTOs (AUTH-1, AUTH-2, AUTH-3)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class RegisterRequest(BaseModel):
    """Payload for POST /auth/register."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=120)
    role: UserRole = UserRole.STUDENT


class LoginRequest(BaseModel):
    """Payload for POST /auth/login."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT envelope returned after successful login or registration."""

    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int


class UserPublic(BaseModel):
    """Safe user projection — never includes the password hash."""

    id: int
    email: EmailStr
    role: UserRole
    full_name: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ForgotPasswordRequest(BaseModel):
    """Payload for POST /auth/forgot-password."""

    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    """Generic response — same whether or not the email exists."""

    message: str


class ResetPasswordRequest(BaseModel):
    """Payload for POST /auth/reset-password."""

    token: str = Field(..., min_length=10)
    password: str = Field(..., min_length=8, max_length=128)


class ResetPasswordResponse(BaseModel):
    message: str
