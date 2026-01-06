from datetime import timezone, datetime
from backend.infrastructure.mongodb.chat_messages import ChatMessage
from bson import ObjectId
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client.botforge
collection = db.chat_messages

msg = ChatMessage(
    chatbot_id=ObjectId(),
    session_id="test-session",
    sender="user",
    message="Hello MongoDB test",
)

result = collection.insert_one(msg.to_dict())

print("Inserted MongoDB _id:", result.inserted_id)

doc = collection.find_one({"_id": result.inserted_id})
print("Fetched document:", doc)
