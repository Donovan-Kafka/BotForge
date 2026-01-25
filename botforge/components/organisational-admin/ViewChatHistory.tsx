import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Calendar, Download } from 'lucide-react';
import { orgAdminService } from '../../api';

interface ViewChatHistoryProps {
    onBack: () => void;
    organisationId?: number;
}

export const ViewChatHistory: React.FC<ViewChatHistoryProps> = ({ onBack, organisationId }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        q: '',
        from: '',
        to: ''
    });

    useEffect(() => {
        if (organisationId) {
            fetchHistory();
        }
    }, [organisationId]);

    const fetchHistory = async () => {
        if (!organisationId) return;
        setLoading(true);
        try {
            const res = await orgAdminService.getChatHistory(organisationId, filters);
            if (res.ok) {
                setHistory(res.messages || []);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleApply = () => {
        fetchHistory();
    };

    return (
        <div className="animate-in fade-in duration-500 pb-10">
            <button onClick={onBack} className="text-gray-500 hover:text-gray-900 text-sm flex items-center mb-6 font-medium transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-6">Chat Logs</h2>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Block 1: Filters */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Search</label>
                            <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                <input
                                    type="text"
                                    placeholder="Search keywords..."
                                    value={filters.q}
                                    onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Date Range</label>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={filters.from}
                                        onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
                                        className="border border-gray-300 rounded-lg pl-3 pr-2 py-2.5 text-sm text-gray-600 w-36 outline-none focus:border-blue-500"
                                    />
                                </div>
                                <span className="text-gray-400">-</span>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={filters.to}
                                        onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
                                        className="border border-gray-300 rounded-lg pl-3 pr-2 py-2.5 text-sm text-gray-600 w-36 outline-none focus:border-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={handleApply}
                                    className="bg-gray-800 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-700 transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Block 2: Results */}
                <div className="bg-white border border-gray-200 rounded-xl p-0 overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase">Recent Sessions</span>
                        <button className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1">
                            <Download className="w-3 h-3" /> Export
                        </button>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center text-gray-500">Loading history...</div>
                        ) : history.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">No chat history found.</div>
                        ) : (
                            history.map((msg: any) => (
                                <div key={msg.message_id} className="p-6 hover:bg-gray-50 transition-colors cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${msg.sender === 'user' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                            <span className="text-sm font-bold text-gray-800">
                                                {msg.sender === 'bot' ? 'Chatbot' : msg.sender_name || 'Guest'}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400">{msg.date}, {msg.time}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 italic">"{msg.message}"</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};