import React, { useState, useEffect } from 'react';
import { HelpCircle, Edit2, X } from 'lucide-react';
import { sysAdminService } from '../../api';
import { FAQ } from '../../types';

export const FAQManagement: React.FC = () => {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);

    // Form State
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [displayOrder, setDisplayOrder] = useState(0);
    const [status, setStatus] = useState(0); // 0: Active, 1: Hidden

    const fetchFaqs = async () => {
        try {
            const res = await sysAdminService.listFaqs();
            if (res.ok) {
                setFaqs(res.faqs);
            }
        } catch (error) {
            console.error("Failed to fetch FAQs", error);
        }
    };

    useEffect(() => {
        fetchFaqs();
    }, []);

    const handleOpenModal = (faq?: FAQ) => {
        if (faq) {
            setEditingFaq(faq);
            setQuestion(faq.question);
            setAnswer(faq.answer);
            setDisplayOrder(faq.display_order);
            setStatus(faq.status);
        } else {
            setEditingFaq(null);
            setQuestion('');
            setAnswer('');
            setDisplayOrder(0);
            setStatus(0);
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!question.trim() || !answer.trim()) return;

        try {
            const payload = {
                question,
                answer,
                display_order: displayOrder,
                status,
                user_id: 1 // Hardcoded admin user ID for now
            };

            if (editingFaq) {
                await sysAdminService.updateFaq(editingFaq.faq_id, payload);
            } else {
                await sysAdminService.createFaq(payload);
            }
            setIsModalOpen(false);
            fetchFaqs();
        } catch (error) {
            console.error("Failed to save FAQ", error);
        }
    };
    /*
    const handleDelete = async (id: number) => {
        if (window.confirm("Are you sure you want to delete (hide) this FAQ?")) {
            await sysAdminService.deleteFaq(id);
            fetchFaqs();
        }
    };
    */

    return (
        <div className="animate-in fade-in duration-500">
            {/* List View */}
            <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                        <HelpCircle className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">FAQ Management</h2>
                    {/*
                    <div className="ml-auto">
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add FAQ
                        </button>
                    </div>
                    */}
                </div>

                <div className="space-y-4">
                    {faqs.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No FAQs found.</p>
                    ) : (
                        faqs.map((faq) => (
                            <div key={faq.faq_id} className={`border border-gray-300 p-4 rounded-lg flex justify-between items-start hover:bg-gray-50 transition-colors shadow-sm group ${faq.status === 1 ? 'opacity-60 bg-gray-50' : ''}`}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-gray-700 text-lg">{faq.question}</span>
                                        {faq.status === 1 && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Hidden</span>}
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Order: {faq.display_order}</span>
                                    </div>
                                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{faq.answer}</p>
                                </div>
                                <div className="flex gap-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                                    <Edit2
                                        onClick={() => handleOpenModal(faq)}
                                        className="h-5 w-5 text-blue-400 cursor-pointer hover:text-blue-600 transition-colors"
                                    />
                                    {/*
                                    <Trash2
                                        onClick={() => handleDelete(faq.faq_id)}
                                        className="h-5 w-5 text-red-400 cursor-pointer hover:text-red-600 transition-colors"
                                    />
                                    */}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                    <HelpCircle className="h-5 w-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingFaq ? 'Edit FAQ' : 'New FAQ'}
                                </h2>
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
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    className="w-full bg-purple-50/50 border border-purple-200 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all"
                                    placeholder="e.g. How do I reset my password?"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold mb-2 text-gray-700 uppercase">Answer</label>
                                <textarea
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    className="w-full bg-purple-50/50 border border-purple-200 rounded-lg p-3 h-32 text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none resize-none transition-all"
                                    placeholder="Detailed answer..."
                                ></textarea>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold mb-2 text-gray-700 uppercase">Display Order</label>
                                    <input
                                        type="number"
                                        value={displayOrder}
                                        onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                                        className="w-full bg-purple-50/50 border border-purple-200 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold mb-2 text-gray-700 uppercase">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(parseInt(e.target.value))}
                                        className="w-full bg-purple-50/50 border border-purple-200 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all"
                                    >
                                        <option value={0}>Active</option>
                                        <option value={1}>Hidden</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 pt-0 flex justify-end gap-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-600 font-bold text-sm hover:text-gray-900 px-4 py-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-gray-700 text-white font-bold px-8 py-2.5 rounded-lg text-sm hover:bg-gray-800 shadow-md transition-all active:scale-95"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};