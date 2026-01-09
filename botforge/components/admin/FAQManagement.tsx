
import React, { useState } from 'react';
import { Bot, Trash2, Edit2, Plus, X, Search, HelpCircle } from 'lucide-react';

export const FAQManagement: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const faqs = [
        {
            id: 1,
            question: "How does the conversation limit work?",
            answer: "Each plan has a monthly quota of unique user conversations. Once reached, your bot will remain active but might be subject to lower priority or overage charges depending on your tier.",
            status: 'active'
        },
        {
            id: 2,
            question: "Do I need technical knowledge to build a chatbot?",
            answer: "Not at all. BotForge is designed with a no-code interface. You can train your bot by simply uploading PDF, CSV, or by providing a website URL.",
            status: 'active'
        },
        {
            id: 3,
            question: "Can I customize the chatbot to fit my company branding?",
            answer: "Yes, you can customize the personality, greeting messages, and even the appearance of the chat widget to match your brand's voice and style.",
            status: 'active'
        }
    ];

    return (
        <div className="animate-in fade-in duration-500">
            <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <HelpCircle className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">FAQ Management</h2>
                    </div>

                    <div className="flex-1 max-w-md ml-auto flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search FAQs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-900 transition-colors whitespace-nowrap shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Add FAQ
                        </button>
                    </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-4 text-sm font-bold text-gray-600 uppercase w-1/3">Question</th>
                                <th className="p-4 text-sm font-bold text-gray-600 uppercase">Answer Snippet</th>
                                <th className="p-4 text-sm font-bold text-gray-600 uppercase w-24">Status</th>
                                <th className="p-4 text-sm font-bold text-gray-600 uppercase w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {faqs.map((faq) => (
                                <tr key={faq.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-bold text-gray-800 text-sm">{faq.question}</td>
                                    <td className="p-4 text-sm text-gray-600 line-clamp-1 h-14 flex items-center">
                                        {faq.answer.substring(0, 100)}...
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">
                                            {faq.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-4">
                                            <Edit2 className="h-5 w-5 text-blue-400 cursor-pointer hover:text-blue-600 transition-colors" />
                                            <Trash2 className="h-5 w-5 text-red-400 cursor-pointer hover:text-red-600 transition-colors" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Overlay for Adding/Editing */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Plus className="h-5 w-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Add New FAQ Entry</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-bold mb-2 text-gray-700 uppercase">Question</label>
                                <input
                                    type="text"
                                    placeholder="e.g. How do I change my subscription?"
                                    className="w-full bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-2 text-gray-700 uppercase">Answer</label>
                                <textarea
                                    className="w-full bg-blue-50/50 border border-blue-100 rounded-lg p-3 h-48 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none resize-none transition-all"
                                    placeholder="Provide the detailed answer here..."
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-2 text-gray-700 uppercase">Display Status</label>
                                <select className="w-full bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option>Published (Visible to all)</option>
                                    <option>Draft (Internal only)</option>
                                    <option>Hidden</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-6 pt-0 flex justify-end gap-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-600 font-bold text-sm hover:text-gray-900 px-6 py-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-blue-600 text-white font-bold px-10 py-2.5 rounded-lg text-sm hover:bg-blue-700 shadow-md transition-all active:scale-95"
                            >
                                Save FAQ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};