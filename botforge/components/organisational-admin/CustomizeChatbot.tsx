import React, { useState, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import { orgAdminService, operatorService } from '../../api';

interface CustomizeChatbotProps {
  onBack: () => void;
  organisationId?: number;
  role?: string;
}

type QuickReplyOption = {
  intent: string;
  text: string;
  available: boolean;
};

export const CustomizeChatbot: React.FC<CustomizeChatbotProps> = ({ onBack, organisationId, role }) => {
  const [settings, setSettings] = useState({
    name: '',
    description: '',
    personality_id: '',
    welcome_message: '',
    primary_language: 'English',
    allow_emojis: false,
  });
  const [personalities, setPersonalities] = useState<any[]>([]);
  const [quickReplyOptions, setQuickReplyOptions] = useState<QuickReplyOption[]>([]);
  const [quickReplySelected, setQuickReplySelected] = useState<string[]>([]);
  const [quickReplySuggested, setQuickReplySuggested] = useState<string[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [insertIdx, setInsertIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (organisationId) {
      loadData();
    }
  }, [organisationId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const service = role === 'STAFF' ? operatorService : orgAdminService;

      // Load Personalities
      const pRes = await service.listPersonalities();
      if (pRes.ok) {
        setPersonalities(pRes.personalities);
      }

      // Load Settings
      if (organisationId) {
        const cRes = await service.getChatbotSettings(organisationId);
        if (cRes.ok && cRes.chatbot) {
          setSettings({
            name: cRes.chatbot.name || '',
            description: cRes.chatbot.description || '',
            personality_id: cRes.chatbot.personality_id || '',
            welcome_message: cRes.chatbot.welcome_message || '',
            primary_language: cRes.chatbot.primary_language || 'English',
            allow_emojis: cRes.chatbot.allow_emojis || false,
          });
        }
      }

      // Quick replies editable by org admins only
      if (organisationId && role !== 'STAFF') {
        const qRes = await orgAdminService.getQuickReplies(organisationId, { language: 'en' });
        if (qRes.ok) {
          const options = Array.isArray(qRes.options) ? (qRes.options as QuickReplyOption[]) : [];
          const current = Array.isArray(qRes.current) ? (qRes.current as string[]) : [];
          const suggested = Array.isArray(qRes.suggested) ? (qRes.suggested as string[]) : [];

          setQuickReplyOptions(options);
          setQuickReplySuggested(suggested);
          setQuickReplySelected(current.length > 0 ? current : suggested);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const moveQuickReply = (idx: number, dir: -1 | 1) => {
    setQuickReplySelected((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[idx];
      next[idx] = next[j];
      next[j] = tmp;
      return next;
    });
  };

  const toggleQuickReply = (text: string) => {
    setQuickReplySelected((prev) => {
      if (prev.includes(text)) return prev.filter((t) => t !== text);
      return [...prev, text];
    });
  };

  const reorderQuickReplies = (from: number, insertAt: number) => {
    setQuickReplySelected((prev) => {
      if (from < 0 || from >= prev.length) return prev;
      if (insertAt < 0 || insertAt > prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      let idx = insertAt;
      if (idx > from) idx -= 1; // account for removal shift
      idx = Math.max(0, Math.min(idx, next.length));
      next.splice(idx, 0, moved);
      return next;
    });
  };

  const QuickReplyInsertZone: React.FC<{ index: number }> = ({ index }) => {
    const active = insertIdx === index;
    return (
      <div
        onDragOver={(e) => {
          if (dragIdx === null) return;
          e.preventDefault();
          if (insertIdx !== index) setInsertIdx(index);
        }}
        onDrop={(e) => {
          if (dragIdx === null) return;
          e.preventDefault();
          reorderQuickReplies(dragIdx, index);
          setDragIdx(null);
          setInsertIdx(null);
        }}
        className={`relative transition-[height] ${active ? 'h-6' : 'h-3'}`}
        aria-hidden="true"
      >
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-1">
          <div
            className={`h-0.5 rounded-full transition-colors ${
              active ? 'bg-blue-600' : 'bg-transparent'
            }`}
          />
        </div>
      </div>
    );
  };

  const handleSave = async () => {
    if (!organisationId) return;
    setSaving(true);
    setMessage('');
    try {
      const service = role === 'STAFF' ? operatorService : orgAdminService;
      const res = await service.updateChatbotSettings(organisationId, settings);
      if (res.ok) {
        // Update local state with returned data just in case
        // Update local state with returned data just in case
        if (res.chatbot) {
          setSettings({
            name: res.chatbot.name || '',
            description: res.chatbot.description || '',
            personality_id: res.chatbot.personality_id || '',
            welcome_message: res.chatbot.welcome_message || '',
            primary_language: res.chatbot.primary_language || 'English',
            allow_emojis: res.chatbot.allow_emojis || false,
          });
        }

        if (role !== 'STAFF') {
          const qRes = await orgAdminService.updateQuickReplies(organisationId, {
            texts: quickReplySelected,
            language: 'en',
          });
          if (!qRes.ok) {
            setMessage('Error: ' + (qRes.error || 'Failed to save quick replies'));
            return;
          }
        }

        setMessage('Settings saved successfully!');
      } else {
        setMessage('Error: ' + res.error);
      }
    } catch (e) {
      setMessage('Failed to save settings');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-center">Loading settings...</div>;

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-900 text-sm flex items-center font-medium transition-colors"
        >
          <span className="text-lg mr-2 leading-none">‹</span> Back to Dashboard
        </button>
        {message && <span className={`text-sm font-bold ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{message}</span>}
      </div>

      <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">Customize Chatbot</h2>

      <div className="max-w-lg mx-auto space-y-6">

        {/* Chatbot Name */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">Chatbot’s Name:</label>
          <input
            type="text"
            value={settings.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full border-2 border-gray-400 rounded px-3 py-2 outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">Description:</label>
          <input
            type="text"
            value={settings.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full border-2 border-gray-400 rounded px-3 py-2 outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Personality Setting */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">Personality Setting:</label>
          <div className="relative">
            <select
              value={settings.personality_id}
              onChange={(e) => handleChange('personality_id', e.target.value)}
              className="w-full border-2 border-gray-400 rounded px-3 py-2 outline-none focus:border-blue-500 appearance-none bg-white text-gray-700 font-medium"
            >
              <option value="">--Choose Personality--</option>
              {personalities.map(p => (
                <option key={p.personality_id} value={p.personality_id}>{p.name} ({p.type})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Greeting Message */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">Greeting Message:</label>
          <textarea
            value={settings.welcome_message}
            onChange={(e) => handleChange('welcome_message', e.target.value)}
            className="w-full h-24 border-2 border-gray-400 rounded px-3 py-2 outline-none focus:border-blue-500 resize-none transition-colors"
          ></textarea>
        </div>

        {/* Toggles */}
        <div className="pt-4 space-y-4">
          <div className="flex items-center">
            <span className="text-sm font-bold text-gray-800 w-40">Emoji usage:</span>
            <button
              onClick={() => handleChange('allow_emojis', !settings.allow_emojis)}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out ${settings.allow_emojis ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${settings.allow_emojis ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>

          {/* Removed Enable Voice as it is not backend supported yet */}
        </div>

        {/* Quick Replies (Org Admin Only) */}
        {role !== 'STAFF' && (
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Quick Replies</h3>
              {quickReplySelected.length === 0 && quickReplySuggested.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQuickReplySelected(quickReplySuggested)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Use Suggested
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Choose which clickable suggestions users see. Only fields you have filled in your org profile are selectable.
            </p>

            {/* Selected (order) */}
            {quickReplySelected.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold text-gray-700 mb-2">Selected (order)</div>
                <p className="text-[11px] text-gray-500 mb-2">Drag to reorder.</p>
                <div>
                  <QuickReplyInsertZone index={0} />
                  {quickReplySelected.map((t, idx) => (
                    <div key={t}>
                      <div
                        draggable
                        onDragStart={(e) => {
                          setDragIdx(idx);
                          setInsertIdx(idx);
                          e.dataTransfer.effectAllowed = 'move';
                          try {
                            e.dataTransfer.setData('text/plain', t);
                          } catch {
                            // ignore
                          }
                        }}
                        onDragEnd={() => {
                          setDragIdx(null);
                          setInsertIdx(null);
                        }}
                        className={`flex items-center justify-between border border-gray-200 rounded px-3 py-2 bg-white ${
                          dragIdx === idx ? 'opacity-60' : ''
                        }`}
                        title="Drag to reorder"
                      >
                        <div className="text-sm text-gray-800 font-medium">{t}</div>
                        <div className="flex items-center gap-2">
                          <div className="text-gray-400 cursor-grab active:cursor-grabbing select-none" aria-hidden="true">
                            <GripVertical size={16} />
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleQuickReply(t)}
                            className="text-xs font-bold px-2 py-1 border rounded text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <QuickReplyInsertZone index={idx + 1} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available options */}
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="text-xs font-bold text-gray-700 mb-2">Available</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickReplyOptions
                  .filter((o) => o.available)
                  .map((o) => {
                    const checked = quickReplySelected.includes(o.text);
                    return (
                      <label key={o.intent} className="flex items-center gap-2 text-sm text-gray-800">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleQuickReply(o.text)}
                        />
                        {o.text}
                      </label>
                    );
                  })}
              </div>
              {quickReplyOptions.filter((o) => o.available).length === 0 && (
                <div className="text-xs text-gray-600">
                  No quick replies available yet. Fill in more fields under Manage Org Profile.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-6">
          <button
            onClick={handleSave}
            disabled={saving || !organisationId}
            className={`w-full py-3 rounded text-white font-bold text-lg transition-colors ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800'
              }`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
};
