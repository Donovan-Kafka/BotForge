from backend.data_access.ChatMessages.chatMessages import ChatMessage, ChatMessageRepository

class ChatMessageService:
    """Application service for storing chat messages only."""
    def __init__(self, repo: ChatMessageRepository):
        self.repo = repo

    def save_message(
        self,
        organisation_id: int,
        chatbot_id: int,
        session_id: str,
        sender: str,
        message: str,
        sender_user_id: int | None = None,
        sender_name: str | None = None,
        intent: str | None = None,
        embedding_id: str | None = None,
    ) -> str:
        chat_message = ChatMessage(
            organisation_id=organisation_id,
            chatbot_id=chatbot_id,
            session_id=session_id,
            sender=sender,
            sender_user_id=sender_user_id,
            sender_name=sender_name,
            message=message,
            intent=intent,
            embedding_id=embedding_id,
        )
        return self.repo.insert(chat_message)

    def get_session_messages(
        self,
        organisation_id: int,
        chatbot_id: int,
        session_id: str,
        limit: int | None = None,
    ) -> list[ChatMessage]:
        return self.repo.get_by_session(
            organisation_id=organisation_id,
            chatbot_id=chatbot_id,
            session_id=session_id,
            limit=limit,
        )
