from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import DocumentTemplate, User
from app.schemas.schemas import DocumentTemplateResponse
from app.utils.security import get_current_user

router = APIRouter(prefix="/templates", tags=["Document Templates"])

@router.get("", response_model=List[DocumentTemplateResponse])
def list_templates(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    templates = db.query(DocumentTemplate).filter(DocumentTemplate.is_active == True).all()
    return templates

@router.get("/{document_type}", response_model=DocumentTemplateResponse)
def get_template_by_type(
    document_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    template = db.query(DocumentTemplate).filter(
        DocumentTemplate.document_type == document_type.lower()
    ).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template for document type '{document_type}' not found."
        )
    return template
