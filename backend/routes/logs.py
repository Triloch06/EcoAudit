from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from database.database import get_db
from models.models import WasteLog, Profile
from schemas.schemas import WasteLogCreate, WasteLogResponse
from dependencies.auth import get_current_user

router = APIRouter(prefix="/logs", tags=["Logs"])

@router.post("", response_model=WasteLogResponse, status_code=201)
def create_log(log: WasteLogCreate, db: Session = Depends(get_db), current_user: Profile = Depends(get_current_user)):
    db_log = WasteLog(**log.model_dump(), user_id=current_user.id)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("", response_model=List[WasteLogResponse])
def get_logs(
    skip: int = 0, 
    limit: int = 100, 
    sort_by: str = Query("date", description="Sort by 'date' or 'weight'"),
    order: str = Query("desc", description="Order 'asc' or 'desc'"),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    query = db.query(WasteLog)
    
    if current_user.role != "admin":
        query = query.filter(WasteLog.user_id == current_user.id)
    
    if sort_by == "weight":
        if order == "asc":
            query = query.order_by(WasteLog.weight.asc())
        else:
            query = query.order_by(WasteLog.weight.desc())
    else:
        # Default sort by date
        if order == "asc":
            query = query.order_by(WasteLog.created_at.asc())
        else:
            query = query.order_by(WasteLog.created_at.desc())
            
    logs = query.offset(skip).limit(limit).all()
    
    if current_user.role == "admin":
        for log in logs:
            if log.user_id:
                profile = db.query(Profile).filter(Profile.id == log.user_id).first()
                if profile:
                    setattr(log, 'user_email', profile.email)
                    
    return logs

@router.delete("/{log_id}", status_code=204)
def delete_log(log_id: str, db: Session = Depends(get_db), current_user: Profile = Depends(get_current_user)):
    db_log = db.query(WasteLog).filter(WasteLog.id == log_id).first()
    if not db_log:
        raise HTTPException(status_code=404, detail="Log not found")
    if current_user.role != "admin" and db_log.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(db_log)
    db.commit()
    return
