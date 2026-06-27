from database.database import engine
from sqlalchemy import text

with engine.begin() as conn:
    conn.execute(text('ALTER TABLE waste_logs ADD COLUMN IF NOT EXISTS user_id VARCHAR(36) REFERENCES profiles(id)'))
    print("Column added.")
