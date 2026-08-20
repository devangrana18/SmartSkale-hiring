# SmartSkale Hiring & Employee Document Management System

A production-ready full-stack enterprise web application built for **SmartSkale** to streamline the hiring and onboarding workflow. The system automatically synchronizes candidate responses from Google Forms / Google Sheets, provides an HR management directory with strict manual Employee ID assignment, and renders live, pixel-accurate previews of official SmartSkale HTML templates (Offer Letters, Internship Certificates, NDAs, Letterheads) with automated server-side PDF generation and download history.

---

## 1. Architectural Overview

```
                          ┌─────────────────────────────┐
                          │   React + Vite + Tailwind   │
                          │   TypeScript Single Page App│
                          └──────────────┬──────────────┘
                                         │ REST APIs (JSON / JWT)
                                         ▼
                          ┌─────────────────────────────┐
                          │   FastAPI Python Backend    │
                          │      (Uvicorn / Asgi)       │
                          └──────┬───────────────┬──────┘
                                 │               │
                 ┌───────────────┴────┐     ┌────┴───────────────────────────┐
                 │ PostgreSQL / SQLite│     │  Google Drive & Sheets Bridge  │
                 │    (SQLAlchemy)    │     │  - Service Account API / OAuth │
                 └────────────────────┘     │  - Direct Public Export Sync   │
                                            │  - Local Excel / CSV Parser    │
                                            └────┬───────────────────────────┘
                                                 │
                                            ┌────┴───────────────────────────┐
                                            │ SmartSkale Template Engine     │
                                            │  - Jinja2 Dynamic Rendering    │
                                            │  - xhtml2pdf / PDF Generator   │
                                            │  - Audit Log & Storage Service │
                                            └────────────────────────────────┘
```

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Bundler & Dev Server**: Vite
- **Styling**: Tailwind CSS with custom SmartSkale Navy (`#1a1650`) & Indigo (`#534AB7`) palette
- **Routing**: React Router DOM (v6+)
- **API Client**: Axios with automatic JWT Bearer interceptor & error normalization
- **Icons**: Lucide React

### Backend
- **Framework**: Python 3.10+ / FastAPI
- **Data Validation & Settings**: Pydantic v2 & Pydantic-Settings
- **ORM & Database**: SQLAlchemy 2.0 (PostgreSQL ready, SQLite zero-setup default)
- **Authentication**: JWT (JSON Web Tokens) with PBKDF2/Bcrypt password hashing
- **Template Engine**: Jinja2 with custom SmartSkale placeholder mappings
- **PDF Generation**: xhtml2pdf & ReportLab with full vector/base64 asset preservation
- **Spreadsheet Processing**: `google-api-python-client`, `google-auth`, `openpyxl`, `csv`
- **Testing**: Pytest with HTTPX TestClient

---

## 3. Key Business Rules Implemented

1. **Strict Employee ID Rule**:
   - As mandated, **Employee ID is NEVER automatically generated**.
   - Newly synced candidates initially have no `employee_id` assigned (`null`).
   - HR assigns or edits the Employee ID manually via the web UI with uniqueness validation.
   - Re-synchronizing with Google Drive / Google Sheets strictly **preserves existing HR-assigned Employee IDs** and will never overwrite or erase them.
2. **Live Two-Column Document Generation UI**:
   - Faithfully follows the handwritten wireframe layout:
     - **Left Column**: Document Type selector, Data Source toggle (Excel records vs Manual entry), Searchable candidate selector, full editable candidate details form, and Generate/Download buttons.
     - **Right Column**: Live, isolated sandbox preview iframe displaying the exact SmartSkale HTML template with instant dynamic value updates, zoom controls (75%, 100%, 125%, Fit), print preview, and fullscreen inspection.
3. **Multi-Tier Google Drive Integration**:
   - Supports official Google Cloud Service Account JSON credentials.
   - Supports direct Google Sheet export endpoints for immediate zero-config synchronization.
   - Supports local Excel `.xlsx` / `.csv` file upload and built-in safe seed demo fallback.

---

## 4. SmartSkale HTML Templates

The system uses the 4 official SmartSkale HTML templates located in `backend/templates/`:
- `smartskale_offerletter.html`: SmartSkale Internship Offer Letter
- `smartskale_certificate.html`: SmartSkale Internship Completion Certificate with verification URL and security hash
- `smartskale_nda.html`: SmartSkale Non-Disclosure & Confidentiality Agreement
- `smartskale_letterhead.html`: Official SmartSkale branded letterhead for custom notices

### Unified Template Placeholders:
| Placeholder | Mapped Employee Attribute |
|---|---|
| `{{ name }}` / `{{ employee_name }}` | Candidate Full Name |
| `{{ intern_id }}` / `{{ employee_id }}` | HR-assigned Employee ID or Reference Number |
| `{{ email }}` | Email Address |
| `{{ intern_address }}` / `{{ address }}` | Residential / Permanent Address |
| `{{ role }}` | Designation / Role Title |
| `{{ department }}` | Department / Domain |
| `{{ date }}` / `{{ joining_date }}` | Document / Start Date |
| `{{ duration }}` | Internship Duration (e.g., "3 Months") |
| `{{ start_date }}` | Commencement Date |
| `{{ end_date }}` | Completion Date |
| `{{ certificate_no }}` | Certificate Serial Number |
| `{{ verify_url }}` | Verification Link |
| `{{ custom_content }}` | Custom Letterhead Content |

---

## 5. Folder Structure

```
SmartSkale Hiring System2/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entry point, CORS, exception handlers
│   │   ├── config.py                # Environment configuration (Pydantic Settings)
│   │   ├── database.py              # SQLAlchemy engine, session maker, base model
│   │   ├── models/
│   │   │   └── models.py            # User, Employee, DocumentTemplate, GeneratedDocument models
│   │   ├── schemas/
│   │   │   └── schemas.py           # Pydantic request/response validation models
│   │   ├── routers/
│   │   │   ├── auth.py              # POST /login, GET /me, POST /register
│   │   │   ├── dashboard.py         # GET /dashboard (dynamic KPI metrics)
│   │   │   ├── employees.py         # CRUD, assign-id, sync, upload-excel
│   │   │   ├── documents.py         # preview, generate, history, download
│   │   │   └── templates.py         # list and get templates
│   │   ├── services/
│   │   │   ├── google_service.py    # Google Drive / Sheets API & CSV parser
│   │   │   ├── employee_service.py  # Employee business logic, manual ID assignment, sync
│   │   │   ├── template_engine.py   # Jinja2 template renderer
│   │   │   └── pdf_service.py       # xhtml2pdf PDF conversion & file storage
│   │   └── utils/
│   │       ├── security.py          # Password hashing & JWT token verification
│   │       └── seed_data.py         # Database initialization & default admin seeder
│   ├── templates/                   # Official SmartSkale HTML templates
│   ├── generated_documents/         # Generated PDF files storage directory
│   ├── tests/
│   │   └── test_backend.py          # Pytest automated test suite
│   └── requirements.txt             # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts            # Axios instance with auth interceptors
│   │   │   └── services.ts          # API service calls
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Global navigation & quick sync button
│   │   │   ├── Sidebar.tsx          # Menu & pending IDs notification badge
│   │   │   ├── Layout.tsx           # Main application shell
│   │   │   ├── StatCard.tsx         # Dashboard metrics card
│   │   │   ├── StatusBadge.tsx      # Status color pill
│   │   │   ├── AssignIdModal.tsx    # HR Manual Employee ID assignment modal
│   │   │   ├── EmployeeModal.tsx    # Employee create/edit drawer
│   │   │   ├── SyncModal.tsx        # Spreadsheet sync & upload modal
│   │   │   └── Toast.tsx            # Alert toast notification system
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # Authentication state provider
│   │   ├── pages/
│   │   │   ├── Login.tsx            # HR Login portal with demo auto-fill
│   │   │   ├── Dashboard.tsx        # KPI metrics & quick generator shortcuts
│   │   │   ├── Employees.tsx        # Searchable employee table with filters & actions
│   │   │   ├── EmployeeDetails.tsx  # Profile view + document history tab
│   │   │   ├── DocumentGenerator.tsx# Live dual-column generator & real-time preview
│   │   │   └── DocumentHistory.tsx  # Document audit log & PDF download
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript definitions
│   │   ├── App.tsx                  # Routes & ProtectedRoute configuration
│   │   ├── main.tsx                 # Root render
│   │   └── index.css                # Tailwind CSS & design tokens
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── .env.example                     # Environment template
└── README.md                        # Documentation
```

---

## 6. Environment Configuration (`.env`)

Create a `.env` file in the root directory (or copy from `.env.example`):

```env
# Application Settings
PROJECT_NAME="SmartSkale Hiring & Employee Document Management System"
VERSION="1.0.0"

# Backend Server
PORT=8000
HOST="0.0.0.0"

# Security & JWT Authentication
SECRET_KEY="smartskale_super_secret_jwt_key_2026_production_grade"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database (PostgreSQL or SQLite)
DATABASE_URL="sqlite:///./smartskale.db"
# For PostgreSQL:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/smartskale_db"

# Google Drive & Sheets Integration
GOOGLE_DRIVE_FILE_ID="1fXKpV71je5JPQRH1Xerx28F0E0ELCOwn"
GOOGLE_SHEET_NAME="Form Responses 1"

# Service Account Credentials (Optional for private enterprise sheets):
GOOGLE_SERVICE_ACCOUNT_JSON=""

# Frontend URL
FRONTEND_URL="http://localhost:5173"
```

---

## 7. Google Cloud & Drive Setup Instructions

To configure your own Google Cloud Service Account for enterprise private spreadsheets:

1. **Create a Google Cloud Project**:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Click **Create Project** and name it (e.g., `smartskale-hr-system`).
2. **Enable APIs**:
   - Navigate to **APIs & Services** > **Library**.
   - Search for and enable **Google Drive API**.
   - Search for and enable **Google Sheets API**.
3. **Create Service Account**:
   - Navigate to **APIs & Services** > **Credentials**.
   - Click **Create Credentials** > **Service Account**.
   - Enter a name (e.g. `smartskale-sheet-sync`).
   - Grant role: **Viewer** or **Editor**.
4. **Generate Key JSON**:
   - Under the newly created service account, go to the **Keys** tab.
   - Click **Add Key** > **Create new key** > **JSON**.
   - Download the key file (e.g. `credentials.json`).
5. **Share Spreadsheet with Service Account**:
   - Open your Google Sheet in Google Drive.
   - Click **Share** (top-right).
   - Add the Service Account email (e.g. `smartskale-sheet-sync@project.iam.gserviceaccount.com`) with **Viewer** access.
6. **Configure `.env`**:
   - Extract the Spreadsheet ID from the URL (`https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`).
   - Set `GOOGLE_DRIVE_FILE_ID=<SPREADSHEET_ID>`.
   - Set `GOOGLE_SERVICE_ACCOUNT_JSON="/path/to/credentials.json"` in your `.env`.

---

## 8. Installation & Running Locally

### Prerequisites
- Python 3.10+
- Node.js v18+ & npm v9+

### 1. Start the Backend API

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run the backend server
uvicorn app.main:app --reload --port 8000
```
- API will be accessible at: `http://localhost:8000`
- Interactive Swagger API Documentation: `http://localhost:8000/docs`

### 2. Start the Frontend Application

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
- Frontend application will be accessible at: `http://localhost:5173`

---

## 9. Default Demo Credentials

| Role | Email | Password |
|---|---|---|
| **HR Administrator** | `hr@smartskale.com` | `admin123` |

*(A "Use Demo HR Credentials" button is provided directly on the login screen for quick one-click login).*

---

## 10. End-to-End Workflow Verification

1. **Login**: Navigate to `http://localhost:5173/login` and log in with `hr@smartskale.com` / `admin123`.
2. **Dashboard**: View live active employee count, pending employee IDs count, recent imports, and department distribution.
3. **Synchronize Candidates**:
   - Go to **Employees** or click **Sync Sheet** in the navbar.
   - Click **Sync with Google Drive Now** to fetch form responses from the configured spreadsheet.
   - Review sync result popup showing added, updated, and skipped records.
4. **Manual Employee ID Assignment**:
   - Notice employees without IDs display an **Assign ID** amber button.
   - Click **Assign ID** and enter a unique code (e.g., `SKL-EMP-1042`).
   - Save and verify the ID is persisted in the database.
   - Re-sync from Google Drive; verify `SKL-EMP-1042` is **NOT** overwritten!
5. **Document Generation**:
   - Open **Document Generator**.
   - Select template: **Offer Letter**, **Internship Certificate**, or **NDA**.
   - Choose candidate from the searchable dropdown or enter details manually.
   - Observe the live responsive preview updating in the right-hand panel in real time.
   - Click **Generate & Download PDF** to generate the official document, store it in the audit history, and download the print-ready PDF.
6. **Audit History**:
   - Open **Document History** to view past generated documents with date stamps and re-download links.

---

## 11. Running Automated Tests

```bash
# Run backend pytest suite
cd backend
python -m pytest tests -v
```

```bash
# Run frontend TypeScript build validation
cd frontend
npm run build
```

---

## 12. Production Deployment Notes

- **Database**: Set `DATABASE_URL="postgresql://user:password@hostname:5432/dbname"` in `.env`.
- **JWT Secret**: Generate a cryptographically secure key: `python -c "import secrets; print(secrets.token_hex(32))"`.
- **CORS**: Configure `FRONTEND_URL` in `.env` to match your production domain.
- **Reverse Proxy**: Serve FastAPI with Gunicorn/Uvicorn behind Nginx with SSL/TLS termination.
#   S m a r t S k a l e - h i r i n g  
 