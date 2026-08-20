import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture
def auth_headers():
    resp = client.post("/api/auth/login", json={"email": "admin@smartskale.com", "password": "admin123"})
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"

def test_login_invalid():
    resp = client.post("/api/auth/login", json={"email": "admin@smartskale.com", "password": "wrongpassword"})
    assert resp.status_code == 401

def test_dashboard_stats(auth_headers):
    resp = client.get("/api/dashboard", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "active_employees" in data
    assert "total_employees" in data
    assert "pending_employee_ids" in data

def test_list_employees(auth_headers):
    resp = client.get("/api/employees", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] > 0
    assert len(data["items"]) > 0

def test_create_and_assign_employee_id(auth_headers):
    unique_suffix = uuid.uuid4().hex[:6]
    unique_email = f"divyanshu.{unique_suffix}@smartskale.com"
    unique_code = f"SKL-EMP-{unique_suffix.upper()}"
    
    # 1. Create a manual employee
    new_emp_data = {
        "full_name": "Divyanshu Sharma",
        "email": unique_email,
        "phone": "+91 99999 88888",
        "address": "Sector 62, Noida, UP",
        "role": "Lead Architect",
        "department": "Engineering",
        "joining_date": "19-08-2026",
        "status": "Active"
    }
    create_resp = client.post("/api/employees", headers=auth_headers, json=new_emp_data)
    assert create_resp.status_code == 201
    created_emp = create_resp.json()
    emp_id = created_emp["id"]
    assert created_emp["employee_id"] is None  # Initial manual ID must be None

    # 2. Manually assign unique employee ID
    assign_resp = client.put(f"/api/employees/{emp_id}/assign-id", headers=auth_headers, json={"employee_id": unique_code})
    assert assign_resp.status_code == 200
    assert assign_resp.json()["employee_id"] == unique_code

    # 3. Verify duplicate employee ID is rejected
    dup_assign_resp = client.put(f"/api/employees/1/assign-id", headers=auth_headers, json={"employee_id": unique_code})
    assert dup_assign_resp.status_code == 400

def test_document_preview_and_generate(auth_headers):
    # Preview Offer Letter
    preview_resp = client.post("/api/documents/preview", headers=auth_headers, json={
        "document_type": "offer_letter",
        "name": "Divyanshu Sharma",
        "intern_id": "SKL-EMP-9999",
        "role": "Lead Architect",
        "department": "Engineering",
        "date": "19-08-2026"
    })
    assert preview_resp.status_code == 200
    assert "html" in preview_resp.json()
    assert "Divyanshu Sharma" in preview_resp.json()["html"]

    # Preview Certificate
    cert_preview = client.post("/api/documents/preview", headers=auth_headers, json={
        "document_type": "internship_certificate",
        "name": "Divyanshu Sharma",
        "intern_id": "SKL-EMP-9999",
        "department": "Engineering",
        "duration": "3 Months",
        "issue_date": "19-08-2026"
    })
    assert cert_preview.status_code == 200
    assert "Divyanshu Sharma" in cert_preview.json()["html"]

    # Generate Document
    gen_resp = client.post("/api/documents/generate", headers=auth_headers, json={
        "document_type": "offer_letter",
        "name": "Divyanshu Sharma",
        "intern_id": "SKL-EMP-9999",
        "email": "divyanshu.test@smartskale.com",
        "role": "Lead Architect",
        "department": "Engineering",
        "date": "19-08-2026",
        "save_history": True
    })
    assert gen_resp.status_code == 200
    gen_data = gen_resp.json()
    assert gen_data["id"] is not None
    assert gen_data["file_name"].endswith(".pdf")

    # Document History
    history_resp = client.get("/api/documents/history", headers=auth_headers)
    assert history_resp.status_code == 200
    assert len(history_resp.json()) > 0

    # Download Document
    doc_id = gen_data["id"]
    download_resp = client.get(f"/api/documents/{doc_id}/download", headers=auth_headers)
    assert download_resp.status_code == 200
    assert download_resp.headers["content-type"] == "application/pdf"
    assert len(download_resp.content) > 1000
