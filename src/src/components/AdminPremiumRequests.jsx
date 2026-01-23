import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { supabase } from '../supabaseClient';

const AdminPremiumRequests = ({ adminUser }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // First, fetch premium requests
      let query = supabase
        .from('premium_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data: requestsData, error: requestsError } = await query;
      if (requestsError) throw requestsError;

      // Then, fetch related user profiles separately
      if (requestsData && requestsData.length > 0) {
        const userIds = [...new Set(requestsData.map(r => r.user_id).filter(Boolean))];

        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, email')
            .in('id', userIds);

          if (profilesError) {
            console.warn('Error fetching profiles:', profilesError);
          } else {
            // Map profiles to requests
            const profilesMap = {};
            if (profilesData) {
              profilesData.forEach(profile => {
                profilesMap[profile.id] = profile;
              });
            }

            // Attach profile data to requests
            const requestsWithUsers = requestsData.map(request => ({
              ...request,
              user: profilesMap[request.user_id] || null
            }));

            setRequests(requestsWithUsers);
            return;
          }
        }
      }

      // If no users to fetch or error, just set requests without user data
      setRequests(requestsData || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      alert('Error loading premium requests: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (requestId, status, notes) => {
    try {
      const request = requests.find(r => r.id === requestId);
      
      const { error } = await supabase
        .from('premium_requests')
        .update({
          status: status,
          admin_notes: notes,
          processed_by: adminUser.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // If approved, grant the premium feature
      if (status === 'approved' && request) {
        if (request.request_type === 'profile_boost') {
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);
          await supabase.from('profiles').update({
            boost_active: true,
            boost_expires_at: expiresAt.toISOString()
          }).eq('id', request.user_id);
        }
        // Add other premium feature grants here
      }

      // Log the action
      await supabase.from('admin_logs').insert({
        admin_id: adminUser.id,
        admin_email: adminUser.email,
        action_type: 'premium_request_process',
        target_type: 'premium_request',
        target_id: requestId,
        action_details: { status, notes, request_type: request?.request_type }
      });

      alert('Request processed successfully');
      fetchRequests();
    } catch (error) {
      console.error('Error processing request:', error);
      alert('Error: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      case 'completed': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Premium Requests</h2>
        
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500 [&>option]:bg-gray-800 [&>option]:text-white"
        >
          <option value="all">All Requests</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading requests...</div>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <RequestCard
              key={request.id}
              request={request}
              onProcess={handleProcessRequest}
              statusColor={getStatusColor}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const RequestCard = ({ request, onProcess, statusColor }) => {
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState('approved');
  const [notes, setNotes] = useState('');

  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Zap size={20} className="text-yellow-400" />
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(request.status)}`}>
                {request.status}
              </span>
              <span className="text-sm font-medium text-white capitalize">
                {request.request_type?.replace('_', ' ')}
              </span>
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <img
                src={request.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.user?.full_name}`}
                alt={request.user?.full_name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <div className="font-medium text-white">{request.user?.full_name || 'Unknown'}</div>
                <div className="text-sm text-gray-400">{request.user?.email || 'N/A'}</div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              Requested: {new Date(request.requested_at).toLocaleString()}
            </div>
            
            {request.admin_notes && (
              <div className="mt-2 text-sm text-gray-400">
                Notes: {request.admin_notes}
              </div>
            )}
          </div>
          
          {request.status === 'pending' && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-lg transition"
            >
              Process
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Process Request</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Action</label>
              <select
                value={action}
                onChange={e => setAction(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500 [&>option]:bg-gray-800 [&>option]:text-white"
              >
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes..."
                rows={3}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onProcess(request.id, action, notes);
                  setShowModal(false);
                }}
                className={`flex-1 px-4 py-2 rounded-lg transition ${
                  action === 'approved' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {action === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPremiumRequests;
