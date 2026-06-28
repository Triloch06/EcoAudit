import os
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
from database.database import engine, Base
from routes import logs, analytics, export
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create database tables automatically
Base.metadata.create_all(bind=engine)

debug_mode = os.getenv("DEBUG", "False").lower() == "true"
app = FastAPI(
    title="EcoAudit - Community Waste Logger",
    docs_url="/docs" if debug_mode else None,
    redoc_url="/redoc" if debug_mode else None,
)

# Rate Limiter setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Middlewares
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

@app.middleware("http")
async def request_size_limit_middleware(request: Request, call_next):
    # 1MB size limit
    if "content-length" in request.headers:
        content_length = int(request.headers.get("content-length"))
        if content_length > 1024 * 1024:
            return JSONResponse(
                status_code=413,
                content={"success": False, "message": "Request entity too large", "errors": []}
            )
    return await call_next(request)

# Configure CORS
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"success": False, "message": "Validation Error", "errors": exc.errors()}
    )

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Internal Server Error", "errors": []}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}")
    # If the exception is an HTTPException, we might want to return its code
    from fastapi import HTTPException
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "message": exc.detail, "errors": []}
        )
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Internal Server Error", "errors": []}
    )

# Include routers
app.include_router(logs.router)
app.include_router(analytics.router)
app.include_router(export.router)

@app.get("/")
@limiter.limit("30/minute")
def read_root(request: Request):
    return {"success": True, "message": "Welcome to EcoAudit API", "data": {}}
