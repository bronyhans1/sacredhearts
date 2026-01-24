import React, { useState, useEffect } from 'react';
import { Search, Ban, Trash2, Lock, Unlock, Eye, X, CheckCircle, AlertTriangle, Mail, Phone, MapPin, Calendar, User, Shield, Heart, Briefcase, MessageCircle, BadgeCheck, Zap } from 'lucide-react';
import { supabase } from '../supabaseClient';

const AdminUserManagement = ({ adminUser, onAction }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, banned, frozen, locked, deleted
  const [selectedUser, setSelectedUser] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [toast, setToast] = useState(null);

  // Toast function
  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchUsers();
  }, [filterStatus]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Try to use the admin function first (if available)
      let usersData = null;
      try {
        const { data: functionData, error: functionError } = await supabase
          .rpc('get_all_users_for_admin');
        
        if (!functionError && functionData) {
          usersData = functionData;
        }
      } catch (err) {
        console.warn('Admin function not available, using direct query:', err);
      }

      // Handle deleted accounts separately
      if (filterStatus === 'deleted') {
        const { data: deletedAccounts, error: deletedError } = await supabase
          .from('deleted_accounts')
          .select('*')
          .order('deleted_at', { ascending: false })
          .limit(500);
        
        if (deletedError) {
          console.error('Error fetching deleted accounts:', deletedError);
          showToast('Error loading deleted accounts: ' + deletedError.message, 'error');
          throw deletedError;
        }
        
        // Format deleted accounts to match user structure
        usersData = (deletedAccounts || []).map(deleted => ({
          id: deleted.user_id,
          full_name: deleted.full_name || 'Unknown',
          email: deleted.email || 'N/A',
          phone: deleted.phone || 'N/A',
          is_deleted: true,
          deletion_reason: deleted.deletion_reason,
          deleted_at: deleted.deleted_at,
          can_rejoin: deleted.can_rejoin
        }));
      } else {
        // Fallback: Fetch from profiles and manually get email/lock status
        if (!usersData) {
          let query = supabase
            .from('profiles')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(500);

          // Get deleted user IDs to exclude them from active users
          const { data: deletedUserIds } = await supabase
            .from('deleted_accounts')
            .select('user_id');
          
          const deletedIdsSet = new Set((deletedUserIds || []).map(d => d.user_id));
          
          if (filterStatus === 'banned') {
            query = query.eq('is_banned', true);
          } else if (filterStatus === 'frozen') {
            query = query.eq('is_frozen', true);
          } else if (filterStatus === 'active') {
            query = query.eq('is_banned', false).eq('is_frozen', false);
          }

          const { data: profilesData, error } = await query;
          if (error) {
            console.error('Error fetching users:', error);
            showToast('Error loading users: ' + error.message, 'error');
            throw error;
          }

          // Fetch locked accounts
          const { data: lockedAccounts } = await supabase
            .from('login_attempts')
            .select('email, is_locked, locked_until')
            .eq('is_locked', true);

          // For each profile, try to get email and lock status
          // Filter out deleted accounts (except when viewing deleted accounts)
          // Note: We can't directly query auth.users from client, so email will be 'N/A' unless function exists
          usersData = (profilesData || [])
            .filter(profile => filterStatus === 'deleted' || !deletedIdsSet.has(profile.id))
            .map(profile => {
              // Try to find locked account by checking if email matches (we don't have email yet)
              // This is a limitation - we need the database function
              const isLocked = false; // Will be set by function if available
              const lockedUntil = null;

              return {
                ...profile,
                email: 'N/A', // Will be populated by function
                is_locked: isLocked,
                locked_until: lockedUntil
              };
            });
        }

        // Filter by locked status if needed
        if (filterStatus === 'locked') {
          usersData = usersData.filter(u => u.is_locked);
        }
      }
      
      let filteredUsers = usersData;
      
      console.log('Fetched users:', filteredUsers?.length || 0, 'users');
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Error: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (type, userId) => {
    setActionType(type);
    setSelectedUser(users.find(u => u.id === userId));
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    // Unlock and verify actions don't require a reason
    if (!selectedUser || (!actionReason.trim() && actionType !== 'unlock' && actionType !== 'verify' && actionType !== 'unverify')) {
      showToast('Please provide a reason for this action', 'error');
      return;
    }

    try {
      let updateData = {};
      
      if (actionType === 'ban') {
        updateData = {
          is_banned: true,
          ban_reason: actionReason,
          banned_at: new Date().toISOString(),
          banned_by: adminUser.id
        };
      } else if (actionType === 'unban') {
        updateData = {
          is_banned: false,
          ban_reason: null,
          banned_at: null
        };
      } else if (actionType === 'freeze') {
        // Freeze for 7 days
        const frozenUntil = new Date();
        frozenUntil.setDate(frozenUntil.getDate() + 7);
        updateData = {
          is_frozen: true,
          frozen_until: frozenUntil.toISOString()
        };
      } else if (actionType === 'unfreeze') {
        updateData = {
          is_frozen: false,
          frozen_until: null
        };
      } else if (actionType === 'verify') {
        updateData = {
          is_verified: true
        };
      } else if (actionType === 'unverify') {
        updateData = {
          is_verified: false
        };
      } else if (actionType === 'unlock') {
        // Unlock account using database function or by email
        try {
          // Try using database function first (best approach)
          try {
            const { data: unlockResult, error: functionError } = await supabase
              .rpc('unlock_user_account', { user_uuid: selectedUser.id });
            
            if (!functionError) {
              await logAdminAction('user_unlock', selectedUser.id, { reason: actionReason || 'Admin unlock' });
              showToast('Account unlocked successfully', 'success');
              fetchUsers();
              setShowActionModal(false);
              setActionReason('');
              return;
            } else {
              console.warn('Unlock function not available, trying fallback:', functionError);
            }
          } catch (funcErr) {
            console.warn('Unlock function error:', funcErr);
          }
          
          // Fallback: Get email and delete from login_attempts manually
          let userEmail = selectedUser?.email || userDetails?.email;
          
          // If email is N/A or not available, try to get from database function
          if (!userEmail || userEmail === 'N/A') {
            try {
              const { data: userData } = await supabase
                .rpc('get_user_profile_for_admin', { user_uuid: selectedUser.id });
              
              if (userData && userData.length > 0 && userData[0].email && userData[0].email !== 'N/A') {
                userEmail = userData[0].email;
              }
            } catch (err) {
              console.warn('Could not get email from function:', err);
            }
          }
          
          // Delete or update login_attempts record by email
          if (userEmail && userEmail !== 'N/A') {
            // First try deleting the locked record
            const { error: deleteError } = await supabase
              .from('login_attempts')
              .delete()
              .eq('email', userEmail)
              .eq('is_locked', true);
            
            // If delete had an error, try updating instead
            if (deleteError) {
              console.warn('Delete failed, trying update:', deleteError);
              const { error: updateError } = await supabase
                .from('login_attempts')
                .update({ 
                  is_locked: false, 
                  locked_until: null, 
                  attempt_count: 0,
                  updated_at: new Date().toISOString()
                })
                .eq('email', userEmail)
                .eq('is_locked', true);
              
              if (updateError) {
                throw updateError;
              }
            }
            
            await logAdminAction('user_unlock', selectedUser.id, { reason: actionReason || 'Admin unlock' });
            showToast('Account unlocked successfully', 'success');
          } else {
            showToast('Could not find user email. Please ensure the SQL function is installed.', 'error');
            throw new Error('User email not found');
          }
          
          fetchUsers();
          setShowActionModal(false);
          setActionReason('');
          return;
        } catch (unlockError) {
          console.error('Unlock error:', unlockError);
          showToast(`Failed to unlock account: ${unlockError.message}`, 'error');
          throw unlockError;
        }
      } else if (actionType === 'delete') {
        // Delete user account - comprehensive deletion
        try {
          // Check if profile exists first
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', selectedUser.id)
            .single();

          // Step 1: Clean up related data first (only if profile exists)
          if (existingProfile) {
            try {
              // Delete matches
              await supabase.from('matches').delete().or(`user_a_id.eq.${selectedUser.id},user_b_id.eq.${selectedUser.id}`);
              // Delete likes
              await supabase.from('likes').delete().or(`liker_id.eq.${selectedUser.id},liked_id.eq.${selectedUser.id}`);
              // Delete messages
              await supabase.from('messages').delete().or(`sender_id.eq.${selectedUser.id},recipient_id.eq.${selectedUser.id}`);
              // Delete reports
              await supabase.from('reports').delete().or(`reporter_id.eq.${selectedUser.id},reported_user_id.eq.${selectedUser.id}`);
              // Delete stories
              await supabase.from('stories').delete().eq('user_id', selectedUser.id);
              // Delete story views
              await supabase.from('story_views').delete().eq('viewer_id', selectedUser.id);
              // Delete profile visitors
              await supabase.from('profile_visitors').delete().or(`viewer_id.eq.${selectedUser.id},profile_id.eq.${selectedUser.id}`);
              // Delete discovery exclusions
              await supabase.from('discovery_exclusions').delete().or(`user_id.eq.${selectedUser.id},excluded_user_id.eq.${selectedUser.id}`);
              // Delete premium requests
              await supabase.from('premium_requests').delete().eq('user_id', selectedUser.id);
              // Delete login attempts
              if (selectedUser.email) {
                await supabase.from('login_attempts').delete().eq('email', selectedUser.email);
              }
            } catch (cleanupErr) {
              console.warn('Some cleanup operations failed:', cleanupErr.message);
              // Continue - try to delete profile anyway
            }

            // Step 2: Delete profile (only if it exists)
            const { error: profileError } = await supabase
              .from('profiles')
              .delete()
              .eq('id', selectedUser.id);
            
            if (profileError) {
              console.warn('Profile deletion warning (may already be deleted):', profileError.message);
            }
          } else {
            console.log('Profile does not exist, proceeding with auth cleanup only');
          }

          // Step 3: Try to delete from auth.users using database function (if available)
          // Note: We can't delete from auth.users directly due to foreign key constraints
          // The related data must be deleted first, which we did in Step 1
          let authDeleted = false;
          
          // Since we already cleaned up related data, try using RPC function
          try {
            const { data: functionResult, error: functionError } = await supabase
              .rpc('delete_user_completely', { user_id_param: selectedUser.id });
            
            if (!functionError && functionResult && functionResult.success !== false) {
              authDeleted = true;
            } else if (functionError) {
              console.warn('Function error (may not exist or need manual SQL):', functionError.message);
              // The function might not exist or auth.users deletion requires direct SQL
              // We'll provide SQL instructions in the alert
            }
          } catch (rpcErr) {
            console.warn('RPC function failed (expected):', rpcErr.message);
            // The function might not exist - user needs to run SQL directly
          }
          
          // Log the action
          await logAdminAction('user_delete', selectedUser.id, { reason: actionReason });
          
          if (authDeleted) {
            showToast('User deleted successfully from both profile and authentication.', 'success');
          } else {
            // Provide SQL command that includes cleanup of related data
            const sqlCommand = `-- Run this SQL in Supabase SQL Editor\nDO $$\nDECLARE\n  user_uuid UUID := '${selectedUser.id}'::uuid;\nBEGIN\n  DELETE FROM likes WHERE liker_id = user_uuid OR liked_id = user_uuid;\n  DELETE FROM matches WHERE user_a_id = user_uuid OR user_b_id = user_uuid;\n  DELETE FROM messages WHERE sender_id = user_uuid OR recipient_id = user_uuid;\n  DELETE FROM reports WHERE reporter_id = user_uuid OR reported_user_id = user_uuid;\n  DELETE FROM stories WHERE user_id = user_uuid;\n  DELETE FROM story_views WHERE viewer_id = user_uuid;\n  DELETE FROM profile_visitors WHERE viewer_id = user_uuid OR profile_id = user_uuid;\n  DELETE FROM discovery_exclusions WHERE user_id = user_uuid OR excluded_user_id = user_uuid;\n  DELETE FROM premium_requests WHERE user_id = user_uuid;\n  DELETE FROM profiles WHERE id = user_uuid;\n  DELETE FROM auth.users WHERE id = user_uuid;\n  RAISE NOTICE 'User deleted successfully';\nEND $$;`;
            
            showToast('User profile and related data deleted. Run SQL in Supabase to complete deletion from Authentication.', 'warning');
          }
          
          fetchUsers();
          setShowActionModal(false);
          return;
        } catch (deleteError) {
          console.error('Delete error:', deleteError);
          throw new Error(`Failed to delete user: ${deleteError.message}`);
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Log the action
      await logAdminAction(`user_${actionType}`, selectedUser.id, { reason: actionReason });

      const actionPastTense = actionType === 'unban' || actionType === 'unfreeze' || actionType === 'unverify' 
        ? `${actionType.replace('un', '')}ned` 
        : `${actionType}d`;
      showToast(`User ${actionPastTense} successfully`, 'success');
      fetchUsers();
      setShowActionModal(false);
      setActionReason('');
    } catch (error) {
      console.error('Error performing action:', error);
      showToast('Error: ' + error.message, 'error');
    }
  };

  const logAdminAction = async (actionType, targetId, details) => {
    try {
      await supabase.from('admin_logs').insert({
        admin_id: adminUser.id,
        admin_email: adminUser.email,
        action_type: actionType,
        target_type: 'user',
        target_id: targetId,
        action_details: details
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const handleViewUserDetails = async (userId) => {
    setLoadingDetails(true);
    setShowUserDetails(true);
    try {
      // Try to use the admin function first (if available)
      let profileData = null;
      try {
        const { data: functionData, error: functionError } = await supabase
          .rpc('get_user_profile_for_admin', { user_uuid: userId });
        
        if (!functionError && functionData && functionData.length > 0) {
          profileData = functionData[0];
        }
      } catch (err) {
        console.warn('Admin function not available, using direct query:', err);
      }

      // If function didn't work, fetch directly from profiles
      if (!profileData) {
        const { data: directData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;
        profileData = directData;
        
        // Try to get email and lock status manually
        // Check login_attempts for lock status
        const { data: lockedAccount } = await supabase
          .from('login_attempts')
          .select('is_locked, locked_until')
          .eq('is_locked', true)
          .limit(1);
        
        profileData.is_locked = lockedAccount?.[0]?.is_locked || false;
        profileData.locked_until = lockedAccount?.[0]?.locked_until || null;
        profileData.email = 'N/A'; // Can't get email without function
      }

      // Ensure email and phone are set
      // If email is still N/A or missing, try to get it from selectedUser
      if (!profileData.email || profileData.email === 'N/A') {
        const emailSource = selectedUser?.email;
        if (emailSource && emailSource !== 'N/A') {
          profileData.email = emailSource;
        } else {
          profileData.email = 'N/A';
        }
      }
      if (!profileData.phone) profileData.phone = 'N/A';
      
      // Also ensure lock status is included if available from selectedUser
      if (selectedUser?.is_locked !== undefined) {
        profileData.is_locked = selectedUser.is_locked;
        profileData.locked_until = selectedUser.locked_until;
      }

      // Fetch additional stats
      const [matchesResult, messagesResult, reportsResult] = await Promise.all([
        supabase.from('matches').select('*', { count: 'exact', head: true })
          .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`),
        supabase.from('messages').select('*', { count: 'exact', head: true })
          .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`),
        supabase.from('reports').select('*', { count: 'exact', head: true })
          .or(`reporter_id.eq.${userId},reported_user_id.eq.${userId}`)
      ]);

      setUserDetails({
        ...profileData,
        stats: {
          matches: matchesResult.count || 0,
          messages: messagesResult.count || 0,
          reports: reportsResult.count || 0
        }
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
      showToast('Error loading user details: ' + error.message, 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.full_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.city?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="p-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium animate-fade-in-up ${
          toast.type === 'success' ? 'bg-green-600' : 
          toast.type === 'warning' ? 'bg-yellow-600' : 
          'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">User Management</h2>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or city..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-rose-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500 [&>option]:bg-gray-800 [&>option]:text-white"
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="frozen">Frozen</option>
            <option value="locked">Locked Accounts</option>
            <option value="deleted">Deleted Accounts</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading users...</div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">City</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                  {filterStatus === 'deleted' && (
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Deletion Reason</th>
                  )}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">{filterStatus === 'deleted' ? 'Deleted' : 'Joined'}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-white/5 cursor-pointer" onClick={() => handleViewUserDetails(user.id)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`}
                          alt={user.full_name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="font-medium text-white">{user.full_name}</div>
                          <div className="text-xs text-gray-400">{user.gender}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm">{user.email || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm">{user.city || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {user.is_deleted ? (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">Deleted</span>
                        ) : user.is_banned ? (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">Banned</span>
                        ) : user.is_frozen ? (
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">Frozen</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Active</span>
                        )}
                        {user.is_locked && !user.is_deleted && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs flex items-center gap-1">
                            <Lock size={10} /> Locked
                          </span>
                        )}
                        {user.is_verified && !user.is_deleted && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center gap-1">
                            <BadgeCheck size={10} /> Verified
                          </span>
                        )}
                      </div>
                    </td>
                    {filterStatus === 'deleted' && (
                      <td className="px-4 py-3 text-gray-300 text-sm max-w-xs">
                        <div className="truncate" title={user.deletion_reason || 'No reason provided'}>
                          {user.deletion_reason || 'No reason provided'}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-300 text-sm">
                      {user.is_deleted 
                        ? (user.deleted_at ? new Date(user.deleted_at).toLocaleDateString() : 'N/A')
                        : (user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A')
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {user.is_locked && (
                          <button
                            onClick={() => handleAction('unlock', user.id)}
                            className="p-2 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition"
                            title="Unlock Account"
                          >
                            <Unlock size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(user.is_verified ? 'unverify' : 'verify', user.id)}
                          className={`p-2 rounded-lg transition ${user.is_verified ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'}`}
                          title={user.is_verified ? 'Unverify Account' : 'Verify Account'}
                        >
                          <BadgeCheck size={16} />
                        </button>
                        <button
                          onClick={() => handleAction(user.is_banned ? 'unban' : 'ban', user.id)}
                          className={`p-2 rounded-lg transition ${user.is_banned ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'}`}
                          title={user.is_banned ? 'Unban User' : 'Ban User'}
                        >
                          <Ban size={16} />
                        </button>
                        <button
                          onClick={() => handleAction(user.is_frozen ? 'unfreeze' : 'freeze', user.id)}
                          className={`p-2 rounded-lg transition ${user.is_frozen ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30'}`}
                          title={user.is_frozen ? 'Unfreeze User' : 'Freeze User'}
                        >
                          <Lock size={16} />
                        </button>
                        <button
                          onClick={() => handleAction('delete', user.id)}
                          className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                {actionType === 'ban' && 'Ban User'}
                {actionType === 'unban' && 'Unban User'}
                {actionType === 'freeze' && 'Freeze User'}
                {actionType === 'unfreeze' && 'Unfreeze User'}
                {actionType === 'verify' && 'Verify Account'}
                {actionType === 'unverify' && 'Unverify Account'}
                {actionType === 'unlock' && 'Unlock Account'}
                {actionType === 'delete' && 'Delete User'}
              </h3>
              <button
                onClick={() => setShowActionModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            {selectedUser && (
              <div className="mb-4 p-3 bg-white/5 rounded-lg">
                <div className="font-medium text-white">{selectedUser.full_name}</div>
                <div className="text-sm text-gray-400">{selectedUser.email}</div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason for {actionType}
              </label>
              <textarea
                value={actionReason}
                onChange={e => setActionReason(e.target.value)}
                placeholder="Enter reason for this action..."
                rows={4}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`flex-1 px-4 py-2 rounded-lg transition ${
                  actionType === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-4xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">User Details</h3>
              <button
                onClick={() => {
                  setShowUserDetails(false);
                  setUserDetails(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {loadingDetails ? (
              <div className="text-center py-12 text-gray-400">Loading user details...</div>
            ) : userDetails ? (
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-start gap-6 pb-6 border-b border-white/10">
                  <img
                    src={userDetails.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userDetails.full_name}`}
                    alt={userDetails.full_name}
                    className="w-24 h-24 rounded-full border-2 border-white/20"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-bold text-white">{userDetails.full_name}</h4>
                      {userDetails.is_verified && (
                        <BadgeCheck size={20} className="text-blue-400" title="Verified" />
                      )}
                      {userDetails.is_locked && (
                        <Lock size={20} className="text-purple-400" title="Account Locked" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        {userDetails.gender === 'male' ? 'Male' : 'Female'}
                      </div>
                      {userDetails.date_of_birth && (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(userDetails.date_of_birth).toLocaleDateString()}
                        </div>
                      )}
                      {userDetails.city && (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          {userDetails.city}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      {userDetails.is_banned && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">Banned</span>
                      )}
                      {userDetails.is_frozen && (
                        <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">Frozen</span>
                      )}
                      {userDetails.is_locked && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs flex items-center gap-1">
                          <Lock size={10} /> Locked
                        </span>
                      )}
                      {userDetails.is_verified && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center gap-1">
                          <BadgeCheck size={10} /> Verified
                        </span>
                      )}
                      {!userDetails.is_banned && !userDetails.is_frozen && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Active</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail size={18} className="text-rose-400" />
                      <h5 className="font-bold text-white">Email</h5>
                    </div>
                    <p className="text-gray-300 text-sm">{userDetails.email}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone size={18} className="text-rose-400" />
                      <h5 className="font-bold text-white">Phone</h5>
                    </div>
                    <p className="text-gray-300 text-sm">{userDetails.phone || 'Not set'}</p>
                  </div>
                </div>

                {/* Profile Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userDetails.religion && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <h5 className="font-bold text-white mb-2">Religion</h5>
                      <p className="text-gray-300 text-sm">{userDetails.religion}</p>
                    </div>
                  )}
                  {userDetails.denomination && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <h5 className="font-bold text-white mb-2">Denomination</h5>
                      <p className="text-gray-300 text-sm">{userDetails.denomination}</p>
                    </div>
                  )}
                  {userDetails.intent && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart size={18} className="text-rose-400" />
                        <h5 className="font-bold text-white">Intent</h5>
                      </div>
                      <p className="text-gray-300 text-sm">{userDetails.intent}</p>
                    </div>
                  )}
                  {userDetails.occupation && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase size={18} className="text-rose-400" />
                        <h5 className="font-bold text-white">Occupation</h5>
                      </div>
                      <p className="text-gray-300 text-sm">{userDetails.occupation}</p>
                    </div>
                  )}
                  {userDetails.height && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <h5 className="font-bold text-white mb-2">Height</h5>
                      <p className="text-gray-300 text-sm">{userDetails.height} cm</p>
                    </div>
                  )}
                  {userDetails.weight && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <h5 className="font-bold text-white mb-2">Weight</h5>
                      <p className="text-gray-300 text-sm">{userDetails.weight} kg</p>
                    </div>
                  )}
                </div>

                {/* Bio */}
                {userDetails.bio && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h5 className="font-bold text-white mb-2">Bio</h5>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{userDetails.bio}</p>
                  </div>
                )}

                {/* Hobbies */}
                {userDetails.hobbies && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h5 className="font-bold text-white mb-2">Hobbies</h5>
                    <div className="flex flex-wrap gap-2">
                      {userDetails.hobbies.split(',').map((hobby, idx) => (
                        <span key={idx} className="px-3 py-1 bg-rose-600/20 text-rose-300 rounded-full text-xs">
                          {hobby.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Images */}
                {(userDetails.avatar_url_2 || userDetails.avatar_url_3) && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h5 className="font-bold text-white mb-3">Additional Photos</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {userDetails.avatar_url_2 && (
                        <img
                          src={userDetails.avatar_url_2}
                          alt="Profile photo 2"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      )}
                      {userDetails.avatar_url_3 && (
                        <img
                          src={userDetails.avatar_url_3}
                          alt="Profile photo 3"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                    <MessageCircle size={24} className="text-rose-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{userDetails.stats?.matches || 0}</div>
                    <div className="text-xs text-gray-400">Matches</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                    <MessageCircle size={24} className="text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{userDetails.stats?.messages || 0}</div>
                    <div className="text-xs text-gray-400">Messages</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                    <AlertTriangle size={24} className="text-orange-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{userDetails.stats?.reports || 0}</div>
                    <div className="text-xs text-gray-400">Reports</div>
                  </div>
                </div>

                {/* Account Status & Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h5 className="font-bold text-white mb-2">Account Information</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">User ID:</span>
                        <span className="text-gray-300 font-mono text-xs">{userDetails.id}</span>
                      </div>
                      {userDetails.updated_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Updated:</span>
                          <span className="text-gray-300">{new Date(userDetails.updated_at).toLocaleString()}</span>
                        </div>
                      )}
                      {userDetails.banned_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Banned At:</span>
                          <span className="text-red-300">{new Date(userDetails.banned_at).toLocaleString()}</span>
                        </div>
                      )}
                      {userDetails.ban_reason && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Ban Reason:</span>
                          <span className="text-red-300">{userDetails.ban_reason}</span>
                        </div>
                      )}
                      {userDetails.frozen_until && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Frozen Until:</span>
                          <span className="text-orange-300">{new Date(userDetails.frozen_until).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h5 className="font-bold text-white mb-2">Settings</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Show in Discovery:</span>
                        <span className={userDetails.show_in_discovery ? 'text-green-400' : 'text-gray-400'}>
                          {userDetails.show_in_discovery ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Show Online Status:</span>
                        <span className={userDetails.show_online_status ? 'text-green-400' : 'text-gray-400'}>
                          {userDetails.show_online_status ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {userDetails.looking_for && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Looking For:</span>
                          <span className="text-gray-300 capitalize">{userDetails.looking_for}</span>
                        </div>
                      )}
                      {userDetails.boost_active && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Profile Boost:</span>
                          <span className="text-yellow-400">Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t border-white/10">
                  {userDetails.is_locked && (
                    <button
                      onClick={() => {
                        setShowUserDetails(false);
                        handleAction('unlock', userDetails.id);
                      }}
                      className="px-4 py-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded-lg transition border border-purple-600/30"
                    >
                      Unlock Account
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowUserDetails(false);
                      handleAction(userDetails.is_verified ? 'unverify' : 'verify', userDetails.id);
                    }}
                    className={`px-4 py-2 rounded-lg transition ${
                      userDetails.is_verified
                        ? 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 border border-gray-600/30'
                        : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/30'
                    }`}
                  >
                    {userDetails.is_verified ? 'Unverify' : 'Verify Account'}
                  </button>
                  <button
                    onClick={() => {
                      setShowUserDetails(false);
                      handleAction(userDetails.is_banned ? 'unban' : 'ban', userDetails.id);
                    }}
                    className={`px-4 py-2 rounded-lg transition ${
                      userDetails.is_banned
                        ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30'
                        : 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30'
                    }`}
                  >
                    {userDetails.is_banned ? 'Unban User' : 'Ban User'}
                  </button>
                  <button
                    onClick={() => {
                      setShowUserDetails(false);
                      handleAction(userDetails.is_frozen ? 'unfreeze' : 'freeze', userDetails.id);
                    }}
                    className={`px-4 py-2 rounded-lg transition ${
                      userDetails.is_frozen
                        ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30'
                        : 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 border border-orange-600/30'
                    }`}
                  >
                    {userDetails.is_frozen ? 'Unfreeze User' : 'Freeze User'}
                  </button>
                  <button
                    onClick={() => {
                      setShowUserDetails(false);
                      handleAction('delete', userDetails.id);
                    }}
                    className="px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition border border-red-600/30"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">No user details available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
