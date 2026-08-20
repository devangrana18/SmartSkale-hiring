from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.database import get_db
from app.models.models import Employee, User
from app.schemas.schemas import (
    EmployeeResponse,
    EmployeeCreate,
    EmployeeUpdate,
    AssignEmployeeId,
    SyncResponse
)
from app.services.employee_service import employee_service
from app.services.google_service import google_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/employees", tags=["Employee Management"])

@router.get("", response_model=Dict[str, Any])
def list_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
    pending_id_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    employees, total = employee_service.get_employees(
        db,
        skip=skip,
        limit=limit,
        search=search,
        status=status,
        department=department,
        pending_id_only=pending_id_only
    )
    return {
        "total": total,
        "items": [EmployeeResponse.from_orm(emp) for emp in employees],
        "skip": skip,
        "limit": limit
    }

@router.get("/{id}", response_model=EmployeeResponse)
def get_employee(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    emp = employee_service.get_employee_by_id(db, id)
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID '{id}' was not found."
        )
    return emp

@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    employee_in: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        new_emp = employee_service.create_employee(db, employee_in, source="manual")
        return new_emp
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/{id}", response_model=EmployeeResponse)
def update_employee(
    id: int,
    employee_in: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        updated_emp = employee_service.update_employee(db, id, employee_in)
        return updated_emp
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/{id}/assign-id", response_model=EmployeeResponse)
def assign_employee_id(
    id: int,
    data: AssignEmployeeId,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        emp = employee_service.assign_employee_id(db, id, data.employee_id)
        return emp
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{id}")
def delete_employee(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    success = employee_service.delete_employee(db, id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID '{id}' was not found."
        )
    return {"success": True, "message": f"Employee {id} was deleted successfully."}

@router.post("/sync", response_model=SyncResponse)
def sync_employees_from_google_drive(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = employee_service.sync_from_spreadsheet(db)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Spreadsheet synchronization failed: {str(e)}"
        )

@router.post("/upload-excel", response_model=SyncResponse)
async def upload_and_sync_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload an Excel (.xlsx) or CSV file."
        )
    try:
        content = await file.read()
        records = google_service.fetch_from_excel_file(content)
        result = employee_service.sync_from_spreadsheet(db, custom_records=records)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse and sync uploaded file: {str(e)}"
        )
