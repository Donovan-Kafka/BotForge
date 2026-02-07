import React, { useState, useEffect } from 'react';
import { PageView, User } from '../types';
import { authService, publicService, subscriptionService } from '../api';
import { Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PricingPageProps {
  user: User | null;
  onSuccess?: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ user, onSuccess }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [currentSubscriptionId, setCurrentSubscriptionId] = useState<number | undefined>(user?.subscription_id);

  useEffect(() => {
    setCurrentSubscriptionId(user?.subscription_id);
  }, [user]);

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
      navigate('/register');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // 1. Update Organization Size (Removed)
      // const profileRes = await authService.updateOrgProfile({
      //   organisation_id: user.organisation_id,
      //   size: selectedSize
      // });

      // if (!profileRes.ok) {
      //   throw new Error(profileRes.error || "Failed to update organization size.");
      // }

      // 2. Assign the Subscription Plan
      const subRes = await subscriptionService.assignSubscription({
        user_id: user.user_id,
        subscription_id: planId
      });

      if (subRes.ok) {
        setMessage(`Successfully subscribed to ${planName} Plan!`);
        setCurrentSubscriptionId(planId);

        // Update local storage
        const saved = localStorage.getItem('user');
        if (saved) {
          const u = JSON.parse(saved);
          u.subscription_id = planId;
          localStorage.setItem('user', JSON.stringify(u));
        }

        setTimeout(() => {
          // Force reload to update App state and sidebar/header
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        setMessage(`Error: ${subRes.error}`);
      }

    } catch (err: any) {
      console.error(err);
      setMessage(err.message || 'Error updating subscription.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">Plans & Pricing</h1>

      {/* Organization Size Selector Removed */}


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

      <div className="grid md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => {
          const isCurrentPlan = currentSubscriptionId === plan.id;
          return (
            <div key={plan.id} className={`h-full border border-gray-400 p-8 rounded bg-white flex flex-col items-center ${plan.name === 'Pro' ? 'relative shadow-lg' : ''}`}>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h2>
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-light text-gray-900">${parseInt(plan.price)}</span>
                <span className="text-gray-600 ml-2">monthly</span>
              </div>
              {typeof plan.staff_user_limit === 'number' && (
                <p className="text-sm text-gray-600 mb-6">Up to {plan.staff_user_limit} staff users</p>
              )}

              <button
                onClick={() => handleSubscribe(plan.id, plan.name)}
                disabled={isLoading || isCurrentPlan}
                className={`w-full text-white font-bold py-3 px-4 rounded mb-8 transition-colors ${isCurrentPlan
                    ? 'bg-green-500 cursor-default shadow-inner'
                    : 'disabled:opacity-50 bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {isCurrentPlan ? 'Activated' : (user ? 'Subscribe Now' : 'Get Started')}
              </button>

              <ul className="text-sm text-gray-700 space-y-2 w-full">
                {plan.description.split('.').filter((d: string) => d.trim()).map((desc: string, i: number) => (
                  <li key={i} className="flex items-start">• <span className="ml-2">{desc.trim()}</span></li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};
