import psycopg2
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
SCHEMA_PATH = BASE_DIR / "sql" / "schema.sql"

conn = psycopg2.connect(
    os.environ["DATABASE_URL"],
    sslmode="require"
)

cur = conn.cursor()

with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
    cur.execute(f.read())

conn.commit() 

cur.close()
conn.close()

print("schema.sql executed successfully")
