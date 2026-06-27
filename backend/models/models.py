import uuid
import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from database.database import Base

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(String(36), primary_key=True) # Matches Supabase auth.users UUID
    name = Column(String(100), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    role = Column(String(20), default="user", nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc))

class WasteLog(Base):
    __tablename__ = "waste_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    category = Column(String(50), nullable=False, index=True)
    weight = Column(Float, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc))
    user_id = Column(String(36), ForeignKey("profiles.id"), nullable=True)
