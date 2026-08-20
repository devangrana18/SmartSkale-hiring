from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Dict, Any, Optional, Tuple
from app.models.models import Employee, EmployeeStatus
from app.schemas.schemas import EmployeeCreate, EmployeeUpdate, SyncResponse
from app.services.google_service import google_service
import logging

logger = logging.getLogger(__name__)

class EmployeeService:
    def get_employees(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        status: Optional[str] = None,
        department: Optional[str] = None,
        pending_id_only: bool = False
    ) -> Tuple[List[Employee], int]:
        query = db.query(Employee)
        
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Employee.full_name.ilike(search_term),
                    Employee.email.ilike(search_term),
                    Employee.employee_id.ilike(search_term),
                    Employee.role.ilike(search_term),
                    Employee.department.ilike(search_term)
                )
            )
            
        if status and status != "All":
            query = query.filter(Employee.status == status)
            
        if department and department != "All":
            query = query.filter(Employee.department == department)
            
        if pending_id_only:
            query = query.filter(or_(Employee.employee_id == None, Employee.employee_id == ""))
            
        total = query.count()
        employees = query.order_by(Employee.created_at.desc()).offset(skip).limit(limit).all()
        return employees, total

    def get_employee_by_id(self, db: Session, employee_id: int) -> Optional[Employee]:
        return db.query(Employee).filter(Employee.id == employee_id).first()

    def get_employee_by_email(self, db: Session, email: str) -> Optional[Employee]:
        return db.query(Employee).filter(Employee.email.ilike(email.strip())).first()

    def get_employee_by_emp_code(self, db: Session, emp_code: str) -> Optional[Employee]:
        return db.query(Employee).filter(Employee.employee_id == emp_code.strip()).first()

    def create_employee(self, db: Session, data: EmployeeCreate, source: str = "manual") -> Employee:
        email = data.email.strip().lower()
        if self.get_employee_by_email(db, email):
            raise ValueError(f"An employee with email '{email}' already exists.")
        
        # Check uniqueness of manually assigned employee_id if provided
        if data.employee_id and data.employee_id.strip():
            emp_code = data.employee_id.strip()
            if self.get_employee_by_emp_code(db, emp_code):
                raise ValueError(f"Employee ID '{emp_code}' is already assigned to another employee.")
        else:
            emp_code = None

        employee = Employee(
            full_name=data.full_name.strip(),
            email=email,
            phone=data.phone.strip() if data.phone else None,
            address=data.address.strip() if data.address else None,
            role=data.role.strip() if data.role else None,
            department=data.department.strip() if data.department else None,
            joining_date=data.joining_date.strip() if data.joining_date else None,
            status=data.status or EmployeeStatus.ACTIVE.value,
            duration=data.duration.strip() if data.duration else None,
            start_date=data.start_date.strip() if data.start_date else None,
            end_date=data.end_date.strip() if data.end_date else None,
            stipend=data.stipend.strip() if data.stipend else None,
            reference_number=data.reference_number.strip() if data.reference_number else None,
            employee_id=emp_code,
            source=source
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)
        return employee

    def update_employee(self, db: Session, employee_id: int, data: EmployeeUpdate) -> Employee:
        employee = self.get_employee_by_id(db, employee_id)
        if not employee:
            raise ValueError(f"Employee with ID {employee_id} not found.")
        
        # If email is changing, check uniqueness
        if data.email:
            new_email = data.email.strip().lower()
            if new_email != employee.email:
                existing = self.get_employee_by_email(db, new_email)
                if existing and existing.id != employee.id:
                    raise ValueError(f"Email '{new_email}' is already in use by another employee.")
                employee.email = new_email

        # If employee_id is changing, check uniqueness
        if data.employee_id is not None:
            new_emp_code = data.employee_id.strip() if data.employee_id else None
            if new_emp_code and new_emp_code != employee.employee_id:
                existing = self.get_employee_by_emp_code(db, new_emp_code)
                if existing and existing.id != employee.id:
                    raise ValueError(f"Employee ID '{new_emp_code}' is already assigned to another employee.")
            employee.employee_id = new_emp_code

        # Update other fields
        for field, value in data.dict(exclude_unset=True, exclude={"email", "employee_id"}).items():
            if value is not None:
                setattr(employee, field, value.strip() if isinstance(value, str) else value)

        db.commit()
        db.refresh(employee)
        return employee

    def assign_employee_id(self, db: Session, id: int, employee_id_code: str) -> Employee:
        employee = self.get_employee_by_id(db, id)
        if not employee:
            raise ValueError(f"Employee with ID {id} not found.")
        
        emp_code = employee_id_code.strip()
        if not emp_code:
            raise ValueError("Employee ID cannot be empty.")
            
        existing = self.get_employee_by_emp_code(db, emp_code)
        if existing and existing.id != employee.id:
            raise ValueError(f"Employee ID '{emp_code}' is already assigned to employee '{existing.full_name}'.")
            
        employee.employee_id = emp_code
        db.commit()
        db.refresh(employee)
        return employee

    def delete_employee(self, db: Session, employee_id: int) -> bool:
        employee = self.get_employee_by_id(db, employee_id)
        if not employee:
            return False
        db.delete(employee)
        db.commit()
        return True

    def sync_from_spreadsheet(self, db: Session, custom_records: Optional[List[Dict[str, Any]]] = None) -> SyncResponse:
        """
        Synchronizes employee records from Google Drive / spreadsheet:
        1. Fetch raw data from Google Drive / export / custom.
        2. Match by email identifier.
        3. Insert new records (with employee_id=None unless specified).
        4. Update existing records without overwriting HR-assigned employee_id!
        5. Return structured sync statistics.
        """
        raw_records = custom_records if custom_records is not None else google_service.fetch_employees_data()
        
        total_processed = 0
        new_count = 0
        updated_count = 0
        skipped_count = 0
        errors = []

        for record in raw_records:
            total_processed += 1
            name = record.get("full_name") or record.get("name")
            email = record.get("email")

            if not email or "@" not in email:
                skipped_count += 1
                errors.append(f"Row {total_processed}: Skipped invalid email '{email}'.")
                continue

            if not name:
                skipped_count += 1
                errors.append(f"Row {total_processed}: Skipped employee with empty name.")
                continue

            email_clean = email.strip().lower()
            name_clean = name.strip()

            existing_employee = self.get_employee_by_email(db, email_clean)

            if existing_employee:
                # Update existing record, PRESERVING existing HR-assigned employee_id!
                existing_employee.full_name = name_clean
                if record.get("phone"):
                    existing_employee.phone = record.get("phone").strip()
                if record.get("address"):
                    existing_employee.address = record.get("address").strip()
                if record.get("role"):
                    existing_employee.role = record.get("role").strip()
                if record.get("department"):
                    existing_employee.department = record.get("department").strip()
                if record.get("joining_date"):
                    existing_employee.joining_date = record.get("joining_date").strip()
                if record.get("duration"):
                    existing_employee.duration = record.get("duration").strip()
                if record.get("reference_number"):
                    existing_employee.reference_number = record.get("reference_number").strip()
                if record.get("status"):
                    existing_employee.status = record.get("status").strip()
                    
                updated_count += 1
            else:
                # Create new employee with employee_id = None (Strict Rule: Manual assignment only)
                new_emp = Employee(
                    full_name=name_clean,
                    email=email_clean,
                    phone=record.get("phone", "").strip() or None,
                    address=record.get("address", "").strip() or None,
                    role=record.get("role", "Full Stack Gen AI Intern").strip(),
                    department=record.get("department", "Technical Development").strip(),
                    joining_date=record.get("joining_date", "").strip() or None,
                    status=record.get("status", EmployeeStatus.ACTIVE.value).strip(),
                    duration=record.get("duration", "3 Months").strip(),
                    reference_number=record.get("reference_number", "").strip() or None,
                    employee_id=None,  # NEVER automatically assigned
                    source="google_drive"
                )
                db.add(new_emp)
                new_count += 1

        db.commit()

        return SyncResponse(
            success=True,
            message=f"Sync completed successfully. {new_count} new employees added, {updated_count} updated, {skipped_count} skipped.",
            total_records_processed=total_processed,
            new_employees_count=new_count,
            updated_employees_count=updated_count,
            skipped_employees_count=skipped_count,
            errors=errors
        )

employee_service = EmployeeService()
