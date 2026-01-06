# Basically this logins to your sql db and run scripts to test.
# net start MySQL

import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
import os

# To load .env files
load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = int(os.getenv("DB_PORT", 3306))

def run_sql_script(sql_script: str):
    """
    Connects to the database & runs the given SQL script.
    Handles multiple statements separated by semicolons.
    """
    connection = None
    try:
        # MySQL connection
        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=DB_PORT
        )

        if connection.is_connected():
            print(f"Connection Successful '{DB_NAME}' as '{DB_USER}'")

        cursor = connection.cursor(buffered=True)

        # Split the script into statements
        statements = [stmt.strip() for stmt in sql_script.split(";") if stmt.strip()]

        for stmt in statements:
            try:
                cursor.execute(stmt)
                # If SELECT, fetch results
                if stmt.lower().startswith("select"):
                    rows = cursor.fetchall()
                    print(f"\nResults for: {stmt[:50]}...")
                    for row in rows:
                        print(row)
                else:
                    # Commit inserts/updates/deletes
                    connection.commit()
            except Error as e:
                print(f"Error executing statement: {stmt[:50]}...\n   {e}")

    except Error as e:
        print("Error connecting to MySQL:", e)

    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("\nConnection closed.")


if __name__ == "__main__":
    fileToRun = "seed.sql"

    testFile = os.path.join(
        os.path.dirname(__file__),
        fileToRun
    )
    with open(testFile, "r", encoding="utf-8") as f:
        sql = f.read()

    run_sql_script(sql)
