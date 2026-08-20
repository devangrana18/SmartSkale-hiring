from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class TokenData(BaseModel):
    email: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "hr"

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=8)
    new_password: str = Field(..., min_length=6)

class UserUpdateProfile(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None

# --- Employee Schemas ---
class EmployeeBase(BaseModel):
    full_name: str = Field(..., min_length=1, description="Employee Full Name")
    email: EmailStr = Field(..., description="Unique Email Address")
    phone: Optional[str] = None
    address: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    joining_date: Optional[str] = None
    status: Optional[str] = "Active"
    duration: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    stipend: Optional[str] = None
    reference_number: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    employee_id: Optional[str] = None  # Optional manual assignment

class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    joining_date: Optional[str] = None
    status: Optional[str] = None
    duration: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    stipend: Optional[str] = None
    reference_number: Optional[str] = None
    employee_id: Optional[str] = None

class AssignEmployeeId(BaseModel):
    employee_id: str = Field(..., min_length=1, description="Unique Employee ID assigned manually by HR")

class EmployeeResponse(EmployeeBase):
    id: int
    employee_id: Optional[str] = None
    source: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Document Schemas ---
class DocumentTemplateResponse(BaseModel):
    id: int
    name: str
    document_type: str
    file_name: str
    description: Optional[str] = None
    version: str
    is_active: bool

    class Config:
        from_attributes = True

class DocumentPreviewRequest(BaseModel):
    document_type: str  # "offer_letter", "internship_certificate", "nda", "letterhead"
    employee_id: Optional[int] = None
    
    # Live editable fields for preview
    name: str
    intern_id: Optional[str] = None
    email: Optional[str] = None
    intern_address: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    date: Optional[str] = None
    duration: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    issue_date: Optional[str] = None
    certificate_no: Optional[str] = None
    verify_url: Optional[str] = None
    stipend: Optional[str] = None
    reference_number: Optional[str] = None
    custom_content: Optional[str] = None

class DocumentGenerateRequest(DocumentPreviewRequest):
    save_history: bool = True

class GeneratedDocumentResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    template_id: Optional[int] = None
    document_type: str
    document_number: Optional[str] = None
    generated_by: Optional[str] = None
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Dashboard & Sync Schemas ---
class DashboardStats(BaseModel):
    active_employees: int
    total_employees: int
    pending_employee_ids: int
    inactive_employees: int
    onboarding_employees: int
    recent_employees: List[EmployeeResponse]
    documents_generated_count: int
    department_distribution: Dict[str, int]

class SyncResponse(BaseModel):
    success: bool
    message: str
    total_records_processed: int
    new_employees_count: int
    updated_employees_count: int
    skipped_employees_count: int
    errors: List[str] = []

# --- Email Schemas ---
class SendDocumentEmailRequest(BaseModel):
    recipient_email: EmailStr
    recipient_name: str
    subject: Optional[str] = None
    custom_message: Optional[str] = None

class SendDocumentEmailResponse(BaseModel):
    success: bool
    message: str

