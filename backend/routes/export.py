from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database.database import get_db
from models.models import WasteLog, Profile
from services.export_service import generate_excel, generate_pdf
from dependencies.auth import get_current_user
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(prefix="/export", tags=["Export"])
limiter = Limiter(key_func=get_remote_address)

@router.get("/excel")
@limiter.limit("5/minute")
def export_excel(request: Request, db: Session = Depends(get_db), current_user: Profile = Depends(get_current_user)):
    query = db.query(WasteLog)
    if current_user.role != "admin":
        query = query.filter(WasteLog.user_id == current_user.id)
    logs = query.order_by(WasteLog.created_at.desc()).all()
    stream = generate_excel(logs)
    
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=waste_logs.xlsx"}
    )

@router.get("/pdf")
@limiter.limit("5/minute")
def export_pdf(request: Request, db: Session = Depends(get_db), current_user: Profile = Depends(get_current_user)):
    query = db.query(WasteLog)
    if current_user.role != "admin":
        query = query.filter(WasteLog.user_id == current_user.id)
    logs = query.order_by(WasteLog.created_at.desc()).all()
    stream = generate_pdf(logs)
    
    return StreamingResponse(
        stream,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=waste_logs.pdf"}
    )
