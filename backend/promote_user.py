import sqlite3
import json
from sqlalchemy import create_engine, text

# 1. Update Supabase Postgres
supabase_db = "postgresql://postgres:pappu212007*@db.daxjdiudpnmbeaksmthq.supabase.co:5432/postgres"
engine = create_engine(supabase_db)

email = "trilochanajayaraj@gmail.com"

try:
    with engine.connect() as conn:
        print(f"Updating Supabase auth.users for {email}...")
        result = conn.execute(text("SELECT id, raw_user_meta_data FROM auth.users WHERE email = :email"), {"email": email})
        row = result.fetchone()
        
        if row:
            user_id = row[0]
            meta = row[1] if row[1] else {}
            meta['role'] = 'admin'
            
            # Using JSONB format for raw_user_meta_data update
            conn.execute(
                text("UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{\"role\":\"admin\"}'::jsonb WHERE id = :id"),
                {"id": user_id}
            )
            conn.commit()
            print("Successfully updated Supabase metadata.")
        else:
            print("User not found in Supabase.")
except Exception as e:
    print("Error updating Supabase:", e)

# 2. Update local SQLite DB
try:
    print(f"Updating local sql_app.db for {email}...")
    conn_lite = sqlite3.connect("sql_app.db")
    cursor = conn_lite.cursor()
    cursor.execute("UPDATE profiles SET role = 'admin' WHERE email = ?", (email,))
    conn_lite.commit()
    print(f"Updated {cursor.rowcount} row(s) in local SQLite.")
    conn_lite.close()
except Exception as e:
    print("Error updating local SQLite:", e)
