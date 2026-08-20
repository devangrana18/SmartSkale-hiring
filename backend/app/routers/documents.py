import os
import json
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.models.models import GeneratedDocument, DocumentTemplate, Employee, User
from app.schemas.schemas import (
    DocumentPreviewRequest,
    DocumentGenerateRequest,
    GeneratedDocumentResponse,
    SendDocumentEmailRequest,
    SendDocumentEmailResponse,
)
from app.services.template_engine import template_engine
from app.services.pdf_service import pdf_service
from app.services.email_service import email_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/documents", tags=["Document Generation & Management"])

@router.post("/preview")
def preview_document(
    data: DocumentPreviewRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        html_rendered = template_engine.render_template(
            data.document_type,
            data.dict()
        )
        return {
            "success": True,
            "document_type": data.document_type,
            "html": html_rendered
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to generate template preview: {str(e)}"
        )

@router.post("/generate", response_model=GeneratedDocumentResponse)
def generate_document(
    req: DocumentGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data_dict = req.dict()
    
    # Verify employee exists if employee_id provided
    emp_record = None
    if req.employee_id:
        emp_record = db.query(Employee).filter(Employee.id == req.employee_id).first()
        if not emp_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee ID '{req.employee_id}' was not found."
            )

    try:
        file_path, file_name, doc_num = pdf_service.save_pdf(req.document_type, data_dict)
        
        # Look up template
        template_obj = db.query(DocumentTemplate).filter(
            DocumentTemplate.document_type == req.document_type
        ).first()
        
        # If employee not passed via DB id, try to locate or assign
        assigned_emp_id = emp_record.id if emp_record else None
        if not assigned_emp_id and req.email:
            found_emp = db.query(Employee).filter(Employee.email == req.email.lower().strip()).first()
            if found_emp:
                assigned_emp_id = found_emp.id

        # If still no employee in DB, we can link to first or create a record if necessary
        if not assigned_emp_id:
            # Fallback to create or find first
            first_emp = db.query(Employee).first()
            assigned_emp_id = first_emp.id if first_emp else 1

        history_record = GeneratedDocument(
            employee_id=assigned_emp_id,
            template_id=template_obj.id if template_obj else None,
            document_type=req.document_type,
            document_number=doc_num,
            generated_by=current_user.full_name,
            file_path=file_path,
            file_name=file_name,
            preview_data=json.dumps(data_dict),
            status="Generated"
        )
        
        if req.save_history:
            db.add(history_record)
            db.commit()
            db.refresh(history_record)

        emp_name = emp_record.full_name if emp_record else req.name
        return GeneratedDocumentResponse(
            id=history_record.id,
            employee_id=history_record.employee_id,
            employee_name=emp_name,
            template_id=history_record.template_id,
            document_type=history_record.document_type,
            document_number=history_record.document_number,
            generated_by=history_record.generated_by,
            file_path=history_record.file_path,
            file_name=history_record.file_name,
            status=history_record.status,
            created_at=history_record.created_at
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document generation failed: {str(e)}"
        )

@router.get("/history", response_model=List[GeneratedDocumentResponse])
def get_document_history(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    docs = db.query(GeneratedDocument).order_by(GeneratedDocument.created_at.desc()).offset(skip).limit(limit).all()
    results = []
    for d in docs:
        emp_name = d.employee.full_name if d.employee else "Unknown"
        results.append(
            GeneratedDocumentResponse(
                id=d.id,
                employee_id=d.employee_id,
                employee_name=emp_name,
                template_id=d.template_id,
                document_type=d.document_type,
                document_number=d.document_number,
                generated_by=d.generated_by,
                file_path=d.file_path,
                file_name=d.file_name,
                status=d.status,
                created_at=d.created_at
            )
        )
    return results

@router.get("/employee/{employee_id}", response_model=List[GeneratedDocumentResponse])
def get_employee_document_history(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    docs = db.query(GeneratedDocument).filter(
        GeneratedDocument.employee_id == employee_id
    ).order_by(GeneratedDocument.created_at.desc()).all()
    
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    emp_name = emp.full_name if emp else "Employee"
    
    results = []
    for d in docs:
        results.append(
            GeneratedDocumentResponse(
                id=d.id,
                employee_id=d.employee_id,
                employee_name=emp_name,
                template_id=d.template_id,
                document_type=d.document_type,
                document_number=d.document_number,
                generated_by=d.generated_by,
                file_path=d.file_path,
                file_name=d.file_name,
                status=d.status,
                created_at=d.created_at
            )
        )
    return results

@router.get("/{id}/download")
def download_document(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(GeneratedDocument).filter(GeneratedDocument.id == id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Generated document record with ID {id} not found."
        )
        
    if not doc.file_path or not os.path.exists(doc.file_path):
        # Re-generate on-the-fly if file was cleared
        if doc.preview_data:
            data_dict = json.loads(doc.preview_data)
            pdf_bytes, file_name = pdf_service.generate_pdf_bytes(doc.document_type, data_dict)
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": f'attachment; filename="{doc.file_name or file_name}"'}
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical document file was not found on server storage."
        )

    return FileResponse(
        path=doc.file_path,
        media_type="application/pdf",
        filename=doc.file_name or f"document_{id}.pdf"
    )


@router.post("/{doc_id}/send-email", response_model=SendDocumentEmailResponse)
def send_document_email(
    doc_id: int,
    req: SendDocumentEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a previously generated document as a PDF email attachment
    to the employee's email address.
    """
    # Fetch the generated document record
    doc = db.query(GeneratedDocument).filter(GeneratedDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Generated document with ID {doc_id} not found.",
        )

    # Resolve PDF bytes — from disk file or regenerate on-the-fly
    pdf_bytes: Optional[bytes] = None
    if doc.file_path and os.path.exists(doc.file_path):
        with open(doc.file_path, "rb") as f:
            pdf_bytes = f.read()
    elif doc.preview_data:
        # Regenerate the PDF from stored form data
        data_dict = json.loads(doc.preview_data)
        pdf_bytes, _ = pdf_service.generate_pdf_bytes(doc.document_type, data_dict)

    if not pdf_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF file could not be found or regenerated for this document record.",
        )

    # Build a human-readable filename for the attachment
    safe_name = req.recipient_name.replace(" ", "_").replace("/", "_")
    doc_type_label = doc.document_type.replace("_", "_").title().replace(" ", "")
    pdf_filename = doc.file_name or f"SmartSkale_{doc_type_label}_{safe_name}.pdf"

    result = email_service.send_document_email(
        recipient_email=req.recipient_email,
        recipient_name=req.recipient_name,
        document_type=doc.document_type,
        pdf_bytes=pdf_bytes,
        pdf_filename=pdf_filename,
        subject=req.subject,
        custom_message=req.custom_message,
        sender_display_name=f"{current_user.full_name} via SmartSkale HR",
    )

    # Update status in DB if email sent successfully
    if result["success"]:
        doc.status = "Emailed"
        db.commit()

    return SendDocumentEmailResponse(
        success=result["success"],
        message=result["message"],
    )
