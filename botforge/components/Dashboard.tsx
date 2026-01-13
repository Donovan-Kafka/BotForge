
import React, { useState } from 'react';
import { Bot, LogOut, ShieldAlert, Users, Calendar, CreditCard } from 'lucide-react';
import { UserRole, User } from '../types';
import { PricingPage } from './PricingPage';

// Staff Components
import { CustomizeChatbot as StaffCustomize } from './staff/CustomizeChatbot';
import { ChatHistory as StaffHistory } from './staff/ChatHistory';
import { SubmitFeedback as StaffFeedback } from './staff/SubmitFeedback';
import { ManageAccount as StaffAccount } from './staff/ManageAccount';

// Organisational Admin Components
import { BuildChatbot } from './organisational-admin/BuildChatbot';
import { ManageStaff } from './organisational-admin/ManageStaff';
import { CreateRole } from './organisational-admin/CreateRole';
import { CustomizeChatbot as AdminCustomize } from './organisational-admin/CustomizeChatbot';
import { ViewChatHistory as AdminHistory } from './organisational-admin/ViewChatHistory';
import { SubmitFeedback as AdminFeedback } from './organisational-admin/SubmitFeedback';
import { ManageAccount as AdminAccount } from './organisational-admin/ManageAccount';
import { Notifications } from './organisational-admin/Notifications';

interface DashboardProps {
    onLogout: () => void;
    onSystemAdminLogin: () => void;
    user: User | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, onSystemAdminLogin, user }) => {
    const [currentRole, setCurrentRole] = useState<UserRole.ADMIN | UserRole.STAFF>(UserRole.ADMIN);
    const [activeTab, setActiveTab] = useState<string>('analytics'); // Default to analytics/overview

    // Mock Data for Analytics
    const analyticsData = {
        totalChats: 1234,
        uniqueUsers: 789,
        avgResponseTime: '3s',
    };

    const renderAnalytics = () => (
        <div className="animate-in fade-in duration-500">
            {/* Date Filter */}
            <div className="flex items-center gap-4 mb-8">
                <span className="font-bold text-gray-700 text-sm">Date Range:</span>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input type="text" placeholder="dd-----yyyy" className="border border-gray-300 rounded px-3 py-1.5 text-sm w-32 outline-none focus:border-blue-500" />
                        <Calendar className="w-4 h-4 text-gray-400 absolute right-2 top-2 pointer-events-none" />
                    </div>
                    <span className="text-gray-400">-</span>
                    <div className="relative">
                        <input type="text" placeholder="dd-----yyyy" className="border border-gray-300 rounded px-3 py-1.5 text-sm w-32 outline-none focus:border-blue-500" />
                        <Calendar className="w-4 h-4 text-gray-400 absolute right-2 top-2 pointer-events-none" />
                    </div>
                </div>
                <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1.5 px-6 rounded text-sm transition-colors">
                    Apply
                </button>
            </div>

            {/* Main Chart Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
                <h3 className="font-bold text-gray-700 mb-6">Daily Chats</h3>
                <div className="h-64 w-full relative">
                    {/* Custom SVG Line Chart to match wireframe style */}
                    <svg viewBox="0 0 800 300" className="w-full h-full overflow-visible">
                        {/* Y-Axis Grid Lines */}
                        <line x1="0" y1="250" x2="800" y2="250" stroke="#f3f4f6" strokeWidth="1" />
                        <line x1="0" y1="200" x2="800" y2="200" stroke="#f3f4f6" strokeWidth="1" />
                        <line x1="0" y1="150" x2="800" y2="150" stroke="#f3f4f6" strokeWidth="1" />
                        <line x1="0" y1="100" x2="800" y2="100" stroke="#f3f4f6" strokeWidth="1" />
                        <line x1="0" y1="50" x2="800" y2="50" stroke="#f3f4f6" strokeWidth="1" />

                        {/* Y-Axis Labels */}
                        <text x="-30" y="255" className="text-xs fill-gray-400" textAnchor="end">50</text>
                        <text x="-30" y="205" className="text-xs fill-gray-400" textAnchor="end">100</text>
                        <text x="-30" y="155" className="text-xs fill-gray-400" textAnchor="end">150</text>
                        <text x="-30" y="105" className="text-xs fill-gray-400" textAnchor="end">250</text>
                        <text x="-30" y="55" className="text-xs fill-gray-400" textAnchor="end">350</text>

                        {/* X-Axis Labels */}
                        <text x="0" y="280" className="text-xs fill-gray-500">Mon</text>
                        <text x="133" y="280" className="text-xs fill-gray-500">Tue</text>
                        <text x="266" y="280" className="text-xs fill-gray-500">Wed</text>
                        <text x="400" y="280" className="text-xs fill-gray-500">Thu</text>
                        <text x="533" y="280" className="text-xs fill-gray-500">Fri</text>
                        <text x="666" y="280" className="text-xs fill-gray-500">Sat</text>
                        <text x="800" y="280" className="text-xs fill-gray-500">Sun</text>

                        {/* The Line Path */}
                        <path
                            d="M0,170 C50,140 80,40 133,40 S200,60 266,90 S350,230 400,230 S480,140 533,140 S600,135 666,140 S750,160 800,170"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="3"
                        />

                        {/* Data Points */}
                        <circle cx="0" cy="170" r="4" fill="#3b82f6" />
                        <circle cx="133" cy="40" r="4" fill="#3b82f6" />
                        <circle cx="266" cy="90" r="4" fill="#3b82f6" />
                        <circle cx="400" cy="230" r="4" fill="#3b82f6" />
                        <circle cx="533" cy="140" r="4" fill="#3b82f6" />
                        <circle cx="666" cy="140" r="4" fill="#3b82f6" />
                        <circle cx="800" cy="170" r="4" fill="#3b82f6" />
                    </svg>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Total Chats</p>
                    <h4 className="text-3xl font-bold text-gray-900">{analyticsData.totalChats}</h4>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Unique Users</p>
                    <h4 className="text-3xl font-bold text-gray-900">{analyticsData.uniqueUsers}</h4>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Avg Response Time</p>
                    <h4 className="text-3xl font-bold text-gray-900">{analyticsData.avgResponseTime}</h4>
                </div>
            </div>

            <div className="flex justify-center">
                <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-8 rounded flex items-center gap-2 transition-colors">
                    Export Report
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-white font-sans">
            {/* Left Sidebar (Switch Role & System Admin) */}
            <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-6 gap-6 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                <div
                    onClick={() => setActiveTab('analytics')}
                    className="bg-blue-600 p-2 rounded-lg mb-4 cursor-pointer hover:bg-blue-700 transition-colors"
                >
                    <Bot className="h-6 w-6 text-white" />
                </div>

                {/* Switch Role Button */}
                <div className="relative group">
                    <button
                        onClick={() => {
                            const newRole = currentRole === UserRole.ADMIN ? UserRole.STAFF : UserRole.ADMIN;
                            setCurrentRole(newRole);
                            setActiveTab('analytics'); // Reset to home
                        }}
                        className="p-3 rounded-xl bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all border border-transparent hover:border-blue-200"
                        title={`Switch to ${currentRole === UserRole.ADMIN ? 'Staff' : 'Admin'} View`}
                    >
                        <Users className="w-5 h-5" />
                    </button>
                    <div className="absolute left-14 top-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">
                        Switch to {currentRole === UserRole.ADMIN ? 'Staff' : 'Admin'}
                    </div>
                </div>

                {/* Subscription Button (Admin Only) */}
                {currentRole === UserRole.ADMIN && (
                    <div className="relative group">
                        <button
                            onClick={() => setActiveTab('subscription')}
                            className={`p-3 rounded-xl transition-all ${activeTab === 'subscription' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                        >
                            <CreditCard className="w-5 h-5" />
                        </button>
                        <div className="absolute left-14 top-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">
                            Subscription
                        </div>
                    </div>
                )}

                <div className="mt-auto flex flex-col gap-4">
                    <div className="relative group">
                        <button
                            onClick={onSystemAdminLogin}
                            className="p-3 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all"
                        >
                            <ShieldAlert className="w-5 h-5" />
                        </button>
                        <div className="absolute left-14 top-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-50">
                            System Admin
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className="p-3 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition-all"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-gray-100 px-8 flex items-center justify-between bg-white flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-md">
                            <Bot className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                            BotForge <span className="font-normal text-gray-400">| {currentRole === UserRole.ADMIN ? 'Organisational Admin' : 'Staff'}</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <div
                            className="relative cursor-pointer"
                            onClick={() => setActiveTab('notifications')}
                        >
                            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-400"></span>
                            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">Hi, {user?.username || 'User'}</p>
                                <p className="text-xs text-gray-500">{currentRole === UserRole.ADMIN ? 'Org Admin' : 'Staff'}</p>
                            </div>
                            <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                        </div>
                        <button onClick={onLogout} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors">
                            Logout <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Navigation Tabs (Pills) - Only show if NOT in Subscription or Notifications mode */}
                {activeTab !== 'subscription' && activeTab !== 'notifications' && activeTab !== 'create-role' && (
                    <div className="px-8 py-6 pb-0 bg-white flex-shrink-0">
                        <div className="flex flex-wrap gap-3">
                            {currentRole === UserRole.ADMIN && (
                                <button
                                    onClick={() => setActiveTab('build')}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${activeTab === 'build' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
                                >
                                    Build Chatbot
                                </button>
                            )}

                            <button
                                onClick={() => setActiveTab('customise')}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${activeTab === 'customise' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
                            >
                                Customise Chatbot
                            </button>

                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${activeTab === 'history' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
                            >
                                View Chat History
                            </button>

                            {currentRole === UserRole.ADMIN && (
                                <button
                                    onClick={() => setActiveTab('staff')}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${activeTab === 'staff' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
                                >
                                    Manage Staff
                                </button>
                            )}

                            <button
                                onClick={() => setActiveTab('feedback')}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${activeTab === 'feedback' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
                            >
                                Submit Feedback
                            </button>

                            <button
                                onClick={() => setActiveTab('account')}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${activeTab === 'account' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
                            >
                                Manage Account
                            </button>
                        </div>
                        {/* Divider */}
                        <div className="h-px w-full bg-gray-100 mt-6"></div>
                    </div>
                )}

                {/* Content Body */}
                <main className="flex-1 overflow-y-auto p-8 bg-white">
                    {activeTab === 'analytics' && renderAnalytics()}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <Notifications onBack={() => setActiveTab('analytics')} />
                    )}

                    {/* Subscription Tab (Admin Only) */}
                    {activeTab === 'subscription' && currentRole === UserRole.ADMIN && (
                        <PricingPage
                            onNavigate={() => { }}
                            user={user}
                            onSuccess={() => setActiveTab('analytics')}
                        />
                    )}

                    {/* Admin Specific Tabs */}
                    {activeTab === 'build' && currentRole === UserRole.ADMIN && (
                        <BuildChatbot onBack={() => setActiveTab('analytics')} onNavigateNext={() => setActiveTab('customise')} />
                    )}

                    {activeTab === 'staff' && currentRole === UserRole.ADMIN && (
                        <ManageStaff onBack={() => setActiveTab('analytics')} onCreateRole={() => setActiveTab('create-role')} />
                    )}

                    {activeTab === 'create-role' && currentRole === UserRole.ADMIN && (
                        <CreateRole onBack={() => setActiveTab('staff')} />
                    )}

                    {/* Shared Tabs (Customise) */}
                    {activeTab === 'customise' && (
                        currentRole === UserRole.STAFF
                            ? <StaffCustomize onBack={() => setActiveTab('analytics')} />
                            : <AdminCustomize onBack={() => setActiveTab('analytics')} />
                    )}

                    {/* Shared Tabs (History) */}
                    {activeTab === 'history' && (
                        currentRole === UserRole.STAFF
                            ? <StaffHistory onBack={() => setActiveTab('analytics')} />
                            : <AdminHistory onBack={() => setActiveTab('analytics')} />
                    )}

                    {/* Shared Tabs (Feedback) */}
                    {activeTab === 'feedback' && (
                        currentRole === UserRole.STAFF
                            ? <StaffFeedback onBack={() => setActiveTab('analytics')} />
                            : <AdminFeedback onBack={() => setActiveTab('analytics')} />
                    )}

                    {/* Shared Tabs (Account) */}
                    {activeTab === 'account' && (
                        currentRole === UserRole.STAFF
                            ? <StaffAccount onBack={() => setActiveTab('analytics')} role={currentRole} />
                            : <AdminAccount onBack={() => setActiveTab('analytics')} />
                    )}
                </main>
            </div>
        </div>
    );
};
