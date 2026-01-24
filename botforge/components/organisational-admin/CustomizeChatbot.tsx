import React, { useState, useEffect } from 'react';
import { orgAdminService } from '../../api';

interface CustomizeChatbotProps {
  onBack: () => void;
  organisationId?: number;
}

export const CustomizeChatbot: React.FC<CustomizeChatbotProps> = ({ onBack, organisationId }) => {
  const [settings, setSettings] = useState({
    name: '',
    description: '',
    personality_id: '',
    welcome_message: '',
    primary_language: 'English',
    allow_emojis: false,
  });
  const [personalities, setPersonalities] = useState<any[]>([]);
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
      // Load Personalities
      const pRes = await orgAdminService.listPersonalities();
      if (pRes.ok) {
        setPersonalities(pRes.personalities);
      }

      // Load Settings
      if (organisationId) {
        const cRes = await orgAdminService.getChatbotSettings(organisationId);
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
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!organisationId) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await orgAdminService.updateChatbotSettings(organisationId, settings);
      if (res.ok) {
        setMessage('Settings saved successfully!');
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

        {/* Primary Language */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">Primary Language:</label>
          <div className="relative">
            <select
              value={settings.primary_language}
              onChange={(e) => handleChange('primary_language', e.target.value)}
              className="w-full border-2 border-gray-400 rounded px-3 py-2 outline-none focus:border-blue-500 appearance-none bg-white text-gray-700 font-medium"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish (Coming Soon)</option>
              <option value="Chinese">Chinese (Coming Soon)</option>
            </select>
          </div>
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