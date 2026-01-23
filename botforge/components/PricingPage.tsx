import React, { useState, useEffect } from 'react';
import { PageView, User } from '../types';
import { authService, publicService } from '../api';
import { Loader2, Check } from 'lucide-react';

interface PricingPageProps {
  onNavigate: (page: PageView) => void;
  user: User | null;
  onSuccess?: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate, user, onSuccess }) => {
  const [selectedSize, setSelectedSize] = useState('Small');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await publicService.getSubscriptionPlans();
        if (res.ok && res.plans) {
          setPlans(res.plans);
        }
      } catch (error) {
        console.error("Failed to fetch plans", error);
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (planId: number, planName: string) => {
    if (!user) {
      onNavigate(PageView.REGISTER);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await authService.updateOrgProfile({
        organisation_id: user.organisation_id,
        subscription_id: planId,
        size: selectedSize
      });

      if (res.ok) {
        setMessage(`Successfully subscribed to ${planName} Plan (${selectedSize})!`);
        if (onSuccess) {
          setTimeout(onSuccess, 1500); // Wait 1.5s to show message
        }
      } else {
        setMessage(`Error: ${res.error}`);
      }
    } catch (err) {
      setMessage('Error updating subscription.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">Plans & Pricing</h1>

      {/* Organization Size Selector */}
      <div className="flex flex-col items-center mb-12">
        <label className="text-gray-700 font-semibold mb-2">Select your Organization Size:</label>
        <select
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value)}
          className="border-2 border-blue-200 rounded-lg p-3 bg-white text-gray-800 font-medium focus:outline-none focus:border-blue-500 transition-colors"
        >
          <option value="Small">Small (1-10 Employees)</option>
          <option value="Medium">Medium (11-50 Employees)</option>
          <option value="Large">Large (50+ Employees)</option>
        </select>
        <p className="text-gray-500 text-sm mt-2">Prices are tailored to your scale.</p>
      </div>

      {message && (
        <div className={`text-center p-4 mb-8 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center mb-8">
          <Loader2 className="animate-spin text-blue-600" />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className={`border border-gray-400 p-8 rounded bg-white flex flex-col items-center ${plan.name === 'Pro' ? 'relative transform md:-translate-y-4 shadow-lg' : ''}`}>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h2>
            <div className="flex items-baseline mb-8">
              <span className="text-5xl font-light text-gray-900">${parseInt(plan.price)}</span>
              <span className="text-gray-600 ml-2">monthly</span>
            </div>

            <button
              onClick={() => handleSubscribe(plan.id, plan.name)}
              disabled={isLoading}
              className={`w-full ${plan.name === 'Pro' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 hover:bg-blue-500'} text-white font-bold py-3 px-4 rounded mb-8 transition-colors disabled:opacity-50`}
            >
              {user ? 'Subscribe Now' : 'Get Started'}
            </button>

            <ul className="text-sm text-gray-700 space-y-2 w-full">
              {plan.description.split('.').filter((d: string) => d.trim()).map((desc: string, i: number) => (
                <li key={i} className="flex items-start">• <span className="ml-2">{desc.trim()}</span></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
