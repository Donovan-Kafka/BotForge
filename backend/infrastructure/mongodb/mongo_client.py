from pymongo import MongoClient
from flask import current_app, g

def get_mongo_db():
    if "mongo_client" not in g:
        g.mongo_client = MongoClient(
            current_app.config["MONGO_URI"],
            maxPoolSize=5,      
            minPoolSize=1,
        )

    return g.mongo_client[current_app.config["MONGO_DB_NAME"]]
