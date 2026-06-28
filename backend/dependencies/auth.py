import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from sqlalchemy.orm import Session
from database.database import get_db
from models.models import Profile

SUPABASE_API_URL = os.getenv("SUPABASE_API_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if SUPABASE_API_URL and SUPABASE_ANON_KEY:
    supabase: Client = create_client(SUPABASE_API_URL, SUPABASE_ANON_KEY)
else:
    supabase = None

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not configured")
        
    token = credentials.credentials
    try:
        # Validate the token using Supabase client
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        # Get user profile from DB
        profile = db.query(Profile).filter(Profile.id == user.id).first()
        if not profile:
            # Create a profile if it doesn't exist
            email = user.email
            name = user.user_metadata.get("full_name") if user.user_metadata else None
            role = user.user_metadata.get("role", "user") if user.user_metadata else "user"
            profile = Profile(id=user.id, email=email, name=name, role=role)
            db.add(profile)
            db.commit()
            db.refresh(profile)
            
        return profile
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

def get_admin_user(current_user: Profile = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized, admin only")
    return current_user
