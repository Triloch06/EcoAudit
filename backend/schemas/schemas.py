from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Generic, TypeVar
from uuid import UUID
from enum import Enum

T = TypeVar("T")

class WasteCategory(str, Enum):
    PLASTIC = "Plastic"
    ORGANIC = "Organic"
    E_WASTE = "E-Waste"
    GLASS = "Glass"
    PAPER = "Paper"
    METAL = "Metal"
    OTHER = "Other"

class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Success"
    data: T

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    errors: Optional[list] = None

class WasteLogBase(BaseModel):
    category: WasteCategory
    weight: float = Field(..., gt=0, le=1000, description="Weight must be positive and reasonable (<= 1000)")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy: float = Field(..., gt=0)

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
