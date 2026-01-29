
import React, { useState } from 'react';
import { Bot, LogOut, ShieldAlert, Users, Calendar, CreditCard } from 'lucide-react';
import { UserRole, User } from '../types';
import { PricingPage } from './PricingPage';

// Staff Components
import { SubmitFeedback as StaffFeedback } from './staff/SubmitFeedback';
import { ManageAccount as StaffAccount } from './staff/ManageAccount';

// Organisational Admin Components
// Organisational Admin Components
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
    // const [currentRole, setCurrentRole] = useState<UserRole.ADMIN | UserRole.STAFF>(UserRole.ADMIN); // Removed
    const isOrgAdmin = user?.org_role_id === 1;
    const isStaff = user?.org_role_id === 2;
    const [activeTab, setActiveTab] = useState<string>('analytics'); // Default to analytics/overview

    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    // Notifications Logic
    const [unreadCount, setUnreadCount] = useState(0);

    React.useEffect(() => {
        if (activeTab === 'analytics' && user?.organisation_id) {
            fetchAnalytics();
        }
    }, [activeTab, user?.organisation_id]);

    React.useEffect(() => {
        if (user?.user_id) {
            fetchUnreadNotifications();
        }
    }, [user?.user_id]);

    const fetchUnreadNotifications = async () => {
        if (!user?.user_id) return;
        const res = await import('../api').then(m => m.notificationService.listNotifications(user.user_id));
        if (res.ok && Array.isArray(res)) {
            const unread = res.filter((n: any) => !n.is_read).length;
            setUnreadCount(unread);
        }
    };

    const fetchAnalytics = async () => {
        if (!user?.organisation_id) return;
        setLoading(true);
        const res = await import('../api').then(m => m.orgAdminService.getChatbotAnalytics(user.organisation_id!, dateRange));
        if (res.ok) {
            setAnalyticsData(res);
        } else {
            console.error(res.error);
        }
        setLoading(false);
    };

    const renderAnalytics = () => {
        // Safe accessors
        const totalChats = analyticsData?.total_chats || 0;
        const uniqueUsers = analyticsData?.unique_users || 0;
        const activeHour = analyticsData?.most_active_hour;
        const dailyChats = analyticsData?.daily_chats || [];

        // Simple chart scaling
        const height = 200;
        const width = 800;
        const padding = 40;
        const maxCount = Math.max(...dailyChats.map((d: any) => d.count), 5); // min scale 5

        const getX = (index: number) => {
            if (dailyChats.length <= 1) return padding;
            return padding + (index / (dailyChats.length - 1)) * (width - 2 * padding);
        };

        const getY = (count: number) => {
            return height - padding - (count / maxCount) * (height - 2 * padding);
        };

        const pathD = dailyChats.length > 0
            ? `M${getX(0)},${getY(dailyChats[0].count)} ` + dailyChats.map((d: any, i: number) => `L${getX(i)},${getY(d.count)}`).join(' ')
            : '';

        return (
            <div className="animate-in fade-in duration-500">
                {/* Date Filter */}
                <div className="flex items-center gap-4 mb-8">
                    <span className="font-bold text-gray-700 text-sm">Date Range:</span>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                className="border border-gray-300 rounded px-3 py-1.5 text-sm w-36 outline-none focus:border-blue-500"
                            />
                        </div>
                        <span className="text-gray-400">-</span>
                        <div className="relative">
                            <input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                className="border border-gray-300 rounded px-3 py-1.5 text-sm w-36 outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <button
                        onClick={fetchAnalytics}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1.5 px-6 rounded text-sm transition-colors"
                    >
                        Apply
                    </button>
                </div>

                {/* Main Chart Section */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
                    <h3 className="font-bold text-gray-700 mb-6">Daily Chats</h3>
                    <div className="h-64 w-full relative">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
                        ) : (
                            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                                {/* Grid Lines */}
                                {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                                    <line
                                        key={pct}
                                        x1={padding}
                                        y1={padding + pct * (height - 2 * padding)}
                                        x2={width - padding}
                                        y2={padding + pct * (height - 2 * padding)}
                                        stroke="#f3f4f6"
                                        strokeWidth="1"
                                    />
                                ))}

                                {/* Y-Axis Labels */}
                                <text x={padding - 10} y={padding} className="text-xs fill-gray-400" textAnchor="end">{Math.round(maxCount)}</text>
                                <text x={padding - 10} y={height - padding} className="text-xs fill-gray-400" textAnchor="end">0</text>

                                {/* X-Axis Labels */}
                                {dailyChats.map((d: any, i: number) => (
                                    <text key={i} x={getX(i)} y={height - 10} className="text-xs fill-gray-500" textAnchor="middle">{d.date.slice(0, 5)}</text>
                                ))}

                                {/* The Line Path */}
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {/* Data Points */}
                                {dailyChats.map((d: any, i: number) => (
                                    <circle key={i} cx={getX(i)} cy={getY(d.count)} r="4" fill="#3b82f6">
                                        <title>{d.date}: {d.count} chats</title>
                                    </circle>
                                ))}
                            </svg>
                        )}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Total Chats</p>
                        <h4 className="text-3xl font-bold text-gray-900">{totalChats}</h4>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Unique Users</p>
                        <h4 className="text-3xl font-bold text-gray-900">{uniqueUsers}</h4>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Most Active Hour</p>
                        <h4 className="text-xl font-bold text-gray-900">
                            {activeHour?.label || 'N/A'}
                        </h4>
                        <span className="text-sm text-gray-500">
                            {activeHour?.count || 0} chats
                        </span>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-8 rounded flex items-center gap-2 transition-colors">
                        Export Report
                    </button>
                </div>
            </div>
        );
    };

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

                {/* Switch Role Button Removed */}
                {/* <div className="relative group">
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
                </div> */}

                {/* Subscription Button (Admin Only) */}
                {isOrgAdmin && (
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
                            BotForge <span className="font-normal text-gray-400">| {isOrgAdmin ? 'Organisational Admin' : 'Staff'}</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <div
                            className="relative cursor-pointer"
                            onClick={() => setActiveTab('notifications')}
                        >
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-400"></span>
                            )}
                            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">Hi, {user?.username || 'User'}</p>
                                <p className="text-xs text-gray-500">{isOrgAdmin ? 'Org Admin' : 'Staff'}</p>
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
                            {/* Build Chatbot Removed for everyone */}
                            {/* {currentRole === UserRole.ADMIN && (
                                <button
                                    onClick={() => setActiveTab('build')}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${activeTab === 'build' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
                                >
                                    Build Chatbot
                                </button>
                            )} */}

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

                            {isOrgAdmin && (
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
                        <Notifications onBack={() => { setActiveTab('analytics'); fetchUnreadNotifications(); }} user={user} />
                    )}

                    {/* Subscription Tab (Admin Only) */}
                    {activeTab === 'subscription' && isOrgAdmin && (
                        <PricingPage
                            user={user}
                            onSuccess={() => setActiveTab('analytics')}
                        />
                    )}

                    {/* Admin Specific Tabs */}
                    {/* {activeTab === 'build' && currentRole === UserRole.ADMIN && (
                        <BuildChatbot onBack={() => setActiveTab('analytics')} onNavigateNext={() => setActiveTab('customise')} />
                    )} */}

                    {activeTab === 'staff' && isOrgAdmin && (
                        <ManageStaff onBack={() => setActiveTab('analytics')} onCreateRole={() => setActiveTab('create-role')} />
                    )}

                    {activeTab === 'create-role' && isOrgAdmin && (
                        <CreateRole onBack={() => setActiveTab('staff')} />
                    )}

                    {/* Shared Tabs (Customise) */}
                    {activeTab === 'customise' && (
                        <AdminCustomize onBack={() => setActiveTab('analytics')} organisationId={user?.organisation_id} />
                    )}

                    {/* Shared Tabs (History) */}
                    {activeTab === 'history' && (
                        <AdminHistory onBack={() => setActiveTab('analytics')} organisationId={user?.organisation_id} />
                    )}

                    {/* Shared Tabs (Feedback) */}
                    {activeTab === 'feedback' && (
                        isStaff
                            ? <StaffFeedback onBack={() => setActiveTab('analytics')} user={user} />
                            : <AdminFeedback onBack={() => setActiveTab('analytics')} user={user} />
                    )}

                    {/* Shared Tabs (Account) */}
                    {activeTab === 'account' && (
                        isStaff
                            ? <StaffAccount onBack={() => setActiveTab('analytics')} role={UserRole.STAFF} />
                            : <AdminAccount onBack={() => setActiveTab('analytics')} />
                    )}
                </main>
            </div>
        </div>
    );
};
