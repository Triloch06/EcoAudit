import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# We get the SUPABASE_URL which contains postgresql://...
# psycopg2 can accept this directly
db_url = os.getenv("SUPABASE_URL")

if not db_url:
    print("Error: SUPABASE_URL not found in .env")
    exit(1)

# Ensure it uses postgresql:// so psycopg2 likes it, or just use it as DSN
# Actually psycopg2 connect can take the URI string directly
try:
    print(f"Connecting to database...")
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cursor = conn.cursor()
    
    schema_path = os.path.join("..", "docs", "schema.sql")
    with open(schema_path, "r") as f:
        schema_sql = f.read()
        
    print("Executing schema.sql...")
    cursor.execute(schema_sql)
    print("Schema initialized successfully.")
    
    # Optional: also let SQLAlchemy create the profiles table
    from database.database import engine, Base
    from models.models import Profile, WasteLog
    print("Running SQLAlchemy create_all to create missing tables (e.g. profiles)...")
    Base.metadata.create_all(bind=engine)
    print("SQLAlchemy tables initialized.")
    
except Exception as e:
    print(f"Error executing schema: {e}")
finally:
    if 'conn' in locals():
        conn.close()
