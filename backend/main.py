from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.database import engine, Base
from routes import logs, analytics, export

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(title="EcoAudit - Community Waste Logger")

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(logs.router)
app.include_router(analytics.router)
app.include_router(export.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to EcoAudit API"}
