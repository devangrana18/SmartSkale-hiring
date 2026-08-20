import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import auth, dashboard, employees, documents, templates
from app.utils.seed_data import seed_database

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("smartskale_backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database schema and seed data...")
    seed_database()
    logger.info("SmartSkale backend successfully initialized.")
    yield
    logger.info("SmartSkale backend shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for SmartSkale Hiring & Employee Document Management System",
    lifespan=lifespan
)

# Run seed directly on startup so it's guaranteed even in test clients
seed_database()

# CORS Configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(employees.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(templates.router, prefix=settings.API_V1_STR)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": f"An error occurred while processing your request: {str(exc)}",
            "path": request.url.path
        }
    )

@app.get("/")
def root():
    return {
        "message": "Welcome to SmartSkale Hiring & Employee Document Management System API",
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}
