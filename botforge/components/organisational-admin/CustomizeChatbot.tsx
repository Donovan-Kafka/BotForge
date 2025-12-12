import React, { useState } from 'react';

interface CustomizeChatbotProps {
    onBack: () => void;
}

export const CustomizeChatbot: React.FC<CustomizeChatbotProps> = ({ onBack }) => {
    const [emojiUsage, setEmojiUsage] = useState(false);
    const [enableVoice, setEnableVoice] = useState(true);

    return (
        <div className="animate-in fade-in duration-500">
            <div className="mb-6">
                <button
                    onClick={onBack}
                    className="text-gray-500 hover:text-gray-900 text-sm flex items-center font-medium transition-colors"
                >
                    <span className="text-lg mr-2 leading-none">‹</span> Back to Dashboard
                </button>
            </div>

            <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">Customize Chatbot</h2>

            <div className="max-w-lg mx-auto space-y-6">

                {/* Chatbot Name */}
                <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Chatbot’s Name:</label>
                    <input
                        type="text"
                        className="w-full border-2 border-gray-400 rounded px-3 py-2 outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                {/* Personality Setting */}
                <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Personality Setting:</label>
                    <div className="relative">
                        <select className="w-full border-2 border-gray-400 rounded px-3 py-2 outline-none focus:border-blue-500 appearance-none bg-white text-gray-700 font-medium">
                            <option>--Choose Personality--</option>
                            <option>Friendly & Casual</option>
                            <option>Professional & Formal</option>
                            <option>Concise & Direct</option>
                        </select>
                        {/* Custom arrow for styling match if needed, though appearance-none hides native */}
                    </div>
                </div>

                {/* Greeting Message */}
                <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Greeting Message:</label>
                    <textarea
                        className="w-full h-24 border-2 border-gray-400 rounded px-3 py-2 outline-none focus:border-blue-500 resize-none transition-colors"
                    ></textarea>
                </div>

                {/* Toggles */}
                <div className="pt-4 space-y-4">
                    <div className="flex items-center">
                        <span className="text-sm font-bold text-gray-800 w-40">Emoji usage:</span>
                        <button
                            onClick={() => setEmojiUsage(!emojiUsage)}
                            className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out ${emojiUsage ? 'bg-blue-500' : 'bg-gray-300'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${emojiUsage ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>

                    <div className="flex items-center">
                        <span className="text-sm font-bold text-gray-800 w-40">Enable Voice:</span>
                        <button
                            onClick={() => setEnableVoice(!enableVoice)}
                            className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out ${enableVoice ? 'bg-blue-500' : 'bg-gray-300'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${enableVoice ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};