from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.models import Employee, EmployeeStatus, GeneratedDocument, User
from app.schemas.schemas import DashboardStats, EmployeeResponse
from app.utils.security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardStats)
def get_dashboard_statistics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_employees = db.query(Employee).count()
    active_employees = db.query(Employee).filter(Employee.status == EmployeeStatus.ACTIVE.value).count()
    inactive_employees = db.query(Employee).filter(Employee.status == EmployeeStatus.INACTIVE.value).count()
    onboarding_employees = db.query(Employee).filter(Employee.status == EmployeeStatus.ONBOARDING.value).count()
    
    # Pending Employee IDs: count where employee_id is None or empty string
    pending_ids = db.query(Employee).filter(
        (Employee.employee_id == None) | (Employee.employee_id == "")
    ).count()

    # Recent employees (last 5)
    recent_employees = db.query(Employee).order_by(Employee.created_at.desc()).limit(5).all()

    # Total documents generated
    doc_count = db.query(GeneratedDocument).count()

    # Department distribution
    dept_rows = db.query(
        Employee.department, func.count(Employee.id)
    ).group_by(Employee.department).all()
    
    dept_distribution = {}
    for dept, count in dept_rows:
        key = dept if dept else "General"
        dept_distribution[key] = count

    return DashboardStats(
        active_employees=active_employees,
        total_employees=total_employees,
        pending_employee_ids=pending_ids,
        inactive_employees=inactive_employees,
        onboarding_employees=onboarding_employees,
        recent_employees=recent_employees,
        documents_generated_count=doc_count,
        department_distribution=dept_distribution
    )
