import React, { useState, useEffect } from 'react';
import { Clock, Filter, Search } from 'lucide-react';
import { supabase } from '../supabaseClient';

const AdminActivityLogs = ({ adminUser }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [filterAction]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (filterAction !== 'all') {
        query = query.eq('action_type', filterAction);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (actionType) => {
    if (actionType.includes('ban') || actionType.includes('delete')) {
      return 'text-red-400';
    }
    if (actionType.includes('freeze')) {
      return 'text-orange-400';
    }
    if (actionType.includes('resolve') || actionType.includes('approve')) {
      return 'text-green-400';
    }
    return 'text-blue-400';
  };

  const filteredLogs = logs.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.admin_email?.toLowerCase().includes(query) ||
        log.action_type?.toLowerCase().includes(query) ||
        log.target_type?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Activity Logs</h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-rose-500"
            />
          </div>
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500 [&>option]:bg-gray-800 [&>option]:text-white"
          >
            <option value="all">All Actions</option>
            <option value="user_ban">User Bans</option>
            <option value="user_unban">User Unbans</option>
            <option value="user_freeze">User Freezes</option>
            <option value="user_delete">User Deletions</option>
            <option value="report_resolve">Report Resolutions</option>
            <option value="premium_request_process">Premium Requests</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading logs...</div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Admin</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Target</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Details</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-gray-300 text-sm">{log.admin_email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${getActionColor(log.action_type)}`}>
                        {log.action_type?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm">
                      {log.target_type}: {log.target_id?.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm">
                      {log.action_details ? (
                        <details className="cursor-pointer">
                          <summary className="text-blue-400 hover:text-blue-300">View</summary>
                          <pre className="mt-2 text-xs bg-black/20 p-2 rounded">
                            {JSON.stringify(log.action_details, null, 2)}
                          </pre>
                        </details>
                      ) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActivityLogs;
