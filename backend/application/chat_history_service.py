from datetime import datetime
from typing import Optional, Iterator

from backend.data_access.ChatMessages.chatMessages import ChatMessageRepository


class ChatHistoryService:
    """
    Service for chat history access and chat exports
    """

    EXPORT_LIMIT = 10_000  # hard safety cap for free tier

    def __init__(self, repo: ChatMessageRepository):
        self.repo = repo

    def get_chat_history(
        self,
        organisation_id: int,
        keyword: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 20,
    ):
        query = {"organisationId": organisation_id}

        if keyword:
            query["message"] = {"$regex": keyword, "$options": "i"}

        if date_from or date_to:
            query["timestamp"] = {}
            if date_from:
                query["timestamp"]["$gte"] = date_from
            if date_to:
                query["timestamp"]["$lte"] = date_to

        skip = max(page - 1, 0) * page_size

        total = self.repo.collection.count_documents(query)

        cursor = (
            self.repo.collection
            .find(query)
            .sort("timestamp", -1)
            .skip(skip)
            .limit(page_size)
        )

        return total, list(cursor)

    # ==========================
    # CSV EXPORT (STREAMING)
    # ==========================
    def stream_csv_export(
        self,
        organisation_id: int,
        keyword: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> Iterator[str]:
        """
        Streams CSV rows to avoid memory spikes.
        """

        query = {"organisationId": organisation_id}

        if keyword:
            query["message"] = {"$regex": keyword, "$options": "i"}

        if date_from or date_to:
            query["timestamp"] = {}
            if date_from:
                query["timestamp"]["$gte"] = date_from
            if date_to:
                query["timestamp"]["$lte"] = date_to

        cursor = (
            self.repo.collection
            .find(query)
            .sort("timestamp", 1)
            .limit(self.EXPORT_LIMIT)
        )

        # CSV header
        yield "timestamp,session_id,sender,sender_name,message,intent\n"

        for r in cursor:
            ts = r.get("timestamp")
            ts_str = ts.isoformat() if ts else ""

            metadata = r.get("metadata") or {}
            intent = metadata.get("intent", "")

            # Escape quotes and newlines for CSV safety
            message = (r.get("message") or "").replace('"', '""').replace("\n", " ")

            yield (
                f'{ts_str},'
                f'{r.get("sessionId","")},'
                f'{r.get("sender","")},'
                f'{r.get("senderName","") or ""},'
                f'"{message}",'
                f'{intent}\n'
            )
