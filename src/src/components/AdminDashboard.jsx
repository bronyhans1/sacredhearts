import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, Zap, MessageCircle, TrendingUp, Shield, Ban, Clock, CheckCircle, XCircle, Lock } from 'lucide-react';
import { supabase } from '../supabaseClient';

const AdminDashboard = ({ adminUser, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch all statistics
      const [
        { count: totalUsers },
        { count: newUsersToday },
        { count: newUsersWeek },
        { count: bannedUsers },
        { count: frozenUsers },
        { count: lockedUsers },
        { count: pendingReports },
        { count: pendingPremium },
        { count: profileBoostRequests },
        { count: totalMatches },
        { count: totalMessages }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('updated_at', new Date().toISOString().split('T')[0]),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_frozen', true),
        supabase.from('login_attempts').select('*', { count: 'exact', head: true }).eq('is_locked', true),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('premium_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('premium_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('request_type', 'profile_boost'),
        supabase.from('matches').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalUsers: totalUsers || 0,
        newUsersToday: newUsersToday || 0,
        newUsersWeek: newUsersWeek || 0,
        bannedUsers: bannedUsers || 0,
        frozenUsers: frozenUsers || 0,
        lockedUsers: lockedUsers || 0,
        pendingReports: pendingReports || 0,
        pendingPremium: pendingPremium || 0,
        profileBoostRequests: profileBoostRequests || 0,
        totalMatches: totalMatches || 0,
        totalMessages: totalMessages || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'rose' }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-${color}-600/20 rounded-xl`}>
          <Icon size={24} className={`text-${color}-400`} />
        </div>
        {value !== null && (
          <span className="text-3xl font-bold text-white">{value.toLocaleString()}</span>
        )}
      </div>
      <h3 className="text-white/80 font-medium mb-1">{title}</h3>
      {subtitle && <p className="text-xs text-white/50">{subtitle}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield size={28} className="text-rose-400" />
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Welcome back, {adminUser?.full_name || adminUser?.email}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Users}
            title="Total Users"
            value={stats?.totalUsers}
            subtitle="All registered users"
            color="blue"
          />
          <StatCard
            icon={TrendingUp}
            title="New Users Today"
            value={stats?.newUsersToday}
            subtitle="Registered today"
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            title="New This Week"
            value={stats?.newUsersWeek}
            subtitle="Last 7 days"
            color="green"
          />
          <StatCard
            icon={AlertTriangle}
            title="Pending Reports"
            value={stats?.pendingReports}
            subtitle="Requires attention"
            color="red"
          />
          <StatCard
            icon={Zap}
            title="Premium Requests"
            value={stats?.pendingPremium}
            subtitle="Awaiting approval"
            color="yellow"
          />
          <StatCard
            icon={Ban}
            title="Banned Users"
            value={stats?.bannedUsers}
            subtitle="Currently banned"
            color="red"
          />
          <StatCard
            icon={Clock}
            title="Frozen Users"
            value={stats?.frozenUsers}
            subtitle="Temporarily frozen"
            color="orange"
          />
          <StatCard
            icon={Lock}
            title="Locked Accounts"
            value={stats?.lockedUsers}
            subtitle="Need to be unlocked"
            color="purple"
          />
          <StatCard
            icon={Zap}
            title="Profile Boost Requests"
            value={stats?.profileBoostRequests}
            subtitle="Awaiting approval"
            color="yellow"
          />
          <StatCard
            icon={MessageCircle}
            title="Total Messages"
            value={stats?.totalMessages}
            subtitle="All time messages"
            color="blue"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap size={20} className="text-yellow-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setActiveTab('users')}
              className="p-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-xl transition text-left"
            >
              <Users size={20} className="text-blue-400 mb-2" />
              <div className="text-sm font-medium">Manage Users</div>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className="p-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 rounded-xl transition text-left"
            >
              <AlertTriangle size={20} className="text-red-400 mb-2" />
              <div className="text-sm font-medium">View Reports</div>
            </button>
            <button
              onClick={() => setActiveTab('premium')}
              className="p-4 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/50 rounded-xl transition text-left"
            >
              <Zap size={20} className="text-yellow-400 mb-2" />
              <div className="text-sm font-medium">Premium Requests</div>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className="p-4 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/50 rounded-xl transition text-left"
            >
              <Clock size={20} className="text-gray-400 mb-2" />
              <div className="text-sm font-medium">Activity Logs</div>
            </button>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <p className="text-gray-400 text-sm">Activity logs will appear here...</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
