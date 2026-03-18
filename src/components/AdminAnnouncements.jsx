import React, { useState, useEffect } from 'react';
import { Megaphone, Send, Users, Filter, Clock } from 'lucide-react';
import { supabase } from '../supabaseClient';

// Admin Announcements: create & send broadcasts by gender or all users
const AdminAnnouncements = ({ adminUser }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all'); // all | male | female (matches existing gender values)
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [systemProfile, setSystemProfile] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
    fetchSystemProfile();
  }, []);

  const fetchSystemProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, is_system')
        .eq('is_system', true)
        .eq('full_name', 'Team SacredHearts')
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setError('System profile "Team SacredHearts" not found. Create it in the database (auth user + profile with is_system = true). Delivery will fail until then.');
        return;
      }
      setSystemProfile(data);
      setError(null);
    } catch (err) {
      console.error('Error loading system profile:', err);
      setError('Could not load system profile. Ensure it exists with is_system = true.');
    }
  };

  const fetchAnnouncements = async () => {
    setLoadingHistory(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      // If table doesn't exist yet or RLS blocks, show a gentle message
      console.error('Error fetching announcements:', err);
      setError('Could not load announcement history. Ensure the `announcements` table exists and admin has access.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const logAdminAction = async (announcementId) => {
    try {
      await supabase.from('admin_logs').insert({
        admin_id: adminUser.id,
        admin_email: adminUser.email,
        action_type: 'announcement_send',
        target_type: 'announcement',
        target_id: announcementId,
        action_details: {
          audience,
          title,
        },
      });
    } catch (err) {
      console.error('Error logging announcement action:', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle || !trimmedBody || !audience) {
      setError('Title, message, and audience are required.');
      return;
    }

    if (audience === 'all') {
      const confirmAll = window.confirm(
        'This announcement will be sent to ALL users. Are you sure you want to continue?'
      );
      if (!confirmAll) return;
    }

    setSending(true);
    try {
      // 1) Store announcement history (may be subject to RLS)
      let insertedId = null;
      let historyOk = false;
      const { data: inserted, error: insertError } = await supabase
        .from('announcements')
        .insert({
          title: trimmedTitle,
          body: trimmedBody,
          audience,
          created_by: adminUser.id,
          created_by_email: adminUser.email,
        })
        .select('id')
        .single();

      if (!insertError && inserted?.id) {
        insertedId = inserted.id;
        historyOk = true;
      } else if (insertError) {
        console.warn('Announcements table insert failed (RLS?):', insertError.message);
      }

      // 2) Deliver via Edge Function (service-role bypasses RLS on matches/messages)
      const { data: delivery, error: fnError } = await supabase.functions.invoke('deliver-announcement', {
        body: { title: trimmedTitle, body: trimmedBody, audience },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Delivery function failed');
      }
      const d = delivery?.data ?? delivery;

      if (d?.error) {
        throw new Error(typeof d.error === 'string' ? d.error : JSON.stringify(d.error));
      }

      const recipients = Number(d?.recipients_processed ?? 0);
      const messages = Number(d?.messages_inserted ?? 0);
      const failures = Number(d?.failures ?? 0);

      const deliveryOk = failures === 0;
      const summary = `Sent to ${recipients} users, ${messages} messages created` + (failures > 0 ? `, ${failures} failures` : '');

      if (!historyOk && deliveryOk) {
        setSuccess(`Delivered, but history was NOT saved (RLS). ${summary}`);
      } else if (!historyOk && !deliveryOk) {
        setSuccess(`Delivery completed with issues AND history was NOT saved (RLS). ${summary}`);
      } else if (historyOk && !deliveryOk) {
        setSuccess(`Delivery completed with issues. ${summary}`);
      } else {
        setSuccess(summary);
      }

      if (insertedId) await logAdminAction(insertedId);
      setTitle('');
      setBody('');
      setAudience('all');
      fetchAnnouncements();
    } catch (err) {
      console.error('Error sending announcement:', err);
      setError(err.message || 'Failed to send announcement.');
    } finally {
      setSending(false);
    }
  };

  const formatAudience = (value) => {
    if (value === 'male') return 'Men only';
    if (value === 'female') return 'Women only';
    return 'All users';
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="text-yellow-400" size={24} />
            Announcements
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Send broadcast messages to all users, only men, or only women.
          </p>
        </div>
      </div>

      {/* Compose Announcement */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded-lg px-4 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 text-sm text-green-400 bg-green-500/10 border border-green-500/40 rounded-lg px-4 py-2">
            {success}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Important update to Sacred Hearts"
              className="w-full px-3 py-2 bg-gray-900/60 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="Write the message you want users to see..."
              className="w-full px-3 py-2 bg-gray-900/60 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Audience
            </label>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-200">
                <input
                  type="radio"
                  name="audience"
                  value="all"
                  checked={audience === 'all'}
                  onChange={(e) => setAudience(e.target.value)}
                  className="text-rose-500"
                />
                <span className="flex items-center gap-1">
                  <Users size={16} className="text-blue-400" />
                  All users
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-200">
                <input
                  type="radio"
                  name="audience"
                  value="male"
                  checked={audience === 'male'}
                  onChange={(e) => setAudience(e.target.value)}
                  className="text-rose-500"
                />
                Men only (gender = "male")
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-200">
                <input
                  type="radio"
                  name="audience"
                  value="female"
                  checked={audience === 'female'}
                  onChange={(e) => setAudience(e.target.value)}
                  className="text-rose-500"
                />
                Women only (gender = "female")
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Filter size={14} className="text-gray-400" />
              Audience is based on each user&apos;s profile gender.
            </p>
            <button
              type="submit"
              disabled={sending}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                sending
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              <Send size={16} />
              {sending ? 'Sending...' : 'Send Announcement'}
            </button>
          </div>
        </form>
      </div>

      {/* Announcement History */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Clock size={18} className="text-gray-400" />
            Recent Announcements
          </h3>
          <button
            onClick={fetchAnnouncements}
            className="text-xs px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-white/10"
          >
            Refresh
          </button>
        </div>

        {loadingHistory ? (
          <div className="text-gray-400 text-sm py-6">Loading announcement history...</div>
        ) : announcements.length === 0 ? (
          <div className="text-gray-400 text-sm py-6">
            No announcements have been sent yet.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="border border-white/10 rounded-xl px-4 py-3 bg-gray-900/60"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-white flex items-center gap-2">
                    {a.title}
                  </div>
                  <span className="text-xs text-gray-400">
                    {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  {formatAudience(a.audience || 'all')}
                  {a.created_by_email && (
                    <span className="ml-2 text-gray-500">
                      · by {a.created_by_email}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">
                  {a.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnnouncements;

