import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Send, Bot, User as UserIcon, Loader2, Mic, ArrowLeft, LogOut } from 'lucide-react';
import { chatService } from '../api';
import { User } from '../types';

type ChatRole = 'user' | 'bot';

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  ts: number;
};

type ChatPageProps = {
  user: User | null;
  onLogout: () => void;
};

const buildSessionId = () => `page-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const ChatPage: React.FC<ChatPageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [chatTitle, setChatTitle] = useState('BotForge Assistant');
  const [isRecording, setIsRecording] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Read company_id from query params or user
  // For Patrons (system_role_id === 2), they will typically have a company_id in the URL
  const [searchParams] = useSearchParams();
  const queryCompanyId = searchParams.get("company_id");
  const activeCompanyId = queryCompanyId ? parseInt(queryCompanyId) : user?.organisation_id;

  // Determine if we are in Patron mode to route to correct API endpoints if needed
  const isPatron = user?.system_role_id === 2;

  // Use a per-company session id so switching chats doesn't mix server-side conversation state.
  const sessionId = useMemo(() => {
    const key = activeCompanyId ? `chat_page_session_id_${activeCompanyId}` : 'chat_page_session_id';
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const next = buildSessionId();
    localStorage.setItem(key, next);
    return next;
  }, [activeCompanyId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // When the active chat changes, reset local UI state so messages/title don't bleed across chats.
  useEffect(() => {
    setMessages([]);
    setQuickReplies([]);
    setChatTitle('BotForge Assistant');
    setInput('');
    setIsLoading(false);
    setIsRecording(false);
  }, [activeCompanyId]);

  // Fetch initial welcome message
  useEffect(() => {
    if (!activeCompanyId || messages.length > 0) return;

    const fetchWelcome = async () => {
      setIsLoading(true);
      // chatService.welcome points to /api/patron/chat/welcome
      const res = await chatService.welcome(activeCompanyId, sessionId);
      if (res.ok) {
        setMessages([{
          id: `bot-${Date.now()}`,
          role: 'bot',
          text: res.reply || 'Hello! I am your AI assistant. How can I help you today?',
          ts: Date.now()
        }]);
        if (res.quick_replies) setQuickReplies(res.quick_replies);
        if (res.chatbot && res.chatbot.name) {
          setChatTitle(res.chatbot.name);
        } else if (res.chatbot_name) {
          setChatTitle(res.chatbot_name);
        } else {
          setChatTitle('BotForge Assistant');
        }
      }
      setIsLoading(false);
    };

    fetchWelcome();
  }, [activeCompanyId, sessionId, messages.length]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || !activeCompanyId) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      ts: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // chatService.chat now points to /api/patron/chat
    const res = await chatService.chat({
      company_id: activeCompanyId,
      message: trimmed,
      session_id: sessionId,
      user_id: user?.user_id,
    });

    if (res.ok) {
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        role: 'bot',
        text: res.reply || 'I processed your request.',
        ts: Date.now()
      }]);
      setQuickReplies(res.quick_replies || []);
    } else {
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        role: 'bot',
        text: res.error || 'Failed to connect to the assistant.',
        ts: Date.now()
      }]);
    }
    setIsLoading(false);
  };

  const sendVoice = async (audioBlob: Blob) => {
    if (!activeCompanyId || isLoading) return;

    setIsLoading(true);

    const res = await chatService.chatVoice({
      organisation_id: activeCompanyId,
      audio: audioBlob,
      session_id: sessionId,
    });

    if (res.ok) {
      const transcript = res.transcript || '';
      if (transcript) {
        setMessages((prev) => [
          ...prev,
          {
            id: `user-${Date.now()}`,
            role: 'user',
            text: transcript,
            ts: Date.now(),
          },
        ]);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'bot',
          text: res.reply || 'I processed your request.',
          ts: Date.now(),
        },
      ]);
      setQuickReplies(res.quick_replies || []);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'bot',
          text: res.error || 'Voice message failed.',
          ts: Date.now(),
        },
      ]);
    }

    setIsLoading(false);
  };

  const startRecording = async () => {
    if (isRecording || isLoading || !isPatron) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'bot',
          text: 'Microphone not supported in this browser.',
          ts: Date.now(),
        },
      ]);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferred = 'audio/webm;codecs=opus';
      const mimeType = MediaRecorder.isTypeSupported(preferred) ? preferred : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];
        if (blob.size > 0) {
          await sendVoice(blob);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              role: 'bot',
              text: 'No audio captured.',
              ts: Date.now(),
            },
          ]);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'bot',
          text: 'Microphone access denied.',
          ts: Date.now(),
        },
      ]);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleBackToSelectChat = () => {
    stopRecording();
    navigate('/selectChat');
  };

  if (!activeCompanyId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm max-w-md w-full">
          <h2 className="text-lg font-bold text-gray-900 mb-2">No chat selected</h2>
          <p className="text-gray-600 text-sm mb-4">
            Please select a chat to start talking to a chatbot.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleBackToSelectChat}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to chats
            </button>
            <button
              onClick={onLogout}
              className="py-2 px-4 border border-gray-300 text-gray-700 rounded-md font-semibold hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">{chatTitle}</h1>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBackToSelectChat}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} />
            Change chat
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-sm font-semibold text-white hover:bg-black transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-8 md:px-0"
      >
        <div className="max-w-3xl mx-auto space-y-8">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'bot' ? 'bg-blue-100 text-blue-600' : 'bg-gray-800 text-white'
                }`}>
                {msg.role === 'bot' ? <Bot size={18} /> : <UserIcon size={18} />}
              </div>
              <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                <div className={`px-4 py-3 rounded-2xl leading-relaxed ${msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-400 mt-1">
                  {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Loader2 size={18} className="animate-spin" />
              </div>
              <div className="bg-gray-50 text-gray-400 px-4 py-3 rounded-2xl italic text-sm">
                Thinking...
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-4 md:pb-10 bg-white">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {/* Quick Replies */}
          {quickReplies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Text Input */}
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                placeholder="Ask me anything..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-400 transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
            {/* Added Voice Button for Patron Voice API */}
            {isPatron && (
              <button
                title="Voice Chat"
                className={`p-4 rounded-2xl transition-colors ${
                  isRecording
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => (isRecording ? stopRecording() : startRecording())}
              >
                <Mic size={20} />
              </button>
            )}
          </div>
          <p className="text-center text-[10px] text-gray-400">
            BotForge AI can make mistakes. Check important info.
          </p>
        </div>
      </footer>
    </div>
  );
};
