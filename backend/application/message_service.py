from backend.application.chat_service import ChatMessageService
from backend.data_access.ChatMessages.chatMessages import ChatMessageRepository
from backend.infrastructure.mongodb.mongo_client import get_mongo_db


class ChatConversationService:
    """
    Manages chat conversations by integrating message storage and chatbot engine.
    """

    def __init__(self, chatbot_engine):
        self.chatbot_engine = chatbot_engine

        repo = ChatMessageRepository(get_mongo_db())
        self.message_service = ChatMessageService(repo)

    def handle_message(
        self,
        chatbot_id: int,
        session_id: str,
        user_message: str
    ) -> str:

        self.message_service.save_message(
            chatbot_id=chatbot_id,
            session_id=session_id,
            sender="user",
            message=user_message
        )

        result = self.chatbot_engine.reply(user_message)
        if isinstance(result, tuple):
            reply, intent = result
        else:
            reply, intent = result, None

        self.message_service.save_message(
            chatbot_id=chatbot_id,
            session_id=session_id,
            sender="bot",
            message=reply,
            intent=intent
        )

        return reply
