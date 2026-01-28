
import React, { useState, useEffect } from 'react';
import { Bot, FileText, Star, ThumbsUp } from 'lucide-react';
import { sysAdminService } from '../../api';

interface FeedbackCandidate {
  feedback_id: number;
  sender_id: number;
  sender_username: string;
  sender_role_name: string;
  group: string;
  rating: number;
  purpose: string;
  content: string;
  is_testimonial: boolean;
  creation_date: string;
}

export const FeedbackManagement: React.FC = () => {
  const [candidates, setCandidates] = useState<FeedbackCandidate[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchCandidates = async () => {
    try {
      const res = await sysAdminService.listFeedbackCandidates();
      if (res.ok) {
        setCandidates(res.candidates);
      }
    } catch (e) {
      console.error("Failed to fetch feedback candidates", e);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleFeature = async (feedbackId: number, currentStatus: boolean) => {
    try {
      // Toggle status
      await sysAdminService.featureFeedback(feedbackId, !currentStatus);
      fetchCandidates();
    } catch (e) {
      console.error("Failed to toggle features", e);
    }
  };

  const selectedFeedback = candidates.find(c => c.feedback_id === selectedId);

  return (
    <div className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Manage Testimonials</h2>
        </div>

        <div className="flex border border-gray-300 rounded-lg min-h-[500px] overflow-hidden">
          {/* List */}
          <div className="w-1/3 border-r border-gray-300 bg-gray-50 flex flex-col overflow-y-auto max-h-[600px]">
            {candidates.length === 0 ? (
              <div className="p-4 text-gray-500 text-center text-sm">No feedback found.</div>
            ) : (
              candidates.map((c) => (
                <div
                  key={c.feedback_id}
                  onClick={() => setSelectedId(c.feedback_id)}
                  className={`border-b border-gray-200 p-4 hover:bg-white cursor-pointer transition-colors flex flex-col gap-1 ${selectedId === c.feedback_id ? 'bg-white border-l-4 border-l-blue-500' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 font-medium text-gray-800 text-sm">
                      <FileText className="text-gray-400 w-4 h-4" />
                      <span className="truncate w-32">{c.purpose || '(No Title)'}</span>
                    </div>
                    {c.is_testimonial && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{c.sender_username || 'Unknown'} ({c.sender_role_name})</span>
                    <span>{c.creation_date ? new Date(c.creation_date).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedFeedback ? (
              <>
                <div className="p-8 flex-1 overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedFeedback.purpose}</h3>
                      <div className="text-sm text-gray-500 flex gap-2 items-center">
                        <span>From: <strong className="text-gray-700">{selectedFeedback.sender_username}</strong></span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span>Role: {selectedFeedback.sender_role_name}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <div className="flex items-center text-yellow-500">
                          {selectedFeedback.rating && [...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < selectedFeedback.rating ? 'fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {selectedFeedback.is_testimonial && (
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-800" /> Featured Testimonial
                      </span>
                    )}
                  </div>

                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-gray-700 leading-relaxed italic relative">
                    <span className="text-6xl text-gray-200 absolute -top-4 -left-2 font-serif">“</span>
                    {selectedFeedback.content}
                  </div>

                  <div className="mt-8 border-t border-gray-100 pt-6">
                    <h4 className="font-bold text-sm text-gray-900 mb-2 uppercase tracking-wide">Publishing Rules</h4>
                    <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
                      <li>Only one testimonial can be featured per user group (ORG_ADMIN / STAFF).</li>
                      <li>Featuring this feedback will automatically un-feature any other feedback from the same group.</li>
                    </ul>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0">
                  <button
                    onClick={() => handleFeature(selectedFeedback.feedback_id, selectedFeedback.is_testimonial)}
                    className={`font-bold text-sm px-6 py-2 rounded shadow-sm transition-all flex items-center gap-2 ${selectedFeedback.is_testimonial
                      ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {selectedFeedback.is_testimonial ? (
                      <>Remove from Testimonials</>
                    ) : (
                      <><ThumbsUp className="w-4 h-4" /> Feature on Landing Page</>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-gray-300" />
                </div>
                <p className="font-medium">Select a feedback item to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
