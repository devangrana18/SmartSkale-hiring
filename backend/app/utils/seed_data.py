import logging
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app.models.models import User, Employee, DocumentTemplate, UserRole
from app.utils.security import get_password_hash
from app.services.employee_service import employee_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Seed HR Admin User if admin@smartskale.com does not exist
        admin_user = db.query(User).filter(User.email == "admin@smartskale.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@smartskale.com",
                hashed_password=get_password_hash("admin123"),
                full_name="SmartSkale HR Admin",
                role=UserRole.ADMIN.value,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            logger.info("Admin user seeded: admin@smartskale.com")

        # 2. Seed Document Templates
        templates_data = [
            {
                "name": "SmartSkale Internship Offer Letter",
                "document_type": "offer_letter",
                "file_name": "smartskale_offerletter.html",
                "description": "Standard official SmartSkale Internship Offer Letter with terms, role details, and signatures."
            },
            {
                "name": "SmartSkale Certificate of Internship",
                "document_type": "internship_certificate",
                "file_name": "smartskale_certificate.html",
                "description": "Formal certificate of internship completion with verification URL and security hash."
            },
            {
                "name": "SmartSkale Non-Disclosure Agreement (NDA)",
                "document_type": "nda",
                "file_name": "smartskale_nda.html",
                "description": "Comprehensive proprietary confidentiality and intellectual property agreement."
            },
            {
                "name": "SmartSkale Official Letterhead",
                "document_type": "letterhead",
                "file_name": "smartskale_letterhead.html",
                "description": "SmartSkale branded corporate letterhead for general HR and company announcements."
            }
        ]

        for t_info in templates_data:
            existing_template = db.query(DocumentTemplate).filter(
                DocumentTemplate.document_type == t_info["document_type"]
            ).first()
            if not existing_template:
                template = DocumentTemplate(
                    name=t_info["name"],
                    document_type=t_info["document_type"],
                    file_name=t_info["file_name"],
                    description=t_info["description"],
                    version="1.0.0",
                    is_active=True
                )
                db.add(template)
        db.commit()
        logger.info("Document templates verified/seeded.")

        # 3. Initial sync or seed employees if database is empty
        emp_count = db.query(Employee).count()
        if emp_count == 0:
            logger.info("Syncing initial employee data from Google Drive / spreadsheet...")
            try:
                employee_service.sync_from_spreadsheet(db)
            except Exception as e:
                logger.warning(f"Initial sync notice: {e}")

    except Exception as e:
        logger.error(f"Error during DB seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
