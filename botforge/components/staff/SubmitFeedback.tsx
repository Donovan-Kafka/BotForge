import React, { useState } from 'react';
import { Star, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { feedbackService } from '../../api';
import { User } from '../../types';

interface SubmitFeedbackProps {
    onBack: () => void;
    user: User | null;
}

export const SubmitFeedback: React.FC<SubmitFeedbackProps> = ({ onBack, user }) => {
    const [rating, setRating] = useState(0);
    const [purpose, setPurpose] = useState('');
    const [content, setContent] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        setError(null);

        // Validation
        if (!purpose.trim()) {
            setError('Please enter a feedback purpose.');
            return;
        }
        if (!content.trim()) {
            setError('Please write your comments.');
            return;
        }
        if (rating === 0) {
            setError('Please rate your experience.');
            return;
        }
        if (!user) {
            setError('You must be logged in to submit feedback.');
            return;
        }

        setIsLoading(true);

        try {
            const res = await feedbackService.submitFeedback({
                sender_id: user.user_id,
                purpose: purpose,
                rating: rating,
                content: content
            });

            if (res.ok) {
                setSuccess(true);
                // Optional: Reset form or auto-back
                setPurpose('');
                setContent('');
                setRating(0);
            } else {
                setError(res.error || 'Failed to submit feedback.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center h-full py-20 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mb-6" />
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Feedback Submitted!</h2>
                <p className="text-gray-600 mb-8">Thank you for your feedback.</p>
                <button
                    onClick={() => {
                        setSuccess(false);
                        onBack();
                    }}
                    className="bg-gray-800 text-white font-bold py-2 px-8 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            <button
                onClick={onBack}
                className="flex items-center text-gray-500 hover:text-blue-600 mb-6 transition-colors text-sm"
            >
                <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
                Back to Dashboard
            </button>

            <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">
                Submit Feedback
            </h2>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-3 border border-red-100">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            <div className="border border-gray-300 rounded-xl p-6 mb-6 bg-white overflow-hidden shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                    Feedback Purpose
                </label>
                <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. Bug Report, Feature Request"
                    className="w-full border border-gray-300 rounded-lg py-2 px-4 text-gray-800 text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
                />
            </div>

            <div className="border border-gray-300 rounded-xl p-6 mb-8 bg-white overflow-hidden shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                    Comments
                </label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-32 border border-gray-300 rounded-lg p-4 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none placeholder:text-gray-400"
                    placeholder="Write your comments here"
                />
            </div>

            <div className="text-center mb-10">
                <p className="text-sm font-bold text-gray-700 mb-4">
                    Rate your experience
                </p>
                <div className="flex justify-center gap-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`p-2 rounded-full border transition-all ${
                                rating >= star
                                    ? 'border-yellow-400 bg-yellow-50'
                                    : 'border-gray-300 bg-white hover:border-gray-400'
                            }`}
                        >
                            <Star
                                className={`w-6 h-6 ${
                                    rating >= star
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300'
                                }`}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-8 rounded-lg text-sm transition-colors flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
                    Submit Feedback
                </button>
            </div>
        </div>
    );
};
