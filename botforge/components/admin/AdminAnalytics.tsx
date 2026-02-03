import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { Users, Building2, CreditCard, Activity, Download, Loader2, MessageSquare, Clock } from 'lucide-react';
import { sysAdminService } from '../../api';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const AdminAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  
  // State for the different data sources
  const [userStatus, setUserStatus] = useState({ active: 0, inactive: 0, total: 0 });
  const [usageData, setUsageData] = useState<any[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<any[]>([]);
  const [subscriptionStats, setSubscriptionStats] = useState<any[]>([]);
  const [totalOrgs, setTotalOrgs] = useState(0);

  // Filter state for the usage chart
  const [usageMetric, setUsageMetric] = useState<'messages' | 'sessions'>('messages');
  const [usageDays, setUsageDays] = useState(7);

  useEffect(() => {
    fetchAllStats();
  }, []);

  // Re-fetch usage data when filters change
  useEffect(() => {
    fetchUsageStats();
  }, [usageMetric, usageDays]);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserStatus(),
        fetchUsageStats(),
        fetchRoleAndOrgStats(),
        fetchSubscriptionStats()
      ]);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Fetch User Status (Active vs Inactive) from new endpoint
  const fetchUserStatus = async () => {
    const res = await sysAdminService.listUsers();
    if (res.ok && res.users) {
      const nonSysAdminUsers = res.users.filter(
        (u: any) => u.system_role_id !== 0 && u.system_role_id !== "0"
      );

      const active = nonSysAdminUsers.filter((u: any) => Boolean(u.status) === true).length;
      const inactive = nonSysAdminUsers.filter((u: any) => Boolean(u.status) === false).length;

      setUserStatus({
        active,
        inactive,
        total: nonSysAdminUsers.length
      });
    }
  };

  // 2. Fetch Daily Usage from new endpoint
  const fetchUsageStats = async () => {
    const res = await sysAdminService.getDashboardDailyUsage(usageDays, usageMetric);
    if (res.ok && res.series) {
      setUsageData(res.series);
    }
  };

  // 3. Fetch Roles & Orgs using listUsers (Frontend aggregation needed for Role Dist)
  const fetchRoleAndOrgStats = async () => {
    const res = await sysAdminService.listUsers();
    if (res.ok && res.users) {

      const nonSysAdminUsers = res.users.filter(
        (u: any) => Number(u.system_role_id) !== 0
      );
      // Calculate Role Distribution
      const roles: Record<string, number> = {};

      const prettifyRole = (raw: string) => {
        const key = String(raw || "").trim().toUpperCase();

        if (key === "ORG_ADMIN") return "Org Admin";
        if (key === "PATRON") return "Patron";
        if (key === "STAFF") return "Staff";

        // fallback: turn "SOME_ROLE_NAME" -> "Some Role Name"
        return key
          .toLowerCase()
          .split("_")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      };

      nonSysAdminUsers.forEach((u: any) => {
        const sysRoleId = Number(u.system_role_id);

        let roleName = 'Unknown';

        if (sysRoleId === 2) {
          roleName = 'PATRON';
        } else if (sysRoleId === 1) {
          roleName = u.org_role_name || 'ORG USER';
        }

        const rawKey = String(roleName || "").trim().toUpperCase();

        if (rawKey === "STAFF_CUSTOMCHATBOT") return;

        const displayName = prettifyRole(rawKey);

        roles[displayName] = (roles[displayName] || 0) + 1;
      });

      setRoleDistribution(
        Object.keys(roles).map(name => ({ name, value: roles[name] }))
      );

      // Calculate Total Orgs
      const uniqueOrgs = new Set(
        nonSysAdminUsers
          .map((u: any) => u.organisation_id)
          .filter((id: any) => id !== null)
      );
      setTotalOrgs(uniqueOrgs.size);
    }
  };

  // 4. Fetch Subscriptions for Pricing Overview
  const fetchSubscriptionStats = async () => {
    const res = await sysAdminService.listSubscriptions();
    if (res.ok && res.subscriptions) {
      setSubscriptionStats(res.subscriptions.map((s: any) => ({
        name: s.name,
        price: s.price,
        status: s.status === 0 ? 'Active' : 'Inactive'
      })));
    }
  };

  if (loading && userStatus.total === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">System Analytics</h1>
          <p className="text-gray-500 text-sm">Real-time overview of BotForge system performance</p>
        </div>
        <button 
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium text-sm"
          onClick={() => window.print()}
        >
          <Download className="h-4 w-4" /> Export Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={userStatus.total} icon={<Users />} color="blue" />
        <StatCard title="Active Users" value={userStatus.active} icon={<Activity />} color="green" />
        <StatCard title="Organisations" value={totalOrgs} icon={<Building2 />} color="purple" />
        <StatCard title="Active Plans" value={subscriptionStats.length} icon={<CreditCard />} color="orange" />
      </div>

      {/* Main Activity Chart - NEW */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            {usageMetric === 'messages' ? <MessageSquare className="w-5 h-5 text-blue-500"/> : <Clock className="w-5 h-5 text-purple-500"/>}
            System Activity Trends
          </h3>
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setUsageMetric('messages')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${usageMetric === 'messages' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Messages
            </button>
            <button 
              onClick={() => setUsageMetric('sessions')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${usageMetric === 'sessions' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Sessions
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <select 
              value={usageDays} 
              onChange={(e) => setUsageDays(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
            >
              <option value={7}>Last 7 Days</option>
              <option value={14}>Last 14 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={usageData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#6b7280', fontSize: 12}} 
                dy={10}
                tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#6b7280', fontSize: 12}} 
              />
              <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                cursor={{stroke: '#e5e7eb', strokeWidth: 2}}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke={usageMetric === 'messages' ? '#2563eb' : '#8b5cf6'} 
                strokeWidth={3} 
                dot={{r: 4, strokeWidth: 2, fill: '#fff'}} 
                activeDot={{r: 6}} 
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Role Distribution */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4 text-gray-800">User Role Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Pricing Overview */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Plan Pricing Overview ($)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subscriptionStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f9fafb'}} />
                <Bar dataKey="price" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`p-4 rounded-xl bg-${color}-50 text-${color}-600`}>
      {React.cloneElement(icon, { className: 'h-6 w-6' })}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);
