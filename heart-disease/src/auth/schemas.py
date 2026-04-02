"""
Pydantic schemas for authentication requests and responses.
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
import re


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = "patient"            # "patient" | "doctor"
    first_name: str
    last_name: str

    @field_validator("role")
    @classmethod
    def role_must_be_valid(cls, v):
        if v not in ("patient", "doctor"):
            raise ValueError("role must be 'patient' or 'doctor'")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    is_active: bool
    is_verified: bool
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    model_config = {"from_attributes": True}
