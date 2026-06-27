from sqlalchemy import create_engine, text

supabase_db = "postgresql://postgres:pappu212007*@db.daxjdiudpnmbeaksmthq.supabase.co:5432/postgres"
engine = create_engine(supabase_db)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT email FROM auth.users WHERE email LIKE '%trilochanajayaraj%'"))
        for row in result:
            print("Found:", row[0])
except Exception as e:
    print("Error:", e)
