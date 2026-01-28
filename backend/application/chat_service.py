from backend.infrastructure.mongodb.chat_messages import ChatMessage

class ChatMessageService:
    """
    For storing chat messages and retrieving conversation history.
    """
    def __init__(self, repo):
        self.repo = repo

    def save_message(
        self,
        chatbot_id: int,
        session_id: str,
        sender: str,
        message: str,
        intent: str | None = None,
        embedding_id: str | None = None
    ):
        chat_message = ChatMessage(
            chatbot_id=chatbot_id,
            session_id=session_id,
            sender=sender,
            message=message,
            intent=intent,
            embedding_id=embedding_id
        )

        return self.repo.insert(chat_message)

    def get_conversation(self, chatbot_id: int, session_id: str):
        return self.repo.get_by_session(chatbot_id, session_id)
