import sys
from sqlalchemy import create_engine, text

supabase_db = "postgresql://postgres:pappu212007*@db.daxjdiudpnmbeaksmthq.supabase.co:5432/postgres"
engine = create_engine(supabase_db)

email = "trilochanajayaraj@gmail.com"

try:
    with engine.connect() as conn:
        print(f"Updating profiles table in Supabase Postgres for {email}...")
        result = conn.execute(
            text("UPDATE profiles SET role = 'admin' WHERE email = :email"),
            {"email": email}
        )
        conn.commit()
        print(f"Updated {result.rowcount} row(s) in profiles table.")
except Exception as e:
    print("Error updating Postgres profiles:", e)
