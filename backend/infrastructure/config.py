# db connection credentials and API keys configuration
import os

# for postgreSQL (Done)
DATABASE_URL = os.getenv("DATABASE_URL")

# mongo db
MONGO_URI = os.getenv("MONGO_URI")

# pinecone
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX = os.getenv("PINECONE_INDEX")
 