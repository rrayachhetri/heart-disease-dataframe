"""
Auth router: /auth/register, /auth/login, /auth/refresh, /auth/me
"""
import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from src.db.database import get_db
from src.db.models import User, Patient, Doctor
from src.auth.schemas import (
    RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, UserResponse,
    ForgotPasswordRequest, ResetPasswordRequest, MessageResponse,
)
from src.auth.service import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, create_reset_token, decode_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=False)


# ── Dependency: get current user from Bearer token ────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """Returns user if token is valid, None otherwise (for optional-auth endpoints)."""
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        return None
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user or not user.is_active:
        return None
    return user


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        role=body.role,
        is_verified=True,  # Phase 2: email verification flow
    )
    db.add(user)
    db.flush()  # get user.id before creating profile

    if body.role == "patient":
        db.add(Patient(user_id=user.id, first_name=body.first_name, last_name=body.last_name))
    else:
        db.add(Doctor(user_id=user.id, first_name=body.first_name, last_name=body.last_name))

    db.commit()
    db.refresh(user)

    return _build_user_response(user)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    return TokenResponse(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return TokenResponse(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    generic_message = "If that email is registered, a password reset link has been generated."

    if not user or not _identity_matches(user, body.first_name, body.last_name):
        # Don't reveal whether the email exists or which field failed to match.
        return MessageResponse(message=generic_message)

    reset_token = create_reset_token(user.id)
    # No email service configured yet — log the reset link/token server-side for local dev.
    print(f"[password reset] {user.email} -> reset token: {reset_token}")

    # Dev convenience only: since there is no email sender wired up yet, surface the
    # token directly outside of production so the "forgot password" flow is usable end-to-end.
    dev_token = reset_token if os.getenv("ENVIRONMENT", "development") != "production" else None

    return MessageResponse(message=generic_message, dev_reset_token=dev_token)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.token)
    if not payload or payload.get("type") != "reset":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    user.hashed_password = hash_password(body.new_password)
    db.commit()

    return MessageResponse(message="Password has been reset. You can now log in.")


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return _build_user_response(current_user)


# ── Helper ────────────────────────────────────────────────────────────────────

def _identity_matches(user: User, first_name: str, last_name: str) -> bool:
    """Confirms the supplied name matches the user's profile before issuing a reset token."""
    profile = user.patient_profile if user.role == "patient" else user.doctor_profile
    if not profile:
        return False
    return (
        profile.first_name.strip().lower() == first_name.strip().lower()
        and profile.last_name.strip().lower() == last_name.strip().lower()
    )


def _build_user_response(user: User) -> UserResponse:
    first_name = last_name = None
    if user.role == "patient" and user.patient_profile:
        first_name = user.patient_profile.first_name
        last_name = user.patient_profile.last_name
    elif user.role == "doctor" and user.doctor_profile:
        first_name = user.doctor_profile.first_name
        last_name = user.doctor_profile.last_name
    return UserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        first_name=first_name,
        last_name=last_name,
    )
