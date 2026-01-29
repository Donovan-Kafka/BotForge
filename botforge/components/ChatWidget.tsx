import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { chatService } from '../api';
import { User } from '../types';

type ChatRole = 'user' | 'bot';

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  ts: number;
};

type ChatWidgetProps = {
  user: User | null;
};

const buildSessionId = () => `dash-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const ChatWidget: React.FC<ChatWidgetProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [chatTitle, setChatTitle] = useState('Chatbot Tester');

  const sessionId = useMemo(() => {
    const key = 'chat_widget_session_id';
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const next = buildSessionId();
    localStorage.setItem(key, next);
    return next;
  }, []);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!user?.organisation_id) return;
    if (messages.length > 0) return;

    const fetchWelcome = async () => {
      setIsLoading(true);
      const res = await chatService.welcome(user.organisation_id, sessionId);
      if (res.ok) {
        const reply = res.reply || 'Hi! How can I help today?';
        setMessages([{ id: `bot-${Date.now()}`, role: 'bot', text: reply, ts: Date.now() }]);
        if (res.quick_replies) {
          setQuickReplies(res.quick_replies);
        }
        if (res.chatbot?.name) {
          setChatTitle(res.chatbot.name);
        }
      } else {
        setMessages([{ id: `bot-${Date.now()}`, role: 'bot', text: res.error || 'Sorry, something went wrong.', ts: Date.now() }]);
      }
      setIsLoading(false);
    };

    fetchWelcome();
  }, [isOpen, messages.length, sessionId, user?.organisation_id]);

  if (!user?.organisation_id) {
    return null;
  }

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      ts: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const res = await chatService.chat({
      company_id: user.organisation_id,
      message: trimmed,
      session_id: sessionId,
      user_id: user.user_id,
    });

    if (res.ok) {
      const reply = res.reply || 'Okay.';
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        text: reply,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, botMessage]);
      if (res.quick_replies) {
        setQuickReplies(res.quick_replies);
      }
      if (res.chatbot?.name) {
        setChatTitle(res.chatbot.name);
      }
    } else {
      setMessages((prev) => [
        ...prev,
        { id: `bot-${Date.now()}`, role: 'bot', text: res.error || 'Sorry, something went wrong.', ts: Date.now() },
      ]);
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-blue-600 shadow-lg shadow-blue-200 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
          title="Open chatbot tester"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="w-[360px] max-w-[90vw] h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div>
              <p className="text-sm font-semibold text-gray-900">{chatTitle}</p>
              <p className="text-xs text-gray-500">Org chatbot preview</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-gray-200 text-gray-500 flex items-center justify-center"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-white">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-500 rounded-2xl px-3 py-2 text-sm">Typing...</div>
              </div>
            )}
          </div>

          {quickReplies.length > 0 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2 bg-white">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-gray-200 p-3 bg-white">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button
                onClick={() => sendMessage(input)}
                className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
                title="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
