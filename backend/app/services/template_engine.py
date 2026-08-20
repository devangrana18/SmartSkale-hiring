import os
import io
import base64
import hashlib
import uuid
from jinja2 import Environment, FileSystemLoader, select_autoescape
from typing import Dict, Any, Optional
from datetime import datetime
from app.config import settings

# Template mapping
TEMPLATE_FILES = {
    "offer_letter": "smartskale_offerletter.html",
    "internship_certificate": "smartskale_certificate.html",
    "nda": "smartskale_nda.html",
    "letterhead": "smartskale_letterhead.html"
}

def generate_qr_data_uri(text: str) -> str:
    try:
        import qrcode
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=4,
            border=1,
        )
        qr.add_data(text)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#1a1650", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")
    except Exception:
        return ""

class TemplateEngine:
    def __init__(self, templates_dir: Optional[str] = None):
        self.templates_dir = templates_dir or settings.TEMPLATES_DIR
        self.env = Environment(
            loader=FileSystemLoader(self.templates_dir),
            autoescape=select_autoescape(['html', 'xml'])
        )

    def prepare_context(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalizes and maps form/employee fields to all standard template variables.
        """
        now = datetime.now()
        today_formatted = now.strftime("%d-%m-%Y")
        
        name = data.get("name") or data.get("full_name") or "Employee Name"
        intern_id = data.get("intern_id") or data.get("employee_id") or "SKL-EMP-1001"
        email = data.get("email") or ""
        address = data.get("intern_address") or data.get("address") or "Noida, Uttar Pradesh, India"
        role = data.get("role") or "Full Stack Developer"
        department = data.get("department") or "Technical Development"
        date = data.get("date") or data.get("document_date") or data.get("joining_date") or today_formatted
        duration = data.get("duration") or "3 Months"
        start_date = data.get("start_date") or date
        end_date = data.get("end_date") or "3 Months from Start Date"
        issue_date = data.get("issue_date") or date
        raw_cert_no = data.get("certificate_no") or intern_id.replace("SKL-", "")
        certificate_no = raw_cert_no
        cert_number = f"SS/IS-{raw_cert_no}" if not str(raw_cert_no).startswith("SS/") else raw_cert_no
        verify_url = data.get("verify_url") or f"https://smartskale.com/verify?id={intern_id or certificate_no}"
        stipend = data.get("stipend") or "Unpaid / Performance Stipend"
        reference_number = data.get("reference_number") or intern_id or f"SS/REF/{now.year}/{certificate_no}"
        custom_content = data.get("custom_content") or ""

        # Generate security hash & UUID
        doc_uuid = str(uuid.uuid4())
        canonical_str = f"{cert_number}|{doc_uuid}|{name}|{intern_id}|{department}|{duration}|{start_date}|{end_date}|{issue_date}"
        security_hash = f"SHA-256: {hashlib.sha256(canonical_str.encode('utf-8')).hexdigest()}"
        security_issued = f"Issued: {now.strftime('%Y-%m-%d %H:%M:%S UTC')} · UUID: {doc_uuid.upper()}"
        qr_code_data_uri = generate_qr_data_uri(verify_url)

        context = {
            "name": name,
            "employee_name": name,
            "intern_id": intern_id,
            "employee_id": intern_id,
            "email": email,
            "intern_address": address,
            "address": address,
            "role": role,
            "department": department,
            "date": date,
            "joining_date": date,
            "document_date": date,
            "duration": duration,
            "start_date": start_date,
            "end_date": end_date,
            "issue_date": issue_date,
            "certificate_no": certificate_no,
            "cert_number": cert_number,
            "verify_url": verify_url,
            "qr_code_data_uri": qr_code_data_uri,
            "security_hash": security_hash,
            "security_issued": security_issued,
            "stipend": stipend,
            "reference_number": reference_number,
            "custom_content": custom_content,
            "year": str(now.year)
        }
        return context

    def render_template(self, doc_type: str, data: Dict[str, Any]) -> str:
        file_name = TEMPLATE_FILES.get(doc_type.lower())
        if not file_name:
            raise ValueError(f"Unknown document type '{doc_type}'. Available: {list(TEMPLATE_FILES.keys())}")
        
        template = self.env.get_template(file_name)
        context = self.prepare_context(data)
        return template.render(**context)

template_engine = TemplateEngine()

