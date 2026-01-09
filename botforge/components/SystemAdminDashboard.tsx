
import React, { useState } from 'react';
import { Bot, LogOut } from 'lucide-react';
import { AdminLogin } from './admin/AdminLogin';
import { AdminAnalytics } from './admin/AdminAnalytics';
import { UserManagement } from './admin/UserManagement';
import { AIModelManagement } from './admin/AIModelManagement';
import { SystemMaintenance } from './admin/SystemMaintenance';
import { FeedbackManagement } from './admin/FeedbackManagement';
import { PricingManagement } from './admin/PricingManagement';
import { FeatureManagement } from './admin/FeatureManagement';
import { FAQManagement } from './admin/FAQManagement';

interface SystemAdminDashboardProps {
  onLogout: () => void;
  onBackToDashboard: () => void;
}

export type AdminView =
  | 'login'
  | 'stats'
  | 'user-admin'
  | 'ai-model'
  | 'maintenance'
  | 'feedback'
  | 'features'
  | 'pricing'
  | 'faq';

export const SystemAdminDashboard: React.FC<SystemAdminDashboardProps> = ({ onLogout, onBackToDashboard }) => {
  const [currentView, setCurrentView] = useState<AdminView>('login');

  const handleAdminLogin = () => {
    setCurrentView('stats');
  };

  // If viewing login, render full screen login
  if (currentView === 'login') {
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  // Navigation Button Helper
  const NavButton = ({ view, label }: { view: AdminView, label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors shadow-sm
        ${currentView === view
          ? 'bg-gray-800 text-white border-gray-800'
          : 'bg-white text-gray-700 border-gray-400 hover:bg-gray-50'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 animate-in fade-in duration-500">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-50">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setCurrentView('stats')}
        >
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-xl text-gray-800 tracking-tight">BotForge</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="p-2 bg-gray-100 rounded-full border border-gray-200">
            <span className="sr-only">Notifications</span>
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-900 font-medium">Hi, xxx</span>
            <button
              onClick={onLogout}
              className="text-gray-900 font-medium hover:text-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="p-8 max-w-[1400px] mx-auto">
        {/* Navigation Bar */}
        <div className="flex flex-wrap gap-[-1px] mb-12">
          <div className="flex gap-0 border border-gray-400 rounded-lg overflow-hidden divide-x divide-gray-400">
            <button
              onClick={() => setCurrentView('user-admin')}
              className={`px-6 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${currentView === 'user-admin' ? 'bg-gray-100' : 'bg-white'}`}
            >
              User administration
            </button>
            <button
              onClick={() => setCurrentView('ai-model')}
              className={`px-6 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${currentView === 'ai-model' ? 'bg-gray-100' : 'bg-white'}`}
            >
              AI Model management
            </button>
            <button
              onClick={() => setCurrentView('maintenance')}
              className={`px-6 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${currentView === 'maintenance' ? 'bg-gray-100' : 'bg-white'}`}
            >
              System maintenance
            </button>
            <button
              onClick={() => setCurrentView('feedback')}
              className={`px-6 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${currentView === 'feedback' ? 'bg-gray-100' : 'bg-white'}`}
            >
              Manage Testimonials
            </button>
            <button
              onClick={() => setCurrentView('features')}
              className={`px-6 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${currentView === 'features' ? 'bg-gray-100' : 'bg-white'}`}
            >
              Change Features
            </button>
            <button
              onClick={() => setCurrentView('pricing')}
              className={`px-6 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${currentView === 'pricing' ? 'bg-gray-100' : 'bg-white'}`}
            >
              Change Pricing
            </button>
            <button
              onClick={() => setCurrentView('faq')}
              className={`px-6 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${currentView === 'faq' ? 'bg-gray-100' : 'bg-white'}`}
            >
              Manage FAQ
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {currentView === 'stats' && <AdminAnalytics />}
          {currentView === 'user-admin' && <UserManagement />}
          {currentView === 'ai-model' && <AIModelManagement />}
          {currentView === 'maintenance' && <SystemMaintenance />}
          {currentView === 'feedback' && <FeedbackManagement />}
          {currentView === 'pricing' && <PricingManagement />}
          {currentView === 'features' && <FeatureManagement />}
          {currentView === 'faq' && <FAQManagement />}
        </div>
      </main>
    </div>
  );
};
