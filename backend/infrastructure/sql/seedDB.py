# Runs seed.sql to populate initial data

import psycopg2
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
SEED_PATH = BASE_DIR / "seed.sql"

conn = None
cur = None

try:
    # Connect to the database
    conn = psycopg2.connect(
        os.environ["DATABASE_URL"],
        sslmode="require"
    )

    conn.autocommit = False  # ensure transactional safety
    cur = conn.cursor()

    # Read seed.sql
    with open(SEED_PATH, "r", encoding="utf-8") as f:
        sql = f.read()

    # Execute full seed script
    cur.execute(sql)

    # Commit if everything succeeds
    conn.commit()
    print("seed.sql executed successfully")

    # Verify row counts (actual data tables only)
    tables = [
    "system_role", "subscription", "feature", "subscription_features",
    "organisation", "org_role", "org_permission", "org_role_permission",
    "personality", "app_user", "faq", "notification",
    "feedback", "chatbot", "analytics"
    ]

    print("\nRow counts:")
    for t in tables:
        cur.execute(f"SELECT COUNT(*) FROM {t};")
        count = cur.fetchone()[0]
        print(f"{t}: {count}")

except Exception as e:
    if conn:
        conn.rollback()
    print("Seeding failed:")
    print(e)
    raise

finally:
    if cur:
        cur.close()
    if conn:
        conn.close()
