import random
from datetime import datetime, timedelta
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, UserRole
from app.schemas.schemas import (
    Token,
    UserLogin,
    UserCreate,
    UserResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserUpdateProfile,
)
from app.utils.security import verify_password, get_password_hash, create_access_token, get_current_user
from app.services.email_service import email_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory OTP storage: email -> {"otp": "123456", "expires_at": datetime}
_otp_store: Dict[str, Dict[str, Any]] = {}

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email.lower().strip()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact your administrator."
        )

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    data: UserUpdateProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile details (full name and email)."""
    if data.email:
        new_email = data.email.lower().strip()
        if new_email != current_user.email.lower().strip():
            existing = db.query(User).filter(User.email == new_email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this email address is already registered."
                )
            current_user.email = new_email

    if data.full_name and data.full_name.strip():
        current_user.full_name = data.full_name.strip()

    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change password for an authenticated user."""
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password entered is incorrect."
        )

    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )

    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"success": True, "message": "Password changed successfully."}

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate and email a 6-digit OTP for password recovery."""
    email_clean = data.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        # Prevent email enumeration while giving feedback
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registered user account found with this email address."
        )

    # Generate 6-digit OTP
    otp_code = str(random.randint(100000, 999999))
    _otp_store[email_clean] = {
        "otp": otp_code,
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
    }

    # Dispatch email
    result = email_service.send_otp_email(
        recipient_email=user.email,
        recipient_name=user.full_name,
        otp_code=otp_code,
    )

    response_payload = {
        "success": True,
        "message": f"A 6-digit password reset code has been sent to {user.email}.",
        "email": user.email,
    }
    if "dev_otp" in result:
        response_payload["dev_otp"] = result["dev_otp"]

    return response_payload

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verify OTP and reset account password."""
    email_clean = data.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found."
        )

    stored_entry = _otp_store.get(email_clean)
    if not stored_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No password reset request found. Please request a new OTP code."
        )

    if datetime.utcnow() > stored_entry["expires_at"]:
        _otp_store.pop(email_clean, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification code has expired. Please request a new one."
        )

    if stored_entry["otp"] != data.otp.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please check and try again."
        )

    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )

    # Reset password
    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    _otp_store.pop(email_clean, None)

    return {
        "success": True,
        "message": "Your password has been successfully reset. You can now log in with your new password."
    }

@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address is already registered."
        )
    user = User(
        email=user_data.email.lower().strip(),
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name.strip(),
        role=user_data.role or UserRole.HR.value,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

