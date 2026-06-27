from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from uuid import UUID

class WasteLogBase(BaseModel):
    category: str = Field(..., min_length=1)
    weight: float = Field(..., gt=0, description="Weight must be positive")
    latitude: float
    longitude: float
    accuracy: float

class WasteLogCreate(WasteLogBase):
    pass

class WasteLogResponse(WasteLogBase):
    id: UUID
    created_at: datetime
    user_email: Optional[str] = None

    class Config:
        from_attributes = True

class AnalyticsResponse(BaseModel):
    total_waste: float
    total_entries: int
    category_totals: dict[str, float]
    most_logged_category: Optional[str]
    latest_entry: Optional[datetime]

class HighestAreaResponse(BaseModel):
    latitude: float
    longitude: float
    total_weight: float
    entry_count: int
