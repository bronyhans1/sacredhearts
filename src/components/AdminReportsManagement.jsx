import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import { supabase } from '../supabaseClient';

const AdminReportsManagement = ({ adminUser }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [filterStatus]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // First, fetch reports
      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data: reportsData, error: reportsError } = await query;
      if (reportsError) throw reportsError;

      // Then, fetch related profiles separately
      if (reportsData && reportsData.length > 0) {
        const reporterIds = [...new Set(reportsData.map(r => r.reporter_id).filter(Boolean))];
        const reportedUserIds = [...new Set(reportsData.map(r => r.reported_user_id).filter(Boolean))];
        const allUserIds = [...new Set([...reporterIds, ...reportedUserIds])];

        if (allUserIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', allUserIds);

          if (profilesError) {
            console.warn('Error fetching profiles:', profilesError);
          } else {
            // Map profiles to reports
            const profilesMap = {};
            if (profilesData) {
              profilesData.forEach(profile => {
                profilesMap[profile.id] = profile;
              });
            }

            // Attach profile data to reports
            const reportsWithProfiles = reportsData.map(report => ({
              ...report,
              reporter: profilesMap[report.reporter_id] || null,
              reported_user: profilesMap[report.reported_user_id] || null
            }));

            setReports(reportsWithProfiles);
            return;
          }
        }
      }

      // If no profiles to fetch or error, just set reports without profile data
      setReports(reportsData || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      alert('Error loading reports: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId, status, notes) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: status,
          admin_notes: notes,
          reviewed_by: adminUser.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      // Log the action
      await supabase.from('admin_logs').insert({
        admin_id: adminUser.id,
        admin_email: adminUser.email,
        action_type: 'report_resolve',
        target_type: 'report',
        target_id: reportId,
        action_details: { status, notes }
      });

      alert('Report updated successfully');
      fetchReports();
      setShowDetails(false);
    } catch (error) {
      console.error('Error resolving report:', error);
      alert('Error: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'reviewed': return 'bg-blue-500/20 text-blue-400';
      case 'resolved': return 'bg-green-500/20 text-green-400';
      case 'dismissed': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getReportTypeColor = (type) => {
    switch (type) {
      case 'harassment': return 'text-red-400';
      case 'spam': return 'text-orange-400';
      case 'fake_profile': return 'text-yellow-400';
      case 'inappropriate_content': return 'text-pink-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Reports Management</h2>
        
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500 [&>option]:bg-gray-800 [&>option]:text-white"
        >
          <option value="all">All Reports</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading reports...</div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <div
              key={report.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition cursor-pointer"
              onClick={() => {
                setSelectedReport(report);
                setShowDetails(true);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle size={20} className="text-red-400" />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                    <span className={`text-sm font-medium ${getReportTypeColor(report.report_type)}`}>
                      {report.report_type}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-300 mb-2">
                    <span className="text-gray-400">Reported by:</span> {report.reporter?.full_name || 'Unknown'}
                    <span className="mx-2">•</span>
                    <span className="text-gray-400">Reported user:</span> {report.reported_user?.full_name || 'Unknown'}
                  </div>
                  
                  {report.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">{report.description}</p>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(report.created_at).toLocaleString()}
                  </div>
                </div>
                
                <Eye size={20} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Details Modal */}
      {showDetails && selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          onClose={() => setShowDetails(false)}
          onResolve={handleResolveReport}
        />
      )}
    </div>
  );
};

const ReportDetailsModal = ({ report, onClose, onResolve }) => {
  const [action, setAction] = useState('resolved');
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Report Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XCircle size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Reporter</div>
              <div className="font-medium text-white">{report.reporter?.full_name || 'Unknown'}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Reported User</div>
              <div className="font-medium text-white">{report.reported_user?.full_name || 'Unknown'}</div>
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Report Type</div>
            <div className="font-medium text-white">{report.report_type}</div>
            {report.category && (
              <div className="text-sm text-gray-400 mt-1">Category: {report.category}</div>
            )}
          </div>

          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-2">Description</div>
            <div className="text-white">{report.description || 'No description provided'}</div>
          </div>

          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Status</div>
            <div className="font-medium text-white">{report.status}</div>
            {report.reviewed_at && (
              <div className="text-xs text-gray-400 mt-1">
                Reviewed: {new Date(report.reviewed_at).toLocaleString()}
              </div>
            )}
          </div>

          {report.admin_notes && (
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-sm text-gray-400 mb-2">Admin Notes</div>
              <div className="text-white">{report.admin_notes}</div>
            </div>
          )}

          <div className="border-t border-white/10 pt-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Action</label>
              <select
                value={action}
                onChange={e => setAction(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500 [&>option]:bg-gray-800 [&>option]:text-white"
              >
                <option value="resolved">Resolve</option>
                <option value="dismissed">Dismiss</option>
                <option value="reviewed">Mark as Reviewed</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Admin Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes about this report..."
                rows={4}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => onResolve(report.id, action, notes)}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-lg transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsManagement;
