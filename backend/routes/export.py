from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database.database import get_db
from models.models import WasteLog, Profile
from services.export_service import generate_excel, generate_pdf
from dependencies.auth import get_current_user

router = APIRouter(prefix="/export", tags=["Export"])

@router.get("/excel")
def export_excel(db: Session = Depends(get_db), current_user: Profile = Depends(get_current_user)):
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
def export_pdf(db: Session = Depends(get_db), current_user: Profile = Depends(get_current_user)):
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
