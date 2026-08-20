from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class EmployeeStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    PENDING = "Pending"
    ONBOARDING = "Onboarding"

class DocumentType(str, enum.Enum):
    OFFER_LETTER = "offer_letter"
    INTERNSHIP_CERTIFICATE = "internship_certificate"
    NDA = "nda"
    LETTERHEAD = "letterhead"

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    HR = "hr"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.HR.value, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(100), unique=True, index=True, nullable=True)  # Manual assignment by HR only
    full_name = Column(String(255), index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    role = Column(String(255), nullable=True)
    department = Column(String(255), nullable=True)
    joining_date = Column(String(50), nullable=True)
    status = Column(String(50), default=EmployeeStatus.ACTIVE.value, nullable=False)
    source = Column(String(50), default="manual")  # "google_drive" or "manual"
    
    # Additional flexible metadata fields
    duration = Column(String(100), nullable=True)
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    stipend = Column(String(100), nullable=True)
    reference_number = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    generated_documents = relationship("GeneratedDocument", back_populates="employee", cascade="all, delete-orphan")

class DocumentTemplate(Base):
    __tablename__ = "document_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    document_type = Column(String(100), unique=True, nullable=False)
    file_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    version = Column(String(50), default="1.0.0")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class GeneratedDocument(Base):
    __tablename__ = "generated_documents"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    template_id = Column(Integer, ForeignKey("document_templates.id"), nullable=True)
    document_type = Column(String(100), nullable=False)
    document_number = Column(String(100), nullable=True)
    generated_by = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    preview_data = Column(Text, nullable=True)  # Snapshot of rendered parameters
    status = Column(String(50), default="Generated")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", back_populates="generated_documents")
    template = relationship("DocumentTemplate")
