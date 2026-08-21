import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartSkale Hiring & Employee Document Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = "smartskale_super_secret_jwt_key_2026_production_grade"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = "sqlite:///./smartskale.db"
    
    # Google API configuration
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: Optional[str] = None
    GOOGLE_SERVICE_ACCOUNT_JSON: Optional[str] = None
    GOOGLE_DRIVE_FILE_ID: str = "1fXKpV71je5JPQRH1Xerx28F0E0ELCOwn"
    GOOGLE_SHEET_NAME: Optional[str] = None
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Option A: Resend API (Requires verified domain for external recipients)
    RESEND_API_KEY: Optional[str] = None

    # Option B: Brevo API (100% Free, 300 emails/day, NO domain required - works with your Gmail address on Render)
    BREVO_API_KEY: Optional[str] = None

    # Option B: Standard SMTP (Gmail, etc.)
    # Gmail example: SMTP_HOST=smtp.gmail.com, SMTP_PORT=587 (or 465 for SSL)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""          # e.g. yourname@gmail.com
    SMTP_PASSWORD: str = ""          # Gmail App Password (16 chars, no spaces)
    SMTP_FROM_EMAIL: str = ""        # Defaults to SMTP_USERNAME or onboarding@resend.dev
    SMTP_FROM_NAME: str = "SmartSkale HR"

    
    # Storage
    GENERATED_DOCS_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "generated_documents")
    TEMPLATES_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "templates")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.GENERATED_DOCS_DIR, exist_ok=True)
os.makedirs(settings.TEMPLATES_DIR, exist_ok=True)
