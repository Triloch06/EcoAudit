from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text, Numeric
from database.database import get_db
from models.models import WasteLog, Profile
from schemas.schemas import AnalyticsResponse, HighestAreaResponse
from dependencies.auth import get_current_user
from typing import Optional

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("", response_model=AnalyticsResponse)
def get_analytics(db: Session = Depends(get_db), current_user: Profile = Depends(get_current_user)):
    query = db.query(WasteLog)
    
    if current_user.role != "admin":
        query = query.filter(WasteLog.user_id == current_user.id)
        
    total_waste = db.query(func.sum(WasteLog.weight)).filter(WasteLog.id.in_(query.with_entities(WasteLog.id))).scalar() or 0.0
    total_entries = query.count()
    
    category_totals_query = db.query(
        WasteLog.category, func.sum(WasteLog.weight).label('total_weight')
    ).filter(WasteLog.id.in_(query.with_entities(WasteLog.id))).group_by(WasteLog.category).all()
    
    category_totals = {cat: float(weight) for cat, weight in category_totals_query}
    
    most_logged_category = None
    if category_totals_query:
        sorted_categories = sorted(category_totals_query, key=lambda x: x[1], reverse=True)
        most_logged_category = sorted_categories[0][0]
        
    latest_entry = db.query(func.max(WasteLog.created_at)).filter(WasteLog.id.in_(query.with_entities(WasteLog.id))).scalar()
    
    return AnalyticsResponse(
        total_waste=float(total_waste),
        total_entries=total_entries,
        category_totals=category_totals,
        most_logged_category=most_logged_category,
        latest_entry=latest_entry
    )

@router.get("/highest-area", response_model=Optional[HighestAreaResponse])
def get_highest_area(db: Session = Depends(get_db), current_user: Profile = Depends(get_current_user)):
    query = db.query(WasteLog)
    
    if current_user.role != "admin":
        query = query.filter(WasteLog.user_id == current_user.id)
        
    # Group by rounded lat/lon to define an "area" (e.g. 2 decimal places is ~1km)
    rounded_lat = func.round(func.cast(WasteLog.latitude, Numeric), 2)
    rounded_lon = func.round(func.cast(WasteLog.longitude, Numeric), 2)
    
    area_query = db.query(
        rounded_lat.label('lat'),
        rounded_lon.label('lon'),
        func.sum(WasteLog.weight).label('total_weight'),
        func.count(WasteLog.id).label('entry_count')
    ).filter(WasteLog.id.in_(query.with_entities(WasteLog.id)))\
     .group_by(rounded_lat, rounded_lon)\
     .order_by(text('total_weight DESC'))\
     .first()
     
    if not area_query:
        return None
        
    return HighestAreaResponse(
        latitude=float(area_query.lat),
        longitude=float(area_query.lon),
        total_weight=float(area_query.total_weight),
        entry_count=area_query.entry_count
    )
