import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import { Heart, LogOut, ArrowLeft, Lock, Eye, EyeOff, X, Check, CheckCheck, AlertTriangle, Edit, MapPin, Save, MessageCircle, Flame, Users, ChevronLeft, ChevronRight, Camera, Settings, Mic, Activity, Plus, CheckCircle, User, Mail, Calendar, CornerUpLeft, Trash2, Copy, Flag, Share, Phone, Video, Image as ImageIcon, Clock, Shield, Zap, Star, HelpCircle, BadgeCheck } from 'lucide-react'
 

import logo from './assets/logo.png';
import StoryOverlay from './components/StoryOverlay';
import loginImg from './assets/loginimg.jpg'; 

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';



// --- IMPORT NEW COMPONENTS ---
import DashboardHeader from './components/DashboardHeader'
import DashboardFooter from './components/DashboardFooter'
import DiscoverCard from './components/DiscoverCard'
import WelcomePage from './components/WelcomePage'
import AuthScreen from './components/AuthScreen'
import ConfirmModal from './components/ConfirmModal'
import InputModal from './components/InputModal'
import CrushListItem from './components/CrushListItem'
import CrushesView from './components/CrushesView';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import CommunityGuidelines from './components/CommunityGuidelines';
import VerifyScreen from './components/VerifyScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import SetNewPasswordScreen from './components/SetNewPasswordScreen';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminUserManagement from './components/AdminUserManagement';
import AdminReportsManagement from './components/AdminReportsManagement';
import AdminPremiumRequests from './components/AdminPremiumRequests';
import AdminActivityLogs from './components/AdminActivityLogs';


function App() {
  // --- STATES ---
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('discovery')
  const [adminSession, setAdminSession] = useState(null)
  const [adminView, setAdminView] = useState('dashboard') // dashboard, users, reports, premium, logs 
  const [stats, setStats] = useState({ users: 0, matches: 0, messages: 0 })
  const [isSignupSuccess, setIsSignupSuccess] = useState(false)
  const [toast, setToast] = useState(null)
  const [crushTab, setCrushTab] = useState('incoming'); 

  // --- NEW: Auth Step State ---
  const [authStep, setAuthStep] = useState('welcome');
  const [authMode, setAuthMode] = useState('login');

  // --- FIX: Action Loading ID (Prevents Double Tap) ---
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Profile States
  const [fullName, setFullName] = useState('')
  const [gender, setGender] = useState('')
  const [city, setCity] = useState('')
  const [religion, setReligion] = useState('')
  const [denomination, setDenomination] = useState('')
  const [intent, setIntent] = useState('')
  const [bio, setBio] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [phone, setPhone] = useState('')
  const [profileViewImgIndex, setProfileViewImgIndex] = useState(0);

    // --- NEW: Undo Pass Timer ---
  const [showUndo, setShowUndo] = useState(false);
  const [lastPassedIndex, setLastPassedIndex] = useState(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState(null);
  const [lastPassedCandidate, setLastPassedCandidate] = useState(null);

  // For Confirmations (Unmatch, Block)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

  // ... Phone OTP States ...
  const [pendingPhone, setPendingPhone] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');

    //Verification Pending States
  const [pendingSignupEmail, setPendingSignupEmail] = useState('');
  
  // For Inputs (Report)
  const [inputModal, setInputModal] = useState({ isOpen: false, title: '', placeholder: '', onSubmit: null, showCategorySelect: false, categories: [] });

  // Add near other states
  const [showInDiscovery, setShowInDiscovery] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  // --- NEW: Hobbies & Occupation ---
  const [hobbies, setHobbies] = useState([]); 
  const [occupation, setOccupation] = useState('') // FIX: Fixed typo 'setOccupat[i]on'

  // Predefined list of nice hobbies
  const HOBBIES_LIST = [
    "✈️ Travel", "🍕 Foodie", "🎬 Movies", "📚 Reading", 
    "🎨 Art", "💪 Fitness", "🎮 Gaming", "🎵 Music", 
    "👩 Dancing", "📸 Photography", "🐶 Pets", "🌿 Nature"
  ];

  // Date format conversion helpers
  // Convert DD-MM-YYYY to YYYY-MM-DD for database storage
  const convertToDbFormat = (dateStr) => {
    if (!dateStr) return '';
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Convert DD-MM-YYYY to YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 2) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  // Convert YYYY-MM-DD to DD-MM-YYYY for display
  const convertToDisplayFormat = (dateStr) => {
    if (!dateStr) return '';
    // If already in DD-MM-YYYY format, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
    // Convert YYYY-MM-DD to DD-MM-YYYY
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  // Password States
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [lookingFor, setLookingFor] = useState(null) // 'men', 'women', 'both', or null

  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [resetEmail, setResetEmail] = useState('') 
  const [newResetPass, setNewResetPass] = useState('')
  const [confirmResetPass, setConfirmResetPass] = useState('')
  const [isSettingNewPassword, setIsSettingNewPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // Image Upload
  const [avatarFile, setAvatarFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [imgIndex, setImgIndex] = useState(0);

  // --- NEW: Extra Avatars ---
  const [avatarFile2, setAvatarFile2] = useState(null)
  const [avatarFile3, setAvatarFile3] = useState(null)
  const [previewUrl2, setPreviewUrl2] = useState(null)
  const [previewUrl3, setPreviewUrl3] = useState(null)

  // Discovery
  const [candidates, setCandidates] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [filterCity, setFilterCity] = useState('') 
  const [filterReligion, setFilterReligion] = useState('') 
  const [filterDistance, setFilterDistance] = useState('')
  const [userCoords, setUserCoords] = useState({ lat: null, long: null })
    // --- NEW: Age Filters ---
  const [filterMinAge, setFilterMinAge] = useState('');
  const [filterMaxAge, setFilterMaxAge] = useState('');

  // Matches & Chat
  const [myMatches, setMyMatches] = useState([])
  const [partnerProfiles, setPartnerProfiles] = useState([])
  const [activeChatProfile, setActiveChatProfile] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [inputText, setInputText] = useState("")
  const [partnerIsTyping, setPartnerIsTyping] = useState(false) 
  const [isPartnerOnline, setIsPartnerOnline] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState({})
  const [onlineUsers, setOnlineUsers] = useState([]) 
  
  // Blocked Users
  const [blockedUsers, setBlockedUsers] = useState([])

  // NEW FEATURES STATE
  const [lastSeen, setLastSeen] = useState({}) // { userId: timestamp }
  const [verifiedUsers, setVerifiedUsers] = useState([]) // Array of verified user IDs
  const [superLikes, setSuperLikes] = useState([]) // Array of super-liked user IDs
  const [profileBoost, setProfileBoost] = useState(false) // Boost status
  const [icebreakerPrompts, setIcebreakerPrompts] = useState([]) // Array of prompts
  const [reportCategories] = useState(['Inappropriate Content', 'Spam', 'Harassment', 'Fake Profile', 'Other'])
  const [selectedReportCategory, setSelectedReportCategory] = useState('')

  const [selectedMessageId, setSelectedMessageId] = useState(null); 
  const [replyingTo, setReplyingTo] = useState(null); 
  
  // NEW: Target Profile State (for viewing other users)
  const [targetProfile, setTargetProfile] = useState(null);
  const [isTargetProfileMatched, setIsTargetProfileMatched] = useState(false);
  
  // NEW: Crushes/Likes Data
  const [myCrushes, setMyCrushes] = useState([]); 
  const [incomingCrushes, setIncomingCrushes] = useState([]); 

  // Visitors State
  const [visitors, setVisitors] = useState([]);

  //Theme State - Default to dark mode
  const [theme, setTheme] = useState('dark');

    // Voice State
  const [isListening, setIsListening] = useState(false);

  //Stories States
  const [stories, setStories] = useState([]);
  const [targetHasStory, setTargetHasStory] = useState(false);
  const [viewingStory, setViewingStory] = useState(null);

    // --- NEW: Audio Recorder State ---
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  //Global Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);


  // Refs
  const typingTimeout = useRef(null)
  const partnerTypingTimeout = useRef(null)
  const messagesEndRef = useRef(null)
  const chatInputRef = useRef(null)
  const lastOpenedChatId = useRef(null)
  const realtimeChannel = useRef(null)
  const messageChannelRef = useRef(null)

  // --- WALLPAPER STYLE ---
  const loginWallpaperStyle = {
    backgroundColor: '#fff1f2',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 20c-8 0-15 10-15 20s10 20 15 20 15-10 15-20-7-20-15-20z' fill='%23fb7185' fill-opacity='0.08'/%3E%3C/svg%3E")`,
  }

  // --- EFFECTS & LOGIC ---  
  useEffect(() => {
    // Auth Initialization
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      setView('reset-password');
      setIsSettingNewPassword(true); // User clicked reset link, needs to set new password
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        resetFormState(); // Clear old data before fetching new
        fetchProfile(session.user.id);
        fetchStats();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        setView('reset-password');
        setIsSettingNewPassword(true); // User clicked reset link
      }
      else {
        setSession(session);
        if (session) {
          resetFormState(); // Clear old data immediately on login
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [])

  // --- HELPER FUNCTION: Clear Input States ---
  const resetFormState = () => {
    setFullName('');
    setGender('');
    setCity('');
    setReligion('');
    setDenomination('');
    setIntent('');
    setBio('');
    setDateOfBirth('');
    setHeight('');
    setWeight('');
    setOccupation('');
    setHobbies([]);
    setAvatarFile(null);
    setPreviewUrl(null);
    setAvatarFile2(null);
    setPreviewUrl2(null);
    setAvatarFile3(null);
    setPreviewUrl3(null);
  };

  // Load Filters
  useEffect(() => {
    const savedCity = localStorage.getItem('sacred_city_filter');
    const savedReligion = localStorage.getItem('sacred_religion_filter');
    const savedDistance = localStorage.getItem('sacred_distance_filter');
    const savedMinAge = localStorage.getItem('sacred_min_age_filter');
    const savedMaxAge = localStorage.getItem('sacred_max_age_filter');
    
    if (savedCity) setFilterCity(savedCity)
    if (savedReligion) setFilterReligion(savedReligion)
    if (savedDistance) setFilterDistance(savedDistance)
    if (savedMinAge) setFilterMinAge(savedMinAge)
    if (savedMaxAge) setFilterMaxAge(savedMaxAge)
  }, [])

  // Global Presence & Last Seen Tracking
  useEffect(() => {
    if (!session) return
    
    // Update last seen on activity
    const updateLastSeen = async () => {
      try {
        await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', session.user.id);
      } catch (err) {
        console.error("Error updating last seen:", err);
      }
    };
    
    // Update on mount and every 30 seconds
    updateLastSeen();
    const lastSeenInterval = setInterval(updateLastSeen, 30000);
    
    const channel = supabase.channel('app-presence')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const userIds = new Set()
        Object.values(state).forEach(presences => {
          if (Array.isArray(presences)) presences.forEach(p => { if (p.user_id) userIds.add(p.user_id) })
        })
        setOnlineUsers(Array.from(userIds))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ user_id: session.user.id, online_at: new Date().toISOString() })
      })
    
    return () => { 
      clearInterval(lastSeenInterval);
      if (channel) supabase.removeChannel(channel) 
    }
  }, [session])
  
  // Fetch last seen for matched users
  useEffect(() => {
    if (!session || partnerProfiles.length === 0) return;
    
    const fetchLastSeen = async () => {
      const profileIds = partnerProfiles.map(p => p.id);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, last_seen_at')
          .in('id', profileIds);
        
        if (data) {
          const lastSeenMap = {};
          data.forEach(p => {
            if (p.last_seen_at) lastSeenMap[p.id] = p.last_seen_at;
          });
          setLastSeen(lastSeenMap);
        }
      } catch (err) {
        console.error("Error fetching last seen:", err);
      }
    };
    
    fetchLastSeen();
    const interval = setInterval(fetchLastSeen, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [session, partnerProfiles])


  // --- FETCH STORIES FOR TARGET PROFILE ---
  useEffect(() => {
    if (targetProfile) {
      // We need to fetch ALL stories to check if this specific user has one
      const fetchActiveStories = async () => {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .gt('expires_at', new Date().toISOString()) // Only active stories
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching target stories:", error);
        } else {
          // Logic: Does this user have an active story?
          const hasActiveStory = data && data.some(s => s.user_id === targetProfile.id);
          setTargetHasStory(!!hasActiveStory);
        }
      };

      fetchActiveStories();
    }
  }, [targetProfile]);

  // --- CHECK IF TARGET PROFILE IS ALREADY MATCHED ---
  useEffect(() => {
    const checkMatchStatus = async () => {
      if (!targetProfile || !session) {
        setIsTargetProfileMatched(false);
        return;
      }

      try {
        const { data: matches, error } = await supabase
          .from('matches')
          .select('*')
          .or(`user_a_id.eq.${session.user.id},user_b_id.eq.${session.user.id}`)
          .eq('status', 'mutual');

        if (error) {
          console.error("Error checking match status:", error);
          setIsTargetProfileMatched(false);
          return;
        }

        const isMatched = matches?.some(match => {
          return (match.user_a_id === session.user.id && match.user_b_id === targetProfile.id) ||
                 (match.user_b_id === session.user.id && match.user_a_id === targetProfile.id);
        });

        setIsTargetProfileMatched(!!isMatched);
      } catch (err) {
        console.error("Error in checkMatchStatus:", err);
        setIsTargetProfileMatched(false);
      }
    };

    checkMatchStatus();
  }, [targetProfile, session]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };


  // Fetch Preferences on load
  useEffect(() => {
    if (profile) {
      setShowInDiscovery(profile.show_in_discovery ?? true);
      setShowOnlineStatus(profile.show_online_status ?? true);
    }
  }, [profile]);


  // --- UPDATED: Global Message Listener (Read/Unread Status) ---
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('global-messages-changes', { config: { broadcast: { self: false } } })
      .on('postgres_changes', { 
        event: 'INSERT', schema: 'public', table: 'messages'
      }, (payload) => {
        // Handle New Message (Red Dot)
        if (payload.new.sender_id !== session.user.id) {
           const match = myMatches.find(m => m.id === payload.new.match_id);
           if (match) {
              const partnerId = match.user_a_id === session.user.id ? match.user_b_id : match.user_a_id;
              setUnreadCounts(prev => ({ 
                 ...prev, 
                 [partnerId]: (prev[partnerId] || 0) + 1 
               }));
              showToast("💌 New message!", 'success');
           }
        }
      })
      .on('postgres_changes', { // NEW: Handle Read Status (Remove Red Dot)
        event: 'UPDATE', schema: 'public', table: 'messages'
      }, (payload) => {
        if (payload.new.recipient_id === session.user.id) { // If I am receiver
             // Find match to see if this message was addressed to me
             const match = myMatches.find(m => m.id === payload.new.match_id);
             if (match) {
                  const partnerId = match.user_a_id === session.user.id ? match.user_b_id : match.user_a_id;
                  const partnerIdCheck = match.user_a_id === session.user.id ? match.user_b_id : match.user_a_id;
                  if (partnerIdCheck === session.user.id) { return; } // Don't clear count for own messages

                  // If message is now read, remove unread count
                  if (payload.new.read_at) {
                      setUnreadCounts(prev => ({ 
                         ...prev, 
                         [partnerId]: prev[partnerId] - 1 
                       }));
                  }
             }
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [session, myMatches])



  // --- THEME EFFECT: Light mode for auth, dark mode for app ---
  useEffect(() => {
    const updateTheme = () => {
      // Check if we're on the admin route
      const isAdminRoute = window.location.pathname === '/admin';
      const isAdminLoginPage = isAdminRoute && !adminSession;
      
      // Run immediately, don't wait for requestAnimationFrame
      if (!session || isAdminLoginPage) {
        // LOGGED OUT or ADMIN LOGIN: Light mode for login/auth pages (transparent so background images show)
        document.documentElement.classList.remove('dark');
        document.body.style.setProperty('background-color', 'transparent', 'important');
        document.body.style.setProperty('background-image', 'none', 'important');
        document.documentElement.style.setProperty('background-color', 'transparent', 'important');
        setTheme('light');
      } else if (isAdminRoute && adminSession) {
        // ADMIN LOGGED IN: Dark mode for admin panel
        document.documentElement.classList.add('dark');
        document.body.style.setProperty('background-color', '#111827', 'important');
        document.body.style.removeProperty('background-image');
        document.documentElement.style.setProperty('background-color', '#111827', 'important');
        setTheme('dark');
      } else {
        // LOGGED IN: Dark mode for app
        document.documentElement.classList.add('dark');
        document.body.style.setProperty('background-color', '#111827', 'important');
        document.body.style.removeProperty('background-image');
        document.documentElement.style.setProperty('background-color', '#111827', 'important');
        setTheme('dark');
        localStorage.setItem('sacred_theme', 'dark');
      }
    };
    
    updateTheme();
    
    // Listen for navigation events (React Router uses history API)
    const handlePopState = () => {
      setTimeout(updateTheme, 0);
    };
    
    window.addEventListener('popstate', handlePopState);
    
    // Check on a small interval to catch programmatic navigation (React Router)
    const intervalId = setInterval(updateTheme, 200);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(intervalId);
    };
  }, [session, adminSession]);

  // --- INITIAL THEME SETUP: Run on mount to prevent flash ---
  useEffect(() => {
    // Check if we're on the admin route
    const isAdminRoute = window.location.pathname === '/admin';
    
    // Set initial theme immediately on mount (before session loads)
    // This prevents the dark mode flash on refresh
    // Always start with transparent for auth/admin pages
    if (!session || isAdminRoute) {
      document.documentElement.classList.remove('dark');
      document.body.style.setProperty('background-color', 'transparent', 'important');
      document.body.style.setProperty('background-image', 'none', 'important');
      document.documentElement.style.setProperty('background-color', 'transparent', 'important');
    }
  }, []); // Run only once on mount


  const closeStory = () => {
    setViewingStory(null);
    setView('stories');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('sacred_theme', newTheme);
  };

  // --- Fetch Matches or Crushes when tabs are clicked ---
  useEffect(() => {
    if (view === 'matches' || view === 'interests') { 
        fetchMyMatches()
    }
    if (view === 'crushes') {
        fetchCrushes();
    }
    // --- FETCH VISITORS ---
    if (view === 'visitors') {
        fetchVisitors();
    }
    // ---Fetch Stories
    if (view === 'stories') {
        fetchStories();
    }

    // --- Request Location Permission for New Users in Setup ---
    if (view === 'setup' && session && !profile?.lat && !profile?.long && !userCoords.lat) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        // Only prompt once per session
        const hasPrompted = sessionStorage.getItem('locationPrompted');
        if (!hasPrompted) {
          sessionStorage.setItem('locationPrompted', 'true');
          // Auto-request location after a short delay
          setTimeout(() => {
            requestLocationPermission();
          }, 1000);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [view, session, profile, userCoords])    

  // --- DATA FETCHING FUNCTIONS ---
  async function uploadAvatar(file) {
    try {
      setUploading(true)      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      return publicUrl
    } catch (error) {
      showToast('Error uploading image: ' + error.message)
      return null
    } finally {
      setUploading(false)
    }
  }


  const handleStoryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {

      
      // --- NEW: CHECK DURATION BEFORE UPLOAD ---
      const isDurationValid = await validateStoryDuration(file);
      if (!isDurationValid) {
        setUploading(false);
        showToast("Video must be 15 seconds or less.", 'error');
        return; // Stop here!
      }
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      // Upload to 'avatars' bucket for simplicity (or create 'stories' bucket)
      const filePath = `${session.user.id}/stories/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Insert into DB (Expires in 24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await supabase.from('stories').insert({
        user_id: session.user.id,
        media_url: publicUrl,
        expires_at: expiresAt.toISOString()
      });

      showToast("Story uploaded!", 'success');
      setView('stories'); // Refresh view
    } catch (error) {
      console.error("Story error:", error);
      showToast("Failed to upload story.", 'error');
    } finally {
      setUploading(false);
    }
  };


  async function fetchProfile(userId) {
    try {
      const { data: myProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        // IF PROFILE MISSING (New User), DO NOT SIGN OUT.
        // Instead, check if we have the data in Auth Metadata (from signup)
        if (profileError.code === 'PGRST116') {
             console.log("New user detected. Reading from metadata...");
             
             // 1. Get metadata from current session
             const userMetadata = session?.user?.user_metadata;

             // 2. Pre-fill our React State with that metadata
             if (userMetadata?.full_name) setFullName(userMetadata.full_name);
             if (userMetadata?.gender) setGender(userMetadata.gender);
             // Convert YYYY-MM-DD from metadata to DD-MM-YYYY for display
             if (userMetadata?.date_of_birth) setDateOfBirth(convertToDisplayFormat(userMetadata.date_of_birth));
             if (userMetadata?.city) setCity(userMetadata.city);

             // 3. Send them to Setup view
             setView('setup'); 
             setLoading(false);
             return;
        } else {
            throw profileError
        }
      }

      const age = myProfile.date_of_birth ? calculateAge(myProfile.date_of_birth) : 0
      if (age > 0 && age < 18) {
          showToast("Access Denied: You must be at least 18 years old.")
          await supabase.auth.signOut()
          setLoading(false)
          return
      }

      // --- Ask for Push Permission ---
      requestNotificationPermission(); 

      setProfile(myProfile)
      
      // Load phone number
      if (myProfile.phone) setPhone(myProfile.phone);
      else if (session?.user?.phone) setPhone(session.user.phone);
      
      // Convert date_of_birth from YYYY-MM-DD to DD-MM-YYYY for display
      if (myProfile.date_of_birth) {
        setDateOfBirth(convertToDisplayFormat(myProfile.date_of_birth));
      }
      
      // Load icebreaker prompts from database
      if (myProfile.icebreaker_prompts) {
        try {
          const prompts = typeof myProfile.icebreaker_prompts === 'string' 
            ? JSON.parse(myProfile.icebreaker_prompts || '[]')
            : (Array.isArray(myProfile.icebreaker_prompts) ? myProfile.icebreaker_prompts : []);
          setIcebreakerPrompts(prompts);
        } catch (err) {
          setIcebreakerPrompts([]);
        }
      } else {
        setIcebreakerPrompts([]);
      }
      
      // Load boost status
      const isBoostActive = myProfile.boost_active === true && 
        (!myProfile.boost_expires_at || new Date(myProfile.boost_expires_at) > new Date());
      setProfileBoost(isBoostActive);
      
      // Load preferences
      if (myProfile.show_in_discovery !== undefined) setShowInDiscovery(myProfile.show_in_discovery);
      if (myProfile.show_online_status !== undefined) setShowOnlineStatus(myProfile.show_online_status);
      
      // Fetch verified users
      const { data: verified } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_verified', true);
      if (verified) setVerifiedUsers(verified.map(p => p.id));
      
      // Fetch super likes
      const { data: superLikesData } = await supabase
        .from('super_likes')
        .select('liked_id')
        .eq('liker_id', userId);
      if (superLikesData) setSuperLikes(superLikesData.map(s => s.liked_id));
      
      // Prefill form states
      if(myProfile?.full_name) setFullName(myProfile.full_name)
      if(myProfile?.gender) setGender(myProfile.gender)
      if(myProfile?.city) setCity(myProfile.city)
      if(myProfile?.religion) setReligion(myProfile.religion)
      if(myProfile?.denomination) setDenomination(myProfile.denomination)
      if(myProfile?.intent) setIntent(myProfile.intent)
      if(myProfile?.bio) setBio(myProfile.bio)
      if(myProfile?.date_of_birth) setDateOfBirth(myProfile.date_of_birth)
      if(myProfile?.height) setHeight(myProfile.height)
      if(myProfile?.weight) setWeight(myProfile.weight)
      if(myProfile?.hobbies) {
         setHobbies(myProfile.hobbies.split(',').filter(Boolean));
      }
      if(myProfile?.occupation) setOccupation(myProfile.occupation)
      // Set looking_for - can be null, 'men', 'women', or 'both'
      setLookingFor(myProfile?.looking_for || null)

      // --- NEW: Prefill extra avatars ---
      if(myProfile?.avatar_url_2) setPreviewUrl2(myProfile.avatar_url_2)
      if(myProfile?.avatar_url_3) setPreviewUrl3(myProfile.avatar_url_3)        

      if (!myProfile.gender || !myProfile.intent) {
          setView('setup')
      } else {
          await fetchCandidates(userId, myProfile.gender, myProfile)
      }
    } catch (error) {
      console.error('Error:', error.message)
    } finally {
      setLoading(false)
    }
  }


  const fetchStories = async () => {
    if (!session) return;
    try {
      // 1. Get all my matches (mutual connections only)
      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('user_a_id, user_b_id')
        .or(`user_a_id.eq.${session.user.id},user_b_id.eq.${session.user.id}`)
        .eq('status', 'mutual'); // Only mutual matches can see stories
      
      if (matchError) throw matchError;
      
      // 2. Extract partner IDs (people I'm connected with)
      const partnerIds = matches?.map(m => 
        m.user_a_id === session.user.id ? m.user_b_id : m.user_a_id
      ) || [];
      
      // 3. Fetch stories from matched users AND own stories
      const userIdsToFetch = partnerIds.length > 0 ? [...partnerIds, session.user.id] : [session.user.id];
      
      // 4. Fetch stories from matched users + own stories
      const { data, error } = await supabase
        .from('stories')
        .select('*, profiles(full_name, avatar_url)')
        .in('user_id', userIdsToFetch) // Stories from matched users + own stories
        .gt('expires_at', new Date().toISOString()) // Only active stories
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error("Error fetching stories:", error);
      setStories([]);
    }
  };


  const fetchStats = async () => {
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: matchCount } = await supabase.from('matches').select('*', { count: 'exact', head: true })
    const { count: msgCount } = await supabase.from('messages').select('*', { count: 'exact', head: true })
    setStats({ users: userCount || 0, matches: matchCount || 0, messages: msgCount || 0 })
  }


  // --- NEW: VALIDATE VIDEO DURATION ---
  const validateStoryDuration = (file) => {
    return new Promise((resolve) => {
      // If it's an image, it's always valid
      if (file.type.startsWith('image')) {
        resolve(true);
        return;
      }

      // If it's a video, we need to load it to check length
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);

      video.onloadedmetadata = function() {
        URL.revokeObjectURL(video.src); // Clean up memory
        const duration = video.duration;
        
        // Check if longer than 15 seconds
        if (duration > 15) {
          resolve(false);
        } else {
          resolve(true);
        }
      };

      video.onerror = () => {
        // If video is corrupt, allow upload (Supabase will catch format errors later)
        resolve(false); 
      };
    });
  };

  // --- NEW LOGIC: Fetch Candidates using 'discovery_exclusions' table ---
  async function fetchCandidates(myId, myGender, myCurrentProfile) {
    if (!myCurrentProfile) return;

    // --- LOOKING FOR FILTERING: Use looking_for preference if set, otherwise use intent logic ---
    const lookingForPreference = myCurrentProfile?.looking_for;
    let targetGender = null;
    let isNewFriends = false; // Initialize to avoid undefined error
    
    if (lookingForPreference === 'men') {
      targetGender = 'male';
    } else if (lookingForPreference === 'women') {
      targetGender = 'female';
    } else if (lookingForPreference === 'both') {
      targetGender = null; // Show all genders
    } else {
      // Fallback to intent-based logic if looking_for is not set
      const userIntent = myCurrentProfile?.intent;
      isNewFriends = userIntent === 'New friends' || userIntent === 'new friends';
      targetGender = isNewFriends ? null : (myGender === 'male' ? 'female' : 'male');
    }

 
    // 1. Fetch Excluded IDs from blocks/discovery
    const { data: exclusions } = await supabase
      .from('discovery_exclusions')
      .select('excluded_user_id')
      .eq('user_id', myId)
    
    const excludedIds = exclusions ? exclusions.map(e => e.excluded_user_id) : [];
    
    // We REMOVED ...likedIds so liked people stay in Discovery
    const allExcluded = [...new Set(excludedIds)];

    // 2. Setup Query
    const hasLocation = myCurrentProfile?.lat && myCurrentProfile?.long;

    let query = supabase
      .from('profiles')
      .select('*')
      .neq('id', myId)

    // Only filter by gender if NOT "New friends"
    if (!isNewFriends && targetGender) {
      query = query.eq('gender', targetGender);
    }

  // UPDATE THE .not() LINE: Use proper Supabase syntax
    if (allExcluded.length > 0) {
      // Exclude all matched/blocked users from discovery
      query = query.not('id', 'in', `(${allExcluded.map(id => `'${id}'`).join(',')})`);
    }
  
    if (filterCity) {
        query = query.eq('city', filterCity)
    } else if (filterDistance) {
        // Distance filtering handled in JS
    } else if (!hasLocation) {
        query = query.eq('city', myCurrentProfile?.city)
    }

    if (filterReligion) query = query.eq('religion', filterReligion)

    if (hasLocation) {
        const { data: profiles, error } = await query.order('updated_at', { ascending: false })
        if (error) console.error('Error fetching candidates:', error)
        else {
            const candidatesWithDistance = profiles
              .map(p => {
                // Calculate Age from Date of Birth
                const age = p.date_of_birth ? calculateAge(p.date_of_birth) : 0;
                
                // --- FILTER: Age Range ---
                if (filterMinAge && age < filterMinAge) return null; 
                if (filterMaxAge && age > filterMaxAge) return null; 

                // Only calculate distance if both current user and candidate have lat/long
                let distance = null;
                if (p.lat && p.long && myCurrentProfile.lat && myCurrentProfile.long) {
                  distance = calculateDistance(myCurrentProfile.lat, myCurrentProfile.long, p.lat, p.long);
                }

                return { ...p, distance: distance, age } 
              })
              .filter(Boolean) 
              .sort((a, b) => {
                // Sort by distance if both have distance, otherwise sort by updated_at
                if (a.distance !== null && b.distance !== null) {
                  return a.distance - b.distance;
                } else if (a.distance !== null) {
                  return -1; // a has distance, b doesn't - put a first
                } else if (b.distance !== null) {
                  return 1; // b has distance, a doesn't - put b first
                } else {
                  // Neither has distance, sort by updated_at (newest first)
                  return new Date(b.updated_at) - new Date(a.updated_at);
                }
              })

            let finalCandidates = candidatesWithDistance
            if (filterDistance) {
                finalCandidates = candidatesWithDistance.filter(p => 
                  p.distance !== null && p.distance <= parseInt(filterDistance)
                )
            }
            setCandidates(finalCandidates || [])
            setCurrentIndex(0)
        }
    } else {
        const { data, error } = await query.order('updated_at', { ascending: false })
        if (error) console.error('Error fetching candidates:', error)
        else { setCandidates(data || []); setCurrentIndex(0) }
    }
  }

  // --- FEATURE B: Calculate Profile Score ---
  const calculateProfileCompleteness = (profile) => {
    if (!profile) return 0;
    
    const fields = [
      profile.avatar_url,
      profile.full_name,
      profile.gender,
      profile.date_of_birth,
      profile.city,
      profile.religion,
      profile.intent,
      profile.bio,
      profile.height,
      profile.weight,
      profile.occupation,
      profile.hobbies
    ];

    // Count how many fields are not null/empty
    const filledFields = fields.filter(Boolean).length;
    
    // Calculate percentage (out of 12 fields)
    return Math.round((filledFields / 12) * 100);
  };


  //Global Search Function
  const handleGlobalSearch = async (query) => {
    if (!query || query.length < 2) {
        setSearchResults([]);
        return;
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .or(`full_name.ilike.%${query}%,city.ilike.%${query}%`) // Search Name OR City
            .neq('id', session.user.id) // Don't show me
            .limit(10);

        if (error) throw error;
        setSearchResults(data || []);
    } catch (error) {
        console.error("Search error:", error);
    }
  };


  const updatePreferences = async () => {
    if (!session) return;
    try {
      // Prepare update data - only include fields that have values
      const updateData = {
          show_in_discovery: showInDiscovery,
        show_online_status: showOnlineStatus,
        icebreaker_prompts: JSON.stringify(icebreakerPrompts)
      };
      
      // Only add looking_for if it's not null/undefined
      if (lookingFor !== null && lookingFor !== undefined) {
        updateData.looking_for = lookingFor;
      } else {
        // Explicitly set to null if user wants to clear it
        updateData.looking_for = null;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', session.user.id)
        .select(); // Select to verify update
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      showToast("Preferences updated!", 'success');
      
      // Refresh local profile state and refetch candidates with new filter
      fetchProfile(session.user.id);
      if (profile) await fetchCandidates(session.user.id, profile.gender, profile);
    } catch (error) {
      console.error("Error updating preferences:", error);
      // Show more detailed error message
      const errorMessage = error?.message || "Could not update settings.";
      showToast(`Error: ${errorMessage}`, 'error');
    }
  };

  // --- FEATURE C: Request Notification Permission ---
  const requestNotificationPermission = async () => {
    if (!session) return; // FIX: Safety check to prevent crash
    
    if (!('Notification' in window)) return;
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // SIMULATION: Saving a dummy token for demonstration
      const dummyToken = `web_token_${Date.now()}`;
      
      await supabase.from('push_tokens').insert({
        user_id: session.user.id,
        token: dummyToken,
        platform: 'web'
      }, { onConflict: 'ignore' });
    }
  };

  // --- FEATURE A: Fetch Visitors (FIXED VERSION) ---
  const fetchVisitors = async () => {
    if (!session) return;
    try {
      console.log("🔍 Fetching visitors for user ID:", session.user.id);

      // 1. First: Just get the list of visits (IDs only)
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select('viewer_id, created_at')
        .eq('viewed_id', session.user.id) // Show ME the people who viewed ME
        .order('created_at', { ascending: false })
        .limit(20);

      if (visitsError) throw visitsError;

      // If no visits, stop here
      if (!visitsData || visitsData.length === 0) {
        console.log("📦 No visitors found.");
        setVisitors([]);
        return;
      }

      // 2. Second: Get the profiles for all those IDs at once
      const viewerIds = visitsData.map(v => v.viewer_id);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, city')
        .in('id', viewerIds); // Fetch all profiles in one go

      if (profilesError) throw profilesError;

      // 3. Combine them manually
      const finalVisitors = visitsData.map(visit => {
        const profile = profilesData.find(p => p.id === visit.viewer_id);
        return {
          ...visit,
          viewer: profile // Attach profile details to the visit object
        };
      });

      console.log("📦 Visitors Data Found:", finalVisitors);
      setVisitors(finalVisitors);
      
    } catch (error) {
      console.error("❌ Error fetching visitors:", error);
    }
  };


  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = deg2rad(lat2-lat1);  
    const dLon = deg2rad(lon2-lon1); 
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  }
  function deg2rad(deg) { return deg * (Math.PI/180) }

  const fetchMyMatches = async () => {
    if (!session) return
    try {
    const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('*') 
        .or(`user_a_id.eq.${session.user.id},user_b_id.eq.${session.user.id}`)
        .or('status.in.(mutual,pending)')

        if (matchError) {
            console.error("Error fetching matches:", matchError)
            setMyMatches([]); setPartnerProfiles([]); setUnreadCounts({})
            return
        }
        if (!matches || matches.length === 0) {
            setMyMatches(matches); setPartnerProfiles([]); setUnreadCounts({})
            return
        }
        
        const partnerIds = matches.map((m) => m.user_a_id === session.user.id ? m.user_b_id : m.user_a_id)
        const uniquePartnerIds = [...new Set(partnerIds)]

        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', uniquePartnerIds)

        if (profileError) { console.error("Error fetching profiles:", profileError); return }
        if (profiles) { setMyMatches(matches); setPartnerProfiles(profiles) }

        // Unread Counts
        const counts = {}
        if (matches && matches.length > 0) {
            const countPromises = matches.map(async (match) => {
                const partnerId = match.user_a_id === session.user.id ? match.user_b_id : match.user_a_id
                const { count } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('match_id', match.id)
                    .neq('sender_id', session.user.id)
                    .is('read_at', null)
                return { partnerId, count }
            })
            const results = await Promise.all(countPromises)
            results.forEach(({ partnerId, count }) => { if (count > 0) counts[partnerId] = count })
        }
        setUnreadCounts(counts)
    } catch (error) {
        console.error("Critical error in fetchMyMatches:", error)
        setMyMatches([]); setPartnerProfiles([]); setUnreadCounts({})
    }
  }


  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type })
    setTimeout(() => setToast(null), 3000) // Hide after 3 seconds
  }


  // --- NEW: View Profile Handler (Supports Stories) ---
  const handleViewProfile = async (candidate, associatedStory = null) => {
    // If clicking a story, go straight to story overlay (no profile flicker)
    if (associatedStory) {
      // Set target profile for story context
      setTargetProfile(candidate);
      // Open story overlay directly
      setViewingStory(associatedStory);
      // Record visit silently
      if (session) {
        try {
          await supabase.from('visits').insert({
            viewer_id: session.user.id,
            viewed_id: candidate.id
          }, { onConflict: 'ignore' }); 
        } catch (err) {
          console.log("Visit tracking silent fail");
        }
      }
      return; // Don't proceed to profile view
    }
    
    // Otherwise, show profile view normally
    setTargetProfile(candidate);
    setProfileViewImgIndex(0);
    setView('profile-view');

    // Record Visit (If I am logged in)
    if (session) {
      try {
        await supabase.from('visits').insert({
          viewer_id: session.user.id,
          viewed_id: candidate.id
        }, { onConflict: 'ignore' }); 
      } catch (err) {
        console.log("Visit tracking silent fail");
      }
    }
  };

  // --- UPDATED: Handle Like / Unlike (Toggle) ---
  // --- NEW: Super Like Handler ---
  const handleSuperLike = async (targetId) => {
    if (actionLoadingId) return;
    setActionLoadingId(targetId);
    
    const isCurrentlySuperLiked = superLikes.includes(targetId);
    
    try {
      if (isCurrentlySuperLiked) {
        // Remove super like
        setSuperLikes(prev => prev.filter(id => id !== targetId));
        await supabase.from('super_likes').delete().match({
          liker_id: session.user.id,
          liked_id: targetId
        });
        showToast("Super like removed.", 'success');
      } else {
        // Add super like
        setSuperLikes(prev => [...prev, targetId]);
        await supabase.from('super_likes').insert({
          liker_id: session.user.id,
          liked_id: targetId
        });
        showToast("⭐ Super Liked! They'll see a special notification.", 'success');
      }
    } catch (err) {
      console.error("Super like error:", err);
      showToast("Error processing super like.", 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLike = async (targetId) => {
    if (actionLoadingId) return; // Prevent double tap
    setActionLoadingId(targetId);

    // 1. Check current status: Are they already in my Crushes list?
    const existingLike = myCrushes.find(c => c.liked_id === targetId);
    const isCurrentlyLiked = !!existingLike;

    try {
      if (isCurrentlyLiked) {
        // --- UNLIKE LOGIC ---
        
        // 1. Optimistic: Remove from UI immediately
        setMyCrushes(prev => prev.filter(c => c.liked_id !== targetId));

        // 2. Database: Delete like row
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({
            liker_id: session.user.id,
            liked_id: targetId
          });

        if (error) {
          console.error("Error unliking:", error);
          showToast("Could not remove like.");
        }

      } else {
        // --- LIKE LOGIC ---

        // 1. Optimistic: Add to UI immediately
        setMyCrushes(prev => [...prev, { id: Date.now(), liked_id: targetId, created_at: new Date().toISOString() }]);

        // 2. Database: Insert like row
        const { error } = await supabase.from('likes').insert({
          liker_id: session.user.id,
          liked_id: targetId
        });

        if (error) {
          // If it's a unique violation (already liked), ignore it silently
          if (error.code !== '23505') {
            console.error("Error liking:", error);
            showToast("Could not save like.");
            // Rollback optimistic update
            setMyCrushes(prev => prev.filter(c => c.liked_id !== targetId));
          }
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating like");
    } finally {
      setActionLoadingId(null);
    }
  };

  // --- NEW: Fetch Crushes (Bulk Fetch for Performance) ---
  const fetchCrushes = async () => {
    if (!session) return;
    
    try {
      // 1. Fetch "Your Crushes" (Likes I sent)
      const { data: sentLikes, error: sentError } = await supabase
        .from('likes')
        .select('liked_id, created_at')
        .eq('liker_id', session.user.id);

      if (sentError) console.error("Error fetching sent likes:", sentError);
      
      // 2. Fetch "People Crushing On You" (Likes I received)
      const { data: receivedLikes, error: receivedError } = await supabase
        .from('likes')
        .select('liker_id, created_at')
        .eq('liked_id', session.user.id);

      if (receivedError) console.error("Error fetching received likes:", receivedError);

      // 3. OPTIMIZATION: Fetch all profiles in one go!
      const crushIds = [
        ...(sentLikes || []).map(l => l.liked_id),
        ...(receivedLikes || []).map(l => l.liker_id)
      ];
      
      if (crushIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', crushIds);

        if (profilesError) throw profilesError;
        
        // 4. Map IDs back to the correct structure for State
        const updatedSentLikes = (sentLikes || []).map(like => {
            const userProfile = profiles.find(p => p.id === like.liked_id);
            return userProfile ? { ...like, profile: userProfile } : like;
        });

        const updatedReceivedLikes = (receivedLikes || []).map(like => {
            const userProfile = profiles.find(p => p.id === like.liker_id);
            return userProfile ? { ...like, profile: userProfile } : like;
        });

        setMyCrushes(updatedSentLikes || []);
        setIncomingCrushes(updatedReceivedLikes || []);
      }
    } catch (error) {
      console.error("Critical error in fetchCrushes:", error);
    }
  };

  // --- FIX: Handle Avatar File Change ---
  const handleFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };


  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (!oldPassword) { showToast("Please enter your current password.", 'error'); return }
    if (newPassword.length < 6) { showToast("New password must be at least 6 characters long.", 'error'); return }
    if (newPassword !== confirmPassword) { showToast("New passwords do not match.", 'error'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      showToast("Password updated successfully!", 'success')
      setView('profile')
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (error) {
      showToast("Error updating password: " + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // --- HANDLERS ---

  // NOTE: This function now handles Login, Email Signup, AND Phone Signup
  const handleAuth = async (formData) => {
    setLoading(true);
    
    // --- 1. LOGIN LOGIC ---
    if (formData.type === 'login') {
      try {
        const { emailOrPhone, password, rememberMe } = formData;
        
        // Check if account is locked (use .maybeSingle() to avoid error when no record exists)
        const { data: attemptData, error: attemptError } = await supabase
          .from('login_attempts')
          .select('*')
          .eq('email', emailOrPhone)
          .maybeSingle();

        if (attemptError) {
          console.error("Error checking login attempts:", attemptError);
        }

        if (attemptData?.is_locked) {
          const lockedUntil = new Date(attemptData.locked_until);
          const now = new Date();
          
          if (lockedUntil > now) {
            const hoursRemaining = Math.ceil((lockedUntil - now) / (1000 * 60 * 60));
            showToast(
              `Account locked due to multiple failed login attempts. Please contact support@sacredhearts.app to unlock your account. Lock expires in ${hoursRemaining} hour(s).`,
              'error'
            );
            setLoading(false);
            return;
          } else {
            // Lock expired, reset attempts
            await supabase
              .from('login_attempts')
              .delete()
              .eq('email', emailOrPhone);
          }
        }
        
        // Wrap signInWithPassword in try-catch to ensure all errors are caught
        let loginError = null;
        try {
          const { error, data } = await supabase.auth.signInWithPassword({ 
            email: emailOrPhone, 
            password: password 
          });
          loginError = error;
        } catch (signInErr) {
          // If signInWithPassword throws an exception, convert it to an error object
          loginError = signInErr;
          console.error("SignIn exception:", signInErr);
        }

        if (loginError) {
          console.error("Login error:", loginError); // Debug log
          
          // Track failed attempt
          const attemptCount = attemptData ? attemptData.attempt_count + 1 : 1;
          const isLocked = attemptCount >= 5;
          const lockedUntil = isLocked ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null; // Lock for 24 hours

          // Update or create login attempt record
          try {
            if (attemptData) {
              // Update existing record
              await supabase
                .from('login_attempts')
                .update({
                  attempt_count: attemptCount,
                  is_locked: isLocked,
                  locked_until: lockedUntil,
                  last_attempt_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('email', emailOrPhone);
            } else {
              // Create new record
              await supabase
                .from('login_attempts')
                .insert({
                  email: emailOrPhone,
                  attempt_count: attemptCount,
                  is_locked: isLocked,
                  locked_until: lockedUntil,
                  last_attempt_at: new Date().toISOString()
                });
            }
          } catch (dbError) {
            console.error("Error updating login attempts:", dbError);
          }

          // Show appropriate error message - CRITICAL: Always show toast for errors
          if (isLocked) {
            showToast(
              `Account locked after 5 failed attempts. Please contact support@sacredhearts.app to unlock your account.`,
              'error'
            );
          } else {
            const remainingAttempts = 5 - attemptCount;
            showToast(
              `Invalid email or password. ${remainingAttempts} attempt(s) remaining before account lockout.`,
              'error'
            );
          }
          setLoading(false);
          return; // Exit early on error
        } else {
          // Successful login - reset attempts
          if (attemptData) {
            await supabase
              .from('login_attempts')
              .delete()
              .eq('email', emailOrPhone);
          }
          // Auth listener handles the rest - don't set loading false here as auth listener will handle session
        }
      } catch (err) {
        console.error("Login error:", err);
        showToast("Invalid email or password. Please try again.", 'error');
        setLoading(false);
      }
    } 
    
    // --- 2. SIGNUP LOGIC ---
    else if (formData.type === 'signup') {
      const { method, signupName, signupGender, signupDOB, signupCity, signupEmail, signupPhone, password } = formData;
      
      // Convert DD-MM-YYYY to YYYY-MM-DD for database storage
      const dbFormatDate = convertToDbFormat(signupDOB);
      
      const userMetadata = {
        full_name: signupName,
        gender: signupGender,
        date_of_birth: dbFormatDate,
        city: signupCity,
        phone: method === 'phone' ? signupPhone : null // Save phone to metadata if phone signup
      };

      try {
        // A. EMAIL SIGNUP (Instant Login)
        if (method === 'email') {
          const { error } = await supabase.auth.signUp({ 
            email: signupEmail, 
            password: password,
            options: { 
              data: userMetadata 
            } 
          });
          if (error) throw error;

         // --- NEW: Save email so we can resend it later ---
          setPendingSignupEmail(signupEmail); 

          setIsSignupSuccess(true); // Show "Check Email" screen
        } 
        
        // B. PHONE SIGNUP (Triggers SMS, does NOT login yet)
        else if (method === 'phone') {
          const { error, data } = await supabase.auth.signUp({
            phone: signupPhone,
            password: password,
            options: {
              data: userMetadata
            }
          });
          
          if (error) {
            if (error.status === 429) throw new Error("Too many requests. Try again in a minute.");
            throw error;
          }

          // CRITICAL STEP:
          // Phone signup DOES NOT create a session yet. 
          // We must save the phone & password temporarily so VerifyScreen can use them.
          setPendingPhone(signupPhone);
          setPendingPassword(password);
          
          // Switch to Verify Screen
          setAuthStep('verify');
        }

      } catch (error) {
        console.error("Signup Error:", error);
        let msg = error.message;
        
        if (error.message.includes("Password")) msg = "Password must be at least 6 characters.";
        
        if (method === 'phone') {
            showToast(msg, 'error');
        } else {
            showToast(msg || "Signup failed.", 'error');
        }
      }
      setLoading(false);
    }
  };


// Forgot Password Funtion
  const handleForgotPassword = async (email) => {
    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email);
      showToast("Reset link sent to your email!", 'success');
      // We save email to state so we can display it in success screen
      setResetEmail(email);
    } catch (error) {
      console.error("Reset Error:", error);
      showToast("Error sending reset link.", 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle setting new password after clicking reset link
  const handleSetNewPassword = async (newPassword) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast("Password updated successfully!", 'success');
        setIsSettingNewPassword(false);
        setView('form');
        setAuthStep('form');
        // Clear the hash
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (error) {
      console.error("Password Update Error:", error);
      showToast("Error updating password.", 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- ADMIN AUTHENTICATION ---
  const handleAdminLogin = async (email, password) => {
    setLoading(true);
    try {
      // First verify the password using the secure function
      const { data: isPasswordValid, error: verifyError } = await supabase
        .rpc('verify_admin_password', {
          email_param: email,
          password_param: password
        });

      if (verifyError || !isPasswordValid) {
        showToast('Invalid admin credentials', 'error');
        setLoading(false);
        return;
      }

      // If password is valid, fetch admin user details
      const { data: admin, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !admin) {
        showToast('Invalid admin credentials', 'error');
        setLoading(false);
        return;
      }

      // Don't include password_hash in session for security
      const { password_hash, ...adminWithoutPassword } = admin;
      
      setAdminSession(adminWithoutPassword);
      showToast('Admin login successful', 'success');
      
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', admin.id);
    } catch (error) {
      console.error('Admin login error:', error);
      showToast('Admin login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogout = () => {
    setAdminSession(null);
    setAdminView('dashboard');
    showToast('Admin logged out', 'success');
  };

// HandleResend Email Function
  const handleResendEmail = async () => {
    if (!pendingSignupEmail) {
      showToast("No email to resend.", 'error');
      return;
    }
    
    setLoading(true);
    try {
      // Supabase sends the magic link again
      await supabase.auth.resend({
        type: 'signup',
        email: pendingSignupEmail
      });
      
      showToast("Verification email sent again!", 'success');
    } catch (error) {
      console.error("Resend Error:", error);
      showToast("Could not resend email.", 'error');
    } finally {
      setLoading(false);
    }
  };



    // handleVerifyOTP Function
    const handleVerifyOTP = async (code) => {
    setLoading(true);
    try {
      // Supabase verifies the phone number using the token (code)
      const { data, error } = await supabase.auth.verifyOtp({
        phone: pendingPhone,
        token: code,
        type: 'sms'
      });

      if (error) throw error;

      showToast("Verified Successfully!", 'success');
      
      // Clear pending data
      setPendingPhone('');
      setPendingPassword('');
      setAuthStep('welcome'); // Reset auth step

      // Note: verifyOtp creates a session automatically, 
      // so your useEffect listener in App.jsx will log them in automatically.

    } catch (error) {
      console.error("OTP Error:", error);
      showToast("Invalid code. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  };


  // --- NEW LOGIC: CANCEL REQUEST HANDLER ---
  const handleCancelRequest = async (partnerId, matchId) => {
    if (actionLoadingId) return;
    
    setConfirmModal({
      isOpen: true,
      title: "Cancel Request?",
      message: "Are you sure you want to remove this connection request?",
      type: "danger",
      onConfirm: async () => {
        setActionLoadingId(matchId);

        try {
          // 1. Optimistic: Remove from UI
          setMyMatches(prev => prev.filter(m => m.id !== matchId));
          setPartnerProfiles(prev => prev.filter(p => p.id !== partnerId));

          // 2. Database: Delete match row
          await supabase.from('matches').delete().eq('id', matchId);

          // 3. Database: Remove exclusions
          await supabase
            .from('discovery_exclusions')
            .delete()
            .or(`and(user_id.eq.${session.user.id},excluded_user_id.eq.${partnerId}),and(user_id.eq.${partnerId},excluded_user_id.eq.${session.user.id})`);

          showToast("Request cancelled.", 'success')
        } catch (err) {
          console.error("Cancel error:", err);
          showToast("Could not cancel request.");
        } finally {
          setActionLoadingId(null);
        }
      }
    });
  };

  // --- NEW LOGIC: UNMATCH HANDLER ---
  const handleUnmatch = async (partnerId, matchId) => {
    if (actionLoadingId) return;
    
    setConfirmModal({
      isOpen: true,
      title: "Unmatch User?",
      message: "This will remove the chat. You might see them in discovery again.",
      type: "danger",
      onConfirm: async () => {
        setActionLoadingId(partnerId);

        try {
          // 1. OPTIMISTIC: Remove from UI
          setPartnerProfiles(prev => prev.filter(profile => profile.id !== partnerId));
          setMyMatches(prev => prev.filter(match => match.id !== matchId));
          setUnreadCounts(prev => { const copy = { ...prev }; delete copy[partnerId]; return copy; });

          // 2. DATABASE: Delete matches
          await supabase.from('matches').delete().eq('id', matchId);
          await supabase.from('matches').delete().match({ user_a_id: partnerId, user_b_id: session.user.id });

          // 3. CRITICAL: Remove exclusions
          await supabase
            .from('discovery_exclusions')
            .delete()
            .or(`and(user_id.eq.${session.user.id},excluded_user_id.eq.${partnerId}),and(user_id.eq.${partnerId},excluded_user_id.eq.${session.user.id})`);

          if (profile) await fetchCandidates(session.user.id, profile.gender, profile);
          showToast("Unmatched.", 'success')
        } catch (err) {
          console.error("Unmatch error:", err);
          showToast("Could not unmatch user.");
        } finally {
          setActionLoadingId(null);
        }
      }
    });
  };

  // --- NEW LOGIC: BLOCK HANDLER ---
  const handleBlock = async (partnerId, matchId) => {
    if (actionLoadingId) return;
    
    // Open Custom Modal instead of alert
    setConfirmModal({
      isOpen: true,
      title: "Block User?",
      message: "This user will be hidden from your discovery and chat list forever.",
      type: "danger",
      onConfirm: async () => {
        setActionLoadingId(partnerId);

        try {
          // 1. OPTIMISTIC: Remove from UI immediately
          setPartnerProfiles(prev => prev.filter(profile => profile.id !== partnerId));
          setMyMatches(prev => prev.filter(match => match.id !== matchId));

          // 2. DATABASE: Delete match rows
          await supabase
            .from('matches')
            .delete()
            .or(`and(user_a_id.eq.${session.user.id},user_b_id.eq.${partnerId}),and(user_b_id.eq.${session.user.id},user_a_id.eq.${partnerId})`);

          // 3. DATABASE: Add to 'blocks' table
          await supabase.from('blocks').insert({
             blocker_id: session.user.id,
             blocked_id: partnerId
          });

          // 4. CRITICAL: Add to 'discovery_exclusions'
          await supabase.from('discovery_exclusions').insert([
            { user_id: session.user.id, excluded_user_id: partnerId },
            { user_id: partnerId, excluded_user_id: session.user.id }
          ], { onConflict: 'ignore' }); 

          if (profile) await fetchCandidates(session.user.id, profile.gender, profile);
          showToast("User blocked.", 'success')

        } catch (err) {
          console.error("Block error:", err);
          showToast("Could not block user.");
        } finally {
          setActionLoadingId(null);
        }
      }
    });
  };


  // --- REQUEST LOCATION PERMISSION ---
  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            long: position.coords.longitude
          };
          setUserCoords(coords);
          showToast('Location enabled! You can now see distances to other users.', 'success');
          resolve(coords);
        },
        (error) => {
          console.error('Location error:', error);
          let message = 'Location permission denied. ';
          if (error.code === error.PERMISSION_DENIED) {
            message += 'Please enable location in your browser settings to see distances.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message += 'Location information is unavailable.';
          } else {
            message += 'Failed to get location.';
          }
          showToast(message, 'error');
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!session) return
    if (!dateOfBirth) { showToast("Please enter your Date of Birth."); return }
    // Convert DD-MM-YYYY to YYYY-MM-DD for age calculation
    const dbFormatDate = convertToDbFormat(dateOfBirth);
    if (calculateAge(dbFormatDate) < 18) { showToast("You must be 18+."); return }
    // Require phone number after initial profile setup
    if (view === 'profile' && !phone) { 
      showToast("Phone number is required for account security.", 'error'); 
      return 
    }
    
    setLoading(true)
    let finalAvatarUrl = profile?.avatar_url
    let finalAvatarUrl2 = profile?.avatar_url_2
    let finalAvatarUrl3 = profile?.avatar_url_3

    const uploadHelper = async (file, currentUrl) => {
        if (file) {
            const url = await uploadAvatar(file);
            return url || currentUrl;
        }
        return currentUrl;
    };

    try {
        finalAvatarUrl = await uploadHelper(avatarFile, finalAvatarUrl);
        finalAvatarUrl2 = await uploadHelper(avatarFile2, finalAvatarUrl2);
        finalAvatarUrl3 = await uploadHelper(avatarFile3, finalAvatarUrl3);

        const finalHeight = height ? parseInt(height) : null;
        const finalWeight = weight ? parseInt(weight) : null;

        if (height && isNaN(finalHeight)) throw new Error("Height must be a valid number.");
        if (weight && isNaN(finalWeight)) throw new Error("Weight must be a valid number.");

        // --- FIX: Prepare Update Data carefully ---
        // Convert DD-MM-YYYY to YYYY-MM-DD for database storage
        const dbFormatDate = convertToDbFormat(dateOfBirth);
        const updateData = {
            full_name: fullName, gender, city, religion, denomination, intent, bio,
            date_of_birth: dbFormatDate, 
            avatar_url: finalAvatarUrl,
            avatar_url_2: finalAvatarUrl2,
            avatar_url_3: finalAvatarUrl3,
            height: finalHeight,
            weight: finalWeight,
            occupation: occupation, 
            hobbies: hobbies.join(','),
            phone: phone || null, // Save phone number
            icebreaker_prompts: JSON.stringify(icebreakerPrompts), // Save icebreaker prompts
            updated_at: new Date(),
        };

        // ONLY update lat/long if we actually have coordinates (to prevent deleting existing location)
        if (userCoords.lat && userCoords.long) {
            updateData.lat = userCoords.lat;
            updateData.long = userCoords.long;
        }

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', session.user.id)
          
        if (error) throw error
        
        showToast('Profile Saved!', 'success')
        setAvatarFile(null); setPreviewUrl(null);
        setAvatarFile2(null); setPreviewUrl2(null);
        setAvatarFile3(null); setPreviewUrl3(null);
        
        // Stay in profile view after saving
        fetchProfile(session.user.id) // Refresh to get new data
        // Don't redirect - keep view as 'profile'
    } catch (error) {
        console.error(error)
        showToast('Error saving profile: ' + error.message)
    } finally {
        setLoading(false)
    }
  }

  const fetchBlockedUsers = async () => {
    if (!session) return
    try {
      // Get blocks from the 'blocks' table (to show the list in settings)
      const { data: blocks, error: blockError } = await supabase
        .from('blocks')
        .select('id, blocked_id, created_at')
        .eq('blocker_id', session.user.id)
        .order('created_at', { ascending: false })
      if (blockError) throw blockError
      if (!blocks || blocks.length === 0) { setBlockedUsers([]); return }
      const blockedIds = blocks.map(b => b.blocked_id)
      const { data: profiles, error: profileError } = await supabase.from('profiles').select('*').in('id', blockedIds)
      if (profileError) throw profileError
      const merged = blocks.map(block => {
        const profile = profiles.find(p => p.id === block.blocked_id)
        return { ...block, profile }
      })
      setBlockedUsers(merged)
    } catch (error) {
      console.error("Error fetching blocked users:", error)
    }
  }

  const handleUnblock = (blockId) => {
    // Open the Custom Modal instead of window.confirm
    setConfirmModal({
      isOpen: true,
      title: "Unblock User?",
      message: "This user will be able to message you and appear in your discovery feed again.",
      type: "danger", // Use 'danger' for red confirm button, or omit for grey
      onConfirm: async () => {
        try {
          // 1. Get block details to find partner ID
          const { data: blockData } = await supabase.from('blocks').select('blocked_id').eq('id', blockId).single()
          if (!blockData) return;

          // 2. Remove from 'blocks' table
          const { error } = await supabase.from('blocks').delete().eq('id', blockId)
          if (error) throw error

          // 3. CRITICAL: Remove exclusions from 'discovery_exclusions'
          await supabase
            .from('discovery_exclusions')
            .delete()
            .or(`and(user_id.eq.${session.user.id},excluded_user_id.eq.${blockData.blocked_id}),and(user_id.eq.${blockData.blocked_id},excluded_user_id.eq.${session.user.id})`);

          showToast("User unblocked.", 'success')
          fetchBlockedUsers()
          // Refresh Discovery so they appear again
          if (profile) await fetchCandidates(session.user.id, profile.gender, profile);
        } catch (err) {
          console.error("Unblock error:", err)
          showToast("Could not unblock user.", 'error')
        }
      }
    });
  };

  // --- NEW: FETCH MESSAGE HISTORY ---
  const fetchMessages = async (matchId) => {
    if (!matchId) return
    const { data, error } = await supabase.from('messages').select('*').eq('match_id', matchId).order('created_at', { ascending: true })
    if (error) { console.error("Error fetching messages:", error); return }
    setChatMessages(data || [])
  }


  // --- UPDATED: Handle Pass (Supports Undo) ---
  const handlePass = async () => {
    const currentCandidate = candidates[currentIndex];
    if (!currentCandidate) return;

    // 1. Determine if we are undoing
    const isUndo = lastPassedCandidate && lastPassedCandidate.id === currentCandidate.id;

    if (isUndo) {
      // UNDO LOGIC
      // 1. Find candidate to restore
      const candidateToRestore = candidates.find(c => c.id === lastPassedCandidate.id);

      if (candidateToRestore) {
        // Restore to previous index
        setCurrentIndex(prev => Math.max(0, prev - 1));
        setLastPassedCandidate(null);
        setShowUndo(false);
      } else {
        showToast("Could not find profile to undo (it might have been refreshed).");
      }
    } else {
      // STANDARD PASS LOGIC
      
      // 1. Record who we skipped
      setLastPassedCandidate(currentCandidate);

      // 2. Move to next card
      setCurrentIndex(prev => prev + 1);

      // --- NEW: 2 Second Undo Timer ---
      // Clear any existing timer first
      if (undoTimeoutId) clearTimeout(undoTimeoutId);

      // Set a new timer for 2000ms (2 seconds)
      const timer = setTimeout(() => {
        setLastPassedCandidate(null); // Time is up! Revert button to "Pass"
      }, 2000);

      setUndoTimeoutId(timer);
    }
  };


  // --- UPDATED: Handle Connect (Includes Undo Logic) ---
  const handleConnect = async () => {
    const targetUser = candidates[currentIndex];
    if (!targetUser) return;
    setLoading(true);

    const { data: matchesData, error: checkError } = await supabase
      .from('matches')
      .select('*')
      .eq('user_a_id', targetUser.id)
      .eq('user_b_id', session.user.id)
      .limit(1);

    const existingMatch = matchesData ? matchesData[0] : null;
    if (checkError) { console.error("Error checking match:", checkError); setLoading(false); return }

    // Check if we are trying to "Undo" a skipped match
    const isUndo = lastPassedCandidate && lastPassedCandidate.id === targetUser.id;

    if (isUndo) {
      // --- RE-CONNECT LOGIC (Undo) ---
      try {
        // 1. Find existing match (might be deleted if we pressed 'Undo' recently)
        const { data: existingCheck, error: checkError2 } = await supabase
          .from('matches')
          .select('*')
          .eq('user_a_id', targetUser.id)
          .eq('user_b_id', session.user.id)
          .limit(1);

        const matchToRestore = existingCheck ? existingCheck[0] : null;

        if (matchToRestore) {
          // 2. Restore Match (Update to mutual/pending based on existing status)
          await supabase.from('matches').update({ status: matchToRestore.status }).eq('id', matchToRestore.id);
          
          // 3. Restore Discovery Exclusions
          await supabase.from('discovery_exclusions').insert([
            { user_id: session.user.id, excluded_user_id: targetUser.id },
            { user_id: targetUser.id, excluded_user_id: session.user.id }
          ], { onConflict: 'ignore' });

          showToast("Re-connected!", 'success');
        } else {
          // Match record was fully deleted (probably by an 'Unmatch' or refresh). Create new one.
          // We will assume 'Pending' request, or create 'Mutual' if they accepted us?
          // To be safe/symple, let's just create a 'Pending' request for now.
          await supabase.from('matches').insert({
            user_a_id: session.user.id,
            user_b_id: targetUser.id,
            status: 'pending'
          });
          
          await supabase.from('discovery_exclusions').insert([
            { user_id: session.user.id, excluded_user_id: targetUser.id },
            { user_id: targetUser.id, excluded_user_id: session.user.id }
          ]);

          showToast("Connection Requested! 💌", 'success');
        }

        // 4. Clear Undo State
        setLastPassedCandidate(null); // So we can't undo again immediately

      } catch (err) {
        console.error("Re-connect error:", err);
        showToast("Could not re-connect.");
      } finally {
        setLoading(false);
      }
    }

    else {
      // --- STANDARD CONNECT LOGIC ---
      
      if (existingMatch) {
        // Record that we just skipped this user (for Undo)
        setLastPassedCandidate(existingMatch); // Saves ID: existingMatch.id

        // If pending request existed, just update to mutual
        await supabase.from('matches').update({ status: 'mutual' }).eq('id', existingMatch.id);
        // Don't insert duplicate match - just update status
        
        // CRITICAL: Ensure mutual matches are excluded from discovery
        await supabase.from('discovery_exclusions').insert([
          { user_id: session.user.id, excluded_user_id: targetUser.id },
          { user_id: targetUser.id, excluded_user_id: session.user.id }
        ], { onConflict: 'ignore' });
         showToast("🎉 It's a Match!", 'success');
      } else {
        showToast("Connection Requested! 💌", 'success');
        const { error } = await supabase.from('matches').insert({
          user_a_id: session.user.id,
          user_b_id: targetUser.id,
          status: 'pending'
        });
        await supabase.from('discovery_exclusions').insert([
          { user_id: session.user.id, excluded_user_id: targetUser.id },
          { user_id: targetUser.id, excluded_user_id: session.user.id }
        ]);

        if (error) console.error("Error connecting:", error);
      }

      // Move to next card
      setCurrentIndex(prev => prev + 1);
      setLastPassedCandidate(null); 
      setLoading(false);
    }
  };


  // --- NEW: Handle Undo Pass ---
  const handleUndo = () => {
    // 1. Safety Check
    if (!lastPassedCandidate) return;

    // 2. Clear the Undo Timer (Prevent it from resetting while viewing the card)
    if (undoTimeoutId) clearTimeout(undoTimeoutId);
    setUndoTimeoutId(null);

    // 3. Find the candidate in the current list that matches the passed ID
    const candidateToRestore = candidates.find(c => c.id === lastPassedCandidate.id);

    if (candidateToRestore) {
      // Restore to previous index
      setCurrentIndex(prev => Math.max(0, prev - 1));
      setShowUndo(false);
      
      // 4. Clear the passed record
      setLastPassedCandidate(null); 
    }
  };


  // --- HANDLE TYPING BROADCAST & AUTOGROW ---
  const handleInputChange = (e) => {
    const text = e.target.value
    setInputText(text)
    if (!text.trim()) return
    if (view === 'chat' && activeChatProfile) {
        const match = myMatches.find(m => 
            (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
            (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
        )
        if (match) {
             const channel = supabase.channel(`typing:${match.id}`, { config: { broadcast: { self: true } } })
             channel.send({ type: 'broadcast', event: 'typing', payload: { userId: session.user.id } })
        }
    }
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  }

  // --- FIX: Handle Image Sending (Images Only) ---
  const handleImageSend = async (e) => {
    if (!activeChatProfile) return;
    
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      // Upload to 'avatars' bucket (or create 'stories' bucket)
      const filePath = `${session.user.id}/${fileName}` // Create folder path

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 4. Send Message with Image URL
      const match = myMatches.find(m => 
        (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
        (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
      );
      
      if (match) {
        const { error: msgError } = await supabase.from('messages').insert({
          match_id: match.id, 
          sender_id: session.user.id, 
          content: publicUrl,
          type: 'image'      // <--- TELL THE DATABASE THIS IS AN IMAGE ---
        });

        if (msgError) throw msgError;
        showToast("Photo sent!", 'success');
      }

    } catch (error) {
      console.error("Image send error:", error);
      showToast("Failed to send photo.", 'error');
    } finally {
      setUploading(false);
    }
  };


  // --- NEW: Start Recording ---
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support audio recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = recorder;
      audioChunks.current = [];

      recorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        
        // 1. Upload Audio
        await uploadAudioMessage(audioBlob);
        
        // 2. Reset State
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  const uploadAudioMessage = async (blob) => {
    try {
      setUploading(true);
      
      const fileExt = 'webm'; // Chrome/Firefox standard
      const fileName = `${session.user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      // Upload to Supabase (Using 'avatars' bucket)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob)

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Send Message with Audio URL
      const match = myMatches.find(m => 
        (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
        (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
      );

      if (match) {
        const { error: msgError } = await supabase.from('messages').insert({
          match_id: match.id, 
          sender_id: session.user.id, 
          content: publicUrl,
          type: 'audio' // <--- CRITICAL: Mark as audio
        });

        if (msgError) throw msgError;
        showToast("Voice sent!", 'success');
      }

    } catch (error) {
      console.error("Audio upload error:", error);
      showToast("Failed to send voice.", 'error');
    } finally {
      setUploading(false);
    }
  };


  // --- 1. SELECT MESSAGE (Tap to Select) ---
  const handleSelectMessage = (msgId) => {
    // If clicking the same one, deselect it. Otherwise select new one.
    if (selectedMessageId === msgId) {
      setSelectedMessageId(null);
    } else {
      setSelectedMessageId(msgId);
    }
  };

  // --- 2. REPLY ---
  const handleReplyAction = (msg) => {
    setReplyingTo(msg);
    setSelectedMessageId(null); // Close menu
    if (chatInputRef.current) chatInputRef.current.focus();
  };

  // --- 3. COPY ---
  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard", 'success');
    setSelectedMessageId(null);
  };

  // --- 4. FORWARD (Placeholder) ---
  // --- 4. FORWARD ---
  const handleForwardAction = () => {
    const msg = chatMessages.find(m => m.id === selectedMessageId);
    if (!msg) return;
    
    // Show list of matches to forward to
    setInputModal({
      isOpen: false, // We'll use a custom forward modal
      title: "Forward Message",
      placeholder: "Select a match to forward to",
      onSubmit: null
    });
    
    // For now, show toast with option to implement full forward UI
    showToast("Forward: Select a match from your matches list", 'success');
    setSelectedMessageId(null);
    
    // TODO: Implement full forward modal with match list selection
    // This would require a new state for forward target selection
  };

  // --- 5. REPORT ---
  const handleReportAction = (msg) => {
    setInputModal({
      isOpen: true,
      title: "Report Message",
      placeholder: "Why are you reporting this message?",
      onSubmit: (reason) => {
        supabase.from('reports').insert({
          reporter_id: session.user.id,
          reported_id: activeChatProfile.id,
          reason: reason,
          message: msg.content
        });
        showToast("Report submitted.", 'success');
        setSelectedMessageId(null);
      }
    });
  };

  // --- 6. DELETE ---
  const handleDeleteAction = async (msgId) => {
    // Optimistic UI Remove
    setChatMessages(prev => prev.filter(msg => msg.id !== msgId));
    setSelectedMessageId(null); // Close menu

    // Database Delete
    const { error } = await supabase.from('messages').delete().eq('id', msgId);
    if (error) console.error("Delete error:", error);
  };



  const sendMessage = async () => {
    if (!inputText.trim() || !activeChatProfile) return;

    const currentReplyingTo = replyingTo;
        
    const match = myMatches.find(m => 
        (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
        (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
    )
    if (!match) return;
    
    // 1. Optimistic UI: Show message immediately
    const tempMessage = {
      id: Date.now(), match_id: match.id, sender_id: session.user.id,
      content: inputText, created_at: new Date().toISOString(), read_at: null
    }
    setChatMessages(prev => [...prev, tempMessage]);
    setInputText(""); 


    setReplyingTo(null);
    
    // 2. Database Insert
    const { error } = await supabase.from('messages').insert({
      match_id: match.id, sender_id: session.user.id, content: inputText, read_at: null 
    });
    
    if (error) {
      console.error("Error sending message:", error);
    } else {
      // 3. DB Success: Trigger Push Notification
      try {
        const partnerId = match.user_a_id === session.user.id ? match.user_b_id : match.user_a_id;
        
        // Call the Edge Function we just deployed
        await supabase.functions.invoke('send-push-notification', {
          recipient_id: partnerId,
          title: `New message from ${profile.full_name}`,
          body: inputText
        });
        
        showToast("Message sent!", 'success');
      } catch (pushErr) {
        // If push fails, we still show success toast because the message is in DB
        console.log("Push notification simulation failed (this is expected if not configured with FCM):", pushErr);
        showToast("Message sent!", 'success');
      }
    }
  };

  // --- AUTO MARK AS SEEN WHEN CHAT OPENS (WhatsApp-style) ---
  useEffect(() => {
    if (!session || view !== 'chat' || !activeChatProfile) return
    
    const match = myMatches.find(m => 
        (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
        (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
    )
    if (!match) return

    // Mark all unread messages as seen immediately when chat opens
    const markAsSeen = async () => {
      try {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('match_id', match.id)
          .neq('sender_id', session.user.id)
          .is('read_at', null);
        
        // Clear unread count
        setUnreadCounts(prev => ({ ...prev, [activeChatProfile.id]: 0 }));
      } catch (err) {
        console.error("Error marking messages as seen:", err);
      }
    };

    markAsSeen();
  }, [session, view, activeChatProfile, myMatches]);

  // --- REALTIME LISTENER ---
  useEffect(() => {
    if (!session || view !== 'chat' || !activeChatProfile) return
    const match = myMatches.find(m => 
        (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
        (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
    )
    if (!match) return
    const matchId = match.id
    const channel = supabase
      .channel(`messages:${matchId}`, { config: { broadcast: { self: false } } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, (payload) => {
          if (payload.new.sender_id === session.user.id) { return; }
          setChatMessages(prev => [...prev, payload.new])
          // Auto-mark new messages as seen if chat is open
          if (view === 'chat') {
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', payload.new.id)
              .neq('sender_id', session.user.id);
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, (payload) => {
            setChatMessages(prev => prev.map(msg => msg.id === payload.new.id ? payload.new : msg))
        })
      .subscribe()
    messageChannelRef.current = channel
    return () => { if (messageChannelRef.current) supabase.removeChannel(messageChannelRef.current) }
  }, [session, view, activeChatProfile, myMatches])

  // --- TYPING INDICATOR ---
  useEffect(() => {
    if (!session || view !== 'chat' || !activeChatProfile) return
    const match = myMatches.find(m => 
        (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
        (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
    )
    if (!match) return
    const matchId = match.id
    const channel = supabase.channel(`typing:${matchId}`, { config: { broadcast: { self: false } } })
    .on('broadcast', { event: 'typing' }, () => {
        setPartnerIsTyping(true)
        setTimeout(() => setPartnerIsTyping(false), 3000)
    })
    .subscribe()
    return () => supabase.removeChannel(channel)
  }, [session, view, activeChatProfile])

  // --- AUTO SCROLL ---
  useEffect(() => {
    if (view === 'chat' && chatMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])


  // --- ROUTER INTEGRATION ---
  // --- ROUTER INTEGRATION ---
  // Check if we're on admin login page to prevent dark mode class
  const isAdminRoute = window.location.pathname === '/admin';
  const isAdminLoginPage = isAdminRoute && !adminSession;
  
  return (
    <div className={(session || adminSession) && !isAdminLoginPage ? 'dark' : ''}>
      {/* Toast Notification - Global (shown on all pages including auth) */}
      {toast && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-xl z-[100] transition-all duration-300 flex items-center gap-2 animate-bounce-in ${toast.type === 'success' ? 'bg-gray-800 text-white' : 'bg-red-500 text-white'}`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}
      
      <BrowserRouter>
        <Routes>
          
          {/* --- ADMIN ROUTE --- */}
          <Route path="/admin" element={
            adminSession ? (
              <div className="min-h-screen bg-gray-900">
                <div className="bg-gray-800 border-b border-gray-700">
                  <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-6">
                      <button onClick={() => setAdminView('dashboard')} className={`px-4 py-2 rounded-lg transition text-white ${adminView === 'dashboard' ? 'bg-rose-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Dashboard</button>
                      <button onClick={() => setAdminView('users')} className={`px-4 py-2 rounded-lg transition text-white ${adminView === 'users' ? 'bg-rose-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Users</button>
                      <button onClick={() => setAdminView('reports')} className={`px-4 py-2 rounded-lg transition text-white ${adminView === 'reports' ? 'bg-rose-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Reports</button>
                      <button onClick={() => setAdminView('premium')} className={`px-4 py-2 rounded-lg transition text-white ${adminView === 'premium' ? 'bg-rose-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Premium</button>
                      <button onClick={() => setAdminView('logs')} className={`px-4 py-2 rounded-lg transition text-white ${adminView === 'logs' ? 'bg-rose-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Logs</button>
                    </div>
                    <button onClick={handleAdminLogout} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition text-white">Logout</button>
                  </div>
                </div>
                {adminView === 'dashboard' && <AdminDashboard adminUser={adminSession} onLogout={handleAdminLogout} />}
                {adminView === 'users' && <AdminUserManagement adminUser={adminSession} />}
                {adminView === 'reports' && <AdminReportsManagement adminUser={adminSession} />}
                {adminView === 'premium' && <AdminPremiumRequests adminUser={adminSession} />}
                {adminView === 'logs' && <AdminActivityLogs adminUser={adminSession} />}
              </div>
            ) : (
              <AdminLogin onLogin={handleAdminLogin} loading={loading} />
            )
          } />
          
          {/* --- 1. STATIC PAGE: TERMS OF SERVICE --- */}
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/guidelines" element={<CommunityGuidelines />} />

          {/* --- 2. MAIN APP (Catch All Other Routes) --- */}
          <Route path="*" element={
            <>
              {/* --- CONDITIONAL LOGIC (Preserving your original behavior) --- */}
              
              {/* 1. LOADING STATE */}
              {loading && <Loader />}

              {/* 2. RESET PASSWORD SCREEN - Show different screens based on context */}
              {view === 'reset-password' && (
                isSettingNewPassword ? (
                  // User clicked reset link - show form to set new password
                  <SetNewPasswordScreen 
                    onUpdatePassword={handleSetNewPassword}
                    onBack={() => {
                      setIsSettingNewPassword(false);
                      setView('form');
                      setAuthStep('form');
                      window.history.replaceState(null, '', window.location.pathname);
                    }}
                    loading={loading}
                  />
                ) : (
                  // User requesting password reset - show email input
                  <ResetPasswordScreen 
                    onResetRequest={handleForgotPassword}
                    email={resetEmail}
                    onBack={() => {
                      setView('form');
                      setAuthStep('form');
                    }}
                    loading={loading}
                  />
                )
              )}

              {/* 3. SIGNUP SUCCESS SCREEN (UPDATED GLASS STYLE) */}
              {isSignupSuccess && (
                <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
                    {/* Background */}
                    <div className="absolute inset-0 -z-10 h-full w-full">
                        <img src={loginImg} className="w-full h-full object-cover" alt="Background" />
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div> 
                    </div>

                    {/* Glass Card */}
                    <div className="relative z-10 w-full max-w-md mx-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 text-center">
                        
                        {/* --- A. CHECK ICON (Lucide) --- */}
                        <div className="mb-6">
                          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/40">
                              {/* This is the "Green Dot/Check" you saw */}
                              <CheckCircle size={42} className="text-green-400 drop-shadow-lg" />
                          </div>
                        </div>

                        {/* --- B. HEADER --- */}
                        <h2 className="text-2xl font-extrabold text-white mb-2">Almost There!</h2>
                        <p className="text-sm sm:text-base text-white/90 font-light leading-relaxed">
                          We sent a magic link to <br/>
                          <span className="font-bold text-rose-300">{pendingSignupEmail || "your email"}</span>
                        </p>

                        {/* --- C. BUTTONS --- */}
                        <div className="flex flex-col gap-3 mt-6">
                          
                          {/* Verify Button (Simulates clicking link) */}
                          <button 
                            onClick={() => setIsSignupSuccess(false)}
                            className="w-full bg-white text-rose-600 font-bold py-3.5 rounded-xl shadow-lg hover:bg-gray-100 active:scale-[0.98] transition-all duration-200"
                          >
                            I've Verified My Email
                          </button>

                          {/* --- NEW: REAL RESEND BUTTON --- */}
                          <button 
                            onClick={handleResendEmail} // Wired to real function now!
                            disabled={loading}
                            className="w-full text-xs font-bold text-white/70 hover:text-white bg-white/5 py-2 rounded-lg hover:bg-white/10 transition disabled:opacity-50"
                          >
                            {loading ? 'Sending...' : 'Resend Verification Email'}
                          </button>
                        </div>

                    </div>
                </div>
              )}

              {/* --- LOGGED OUT VIEW (Welcome & Auth Form) --- */}
              {!session && (
                <div>
                  {authStep === 'welcome' && (
                    <WelcomePage 
                      onLoginClick={() => {
                        setAuthMode('login');
                        setAuthStep('form');
                      }} 
                      onSignupClick={() => {
                        setAuthMode('signup');
                        setAuthStep('form');
                      }} 
                    />
                  )}
                  {authStep === 'form' && (
                    <AuthScreen 
                      mode={authMode} 
                      onSubmit={handleAuth} 
                      onBack={() => setAuthStep('welcome')} 
                      onForgotClick={() => setAuthStep('reset')} 
                      loading={loading}
                    />
                  )}
                {/* --- NEW: VERIFY SCREEN (Phone OTP) --- */}
                {authStep === 'verify' && (
                  <VerifyScreen 
                    onVerify={handleVerifyOTP}
                    phone={pendingPhone}
                    onBack={() => setAuthStep('form')}
                    loading={loading}
                  />
                )}
                {/* --- NEW: RESET PASSWORD SCREEN --- */}
                {authStep === 'reset' && (
                  <ResetPasswordScreen 
                    onResetRequest={handleForgotPassword}
                    email={resetEmail} // Pass the saved email to show in UI
                    onBack={() => setAuthStep('form')}
                    loading={loading}
                  />
                )}
                </div>
              )}
              {/* --- LOGGED IN APP --- */}
              {session && (
                <div className="app-shell min-h-screen w-full h-full overflow-hidden">
                  <DashboardHeader 
                    profile={profile} 
                    stats={stats} 
                    setView={setView} 
                    
                    // --- UPDATED: LOGOUT LOGIC (RESETS THEME) ---
                    onLogout={async () => { 
                      await supabase.auth.signOut(); 
                      setAuthStep('welcome'); 
                      
                      // 1. Set theme state to light
                      setTheme('light');
                      
                      // 2. Clear local storage
                      localStorage.setItem('sacred_theme', 'light');
                      
                      // 3. Force the browser to remove dark mode immediately
                      document.documentElement.classList.remove('dark');
                      document.body.style.backgroundColor = 'transparent'; // Transparent so images show
                      document.body.style.backgroundImage = 'none';
                    }} 
                    
                    onFilterClick={() => setShowFilters(true)} 
                    theme={theme} 
                    toggleTheme={toggleTheme} 
                  />
                  
                  <main className="scrollable-content relative">
                    <div className="absolute inset-0 pointer-events-none -z-10">
                        <div className="absolute top-0 left-0 w-72 h-72 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
                    </div>
                    {(view === 'profile' || view === 'setup') && (
                      <div className="w-full max-w-md mx-auto px-4 pt-2">
                        {/* --- NEW: GLASS CARD WRAPPER --- */}
                          <div className="bg-black/20 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8">
                            
                            {/* --- HEADER --- */}
                            <div className="flex items-center justify-between mb-6 px-2">
                                
                                {/* 1. LEFT: Privacy Icon */}
                                <button 
                                    onClick={() => setView('privacy')} 
                                    className="text-white/80 hover:text-rose-300 p-2 transition rounded-full hover:bg-white/5"
                                    aria-label="Privacy & Security Settings"
                                >
                                    <Lock size={24} />
                                </button>

                                {/* 2. CENTER: Avatar + Text */}
                                <div className="text-center flex-1">
                                    <div className="flex items-center justify-center gap-3 mb-4">
                                      <label htmlFor="avatar-input-main" className="cursor-pointer relative">
                                        <div className="w-20 h-20 rounded-full border-4 border-white/30 overflow-hidden relative cursor-pointer group shadow-lg">
                                          <img src={previewUrl || profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name}`} className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white"><Edit size={20}/></div>
                                        </div>
                                        {/* Verified Badge - WhatsApp style - Positioned at bottom-right of avatar */}
                                        {profile?.is_verified && (
                                          <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-md z-10" title="Verified Account">
                                            <Check size={10} className="text-white" strokeWidth={3} />
                                          </div>
                                        )}
                                      </label>
                                    </div>
                                    <input type="file" id="avatar-input-main" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    <div className="flex items-center justify-center gap-2">
                                      <h2 className="text-xl font-bold text-white mb-1">{view === 'profile' ? 'Edit Profile' : 'Complete Profile'}</h2>
                                    </div>
                                    <p className="text-xs text-white/70 mt-1">Help us find your perfect match.</p>
                                </div>

                                {/* 3. RIGHT: Settings Icon */}
                                <button 
                                    onClick={() => setView('settings')} 
                                    className="text-white/80 hover:text-rose-300 p-2 transition rounded-full hover:bg-white/5"
                                    aria-label="General Settings"
                                >
                                    <Settings size={24} />
                                </button>
                            </div>
                            
                            {/* --- PROGRESS BAR --- */}
                            {(view === 'profile' || view === 'setup') && (
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Profile Strength</span>
                                        <span className={`text-xs font-bold ${calculateProfileCompleteness(profile || {}) === 100 ? 'text-green-400' : 'text-rose-300'}`}>
                                            {calculateProfileCompleteness(profile || {})}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                                        <div 
                                            className={`h-2.5 rounded-full transition-all duration-1000 ${calculateProfileCompleteness(profile || {}) === 100 ? 'bg-green-500' : 'bg-rose-600'}`} 
                                            style={{ width: `${calculateProfileCompleteness(profile || {})}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}


                            {/* --- MAIN FORM (Input Fields) --- */}
                            {(view === 'profile' || view === 'setup') && (
                                <form onSubmit={handleSaveProfile} className="space-y-4">
                                    
                                    {/* --- 1. IMAGES --- */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {[{ file: avatarFile, setFile: setAvatarFile, preview: previewUrl, setPreview: setPreviewUrl, isPrimary: true },
                                          { file: avatarFile2, setFile: setAvatarFile2, preview: previewUrl2, setPreview: setPreviewUrl2 },
                                          { file: avatarFile3, setFile: setAvatarFile3, preview: previewUrl3, setPreview: setPreviewUrl3 }]
                                          .map((slot, idx) => (
                                            <div key={idx} 
                                                 onClick={() => document.getElementById(`avatar-input-${idx}`).click()} 
                                                 className={`relative aspect-square rounded-xl overflow-hidden border-2 ${slot.isPrimary ? 'border-rose-300/50' : 'border-white/20'} cursor-pointer group transition hover:border-rose-300`}>
                                                <img src={slot.preview || profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name}`} 
                                                     className="w-full h-full object-cover opacity-90" />
                                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white"><Edit size={18} className="text-white"/></div>
                                                
                                                {/* Hidden Input */}
                                                <input type="file" id={`avatar-input-${idx}`} className="hidden" accept="image/*" 
                                                       onChange={(e) => {
                                                           const file = e.target.files?.[0]; 
                                                           if(file) { slot.setFile(file); slot.setPreview(URL.createObjectURL(file)); }
                                                       }} />
                                            </div>
                                          ))}
                                    </div>

                                    {/* --- 2. FULL NAME --- */}
                                    <div className="relative">
                                        <div className="absolute left-3 top-3.5 text-white/60"><User size={18} strokeWidth={1.5}/></div>
                                        <input type="text" placeholder="Full Name" className="w-full p-3 pl-10 border border-white/20 bg-white/10 text-white placeholder-white/40 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition" value={fullName} onChange={e=>setFullName(e.target.value)} />
                                    </div>

                                    {/* --- 3. GENDER --- */}
                                    {view === 'profile' ? ( 
                                      <div className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white/70">Gender: {gender === 'male' ? 'Man' : 'Woman'} (Locked)</div> 
                                    ) : (
                                      <select className="w-full p-3 pl-3 border border-white/20 bg-white/10 text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none [&>option]:text-gray-800" value={gender} onChange={e=>setGender(e.target.value)}><option value="">Gender</option><option value="male">Man</option><option value="female">Woman</option></select>
                                    )}

                                    {/* --- 4. DATE OF BIRTH --- */}
                                    <div className="relative">
                                        <div className="absolute left-3 top-3.5 text-white/60"><Calendar size={18} strokeWidth={1.5}/></div>
                                        <input 
                                            type="text" 
                                            placeholder="DD-MM-YYYY" 
                                            pattern="\d{2}-\d{2}-\d{4}"
                                            inputMode="numeric"
                                            className="w-full p-3 pl-10 border border-white/20 bg-white/10 text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none placeholder-white/40" 
                                            value={dateOfBirth} 
                                            onChange={e => {
                                                let value = e.target.value.replace(/\D/g, '');
                                                if (value.length > 8) value = value.slice(0, 8);
                                                if (value.length > 2) value = value.slice(0, 2) + '-' + value.slice(2);
                                                if (value.length > 5) value = value.slice(0, 5) + '-' + value.slice(5);
                                                setDateOfBirth(value);
                                            }} 
                                        />
                                    </div>
                                    
                                    {/* --- 5. HEIGHT & WEIGHT --- */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-white/60 font-bold mb-1 pl-1">Height (cm)</label>
                                            <input type="number" placeholder="e.g. 180" className="w-full p-3 border border-white/20 bg-white/10 text-white placeholder-white/40 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none" value={height} onChange={e=>setHeight(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-white/60 font-bold mb-1 pl-1">Weight (kg)</label>
                                            <input type="number" placeholder="e.g. 75" className="w-full p-3 border border-white/20 bg-white/10 text-white placeholder-white/40 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none" value={weight} onChange={e=>setWeight(e.target.value)} />
                                        </div>
                                    </div>
                                                    
                                    {/* --- 6. OCCUPATION --- */}
                                    <div className="relative">
                                        <label className="block text-xs text-white/60 font-bold mb-1 pl-1">Occupation</label>
                                        <input type="text" placeholder="e.g. Software Engineer, Student" className="w-full p-3 border border-white/20 bg-white/10 text-white placeholder-white/40 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none" value={occupation} onChange={e=>setOccupation(e.target.value)} />
                                    </div>

                                    {/* --- 7. HOBBIES (Visual Chips) --- */}
                                    <div className="mt-4">
                                        <label className="block text-xs text-white/60 font-bold mb-2 pl-1">Hobbies (Select)</label>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {HOBBIES_LIST.map((hobby) => {
                                                const isSelected = hobbies.includes(hobby);
                                                return (
                                                    <button
                                                        key={hobby}
                                                        type="button" 
                                                        onClick={() => {
                                                            if(isSelected) setHobbies(prev => prev.filter(h => h !== hobby));
                                                            else setHobbies(prev => [...prev, hobby]);
                                                        }}
                                                        className={`
                                                            text-xs py-2 rounded-lg border transition font-medium
                                                            ${isSelected 
                                                                ? 'bg-rose-600 text-white border-rose-500' 
                                                                : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                                                            }
                                                        `}
                                                    >
                                                        {hobby}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* --- 8. CITY --- */}
                                    <select className="w-full p-3 pl-3 border border-white/20 bg-white/10 text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none [&>option]:text-gray-800" value={city} onChange={e=>setCity(e.target.value)}><option value="">City</option><option value="Accra">Accra</option><option value="Kumasi">Kumasi</option><option value="Tema">Tema</option><option value="Tamale">Tamale</option><option value="Cape Coast">Cape Coast</option><option value="Takoradi">Takoradi</option><option value="Sunyani">Sunyani</option><option value="Ho">Ho</option><option value="Wa">Wa</option><option value="Techiman">Techiman</option><option value="Goaso">Goaso</option><option value="Nalerigu">Nalerigu</option><option value="Sefwi Wiaso">Sefwi Wiaso</option><option value="Damango">Damango</option><option value="Dambai">Dambai</option><option value="Bolgatanga">Bolgatanga</option></select>
                                    
                                    {/* --- 9. RELIGION --- */}
                                    <select className="w-full p-3 pl-3 border border-white/20 bg-white/10 text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none [&>option]:text-gray-800" value={religion} onChange={e=>setReligion(e.target.value)}><option value="">Religion</option><option value="Christian">Christian</option><option value="Muslim">Muslim</option><option value="Others">Others</option></select>
                                    
                                    {/* --- 10. INTENT --- */}
                                    <select className="w-full p-3 pl-3 border border-white/20 bg-white/10 text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none [&>option]:text-gray-800" value={intent} onChange={e=>setIntent(e.target.value)}><option value="">Intent</option><option value="Serious Dating">Serious Dating</option><option value="Marriage">Marriage</option><option value="New Friends">New Friends</option></select>
                                    
                                    {/* --- 11. BIO --- */}
                                    <textarea className="w-full p-3 border border-white/20 bg-white/10 text-white placeholder-white/40 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none" placeholder="About me..." rows="3" value={bio} onChange={e=>setBio(e.target.value)}></textarea>
                                    
                                    {/* --- 12. PHONE NUMBER (Required after initial setup) --- */}
                                    {view === 'profile' && (
                                        <div className="relative">
                                            <div className="absolute left-3 top-3.5 text-white/60"><Phone size={18} strokeWidth={1.5}/></div>
                                            <input 
                                                type="tel" 
                                                placeholder="Phone Number (+233...)" 
                                                required={view === 'profile'}
                                                className="w-full p-3 pl-10 border border-white/20 bg-white/10 text-white placeholder-white/40 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition" 
                                                value={phone} 
                                                onChange={e=>setPhone(e.target.value)} 
                                            />
                                            <p className="text-xs text-white/50 mt-1 ml-1">Required for account security and verification</p>
                                        </div>
                                    )}
                                    
                                    {/* --- 13. SAVE BUTTON --- */}
                                    {/* --- LOCATION PERMISSION BUTTON (Setup View Only) --- */}
                                    {view === 'setup' && !userCoords.lat && !profile?.lat && (
                                      <div className="bg-rose-500/20 border border-rose-400/30 rounded-xl p-4 mb-4">
                                        <div className="flex items-start gap-3">
                                          <MapPin size={20} className="text-rose-300 mt-0.5 flex-shrink-0" />
                                          <div className="flex-1">
                                            <p className="text-white font-semibold text-sm mb-1">Enable Location</p>
                                            <p className="text-white/70 text-xs mb-3">Allow location access to see distances to other users and help them find you!</p>
                                            <button
                                              type="button"
                                              onClick={requestLocationPermission}
                                              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-lg transition text-sm flex items-center justify-center gap-2"
                                            >
                                              <MapPin size={16} />
                                              Enable Location
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    <button type="submit" disabled={loading} className="w-full bg-rose-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-rose-600/40 hover:bg-rose-700 active:scale-95 transition flex items-center justify-center gap-2">{loading ? 'Saving...' : <><Save size={18} className="mr-2"/>{view === 'setup' ? 'Complete Profile' : 'Update Profile'}</>}</button>
                                </form>
                            )}

                            {/* --- FOOTER ACTIONS (Blocked, Logout) --- */}
                            {view === 'profile' && (
                                <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-3">
                                    <button onClick={() => { fetchBlockedUsers(); setView('blocked'); }} className="bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 border border-white/20 transition"><AlertTriangle size={16}/> Blocked</button>
                                    <button 
                                        onClick={async () => { await supabase.auth.signOut(); setAuthStep('welcome'); }} 
                                        className="bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:border-red-500/50 transition"
                                    >
                                        <LogOut size={16} /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                      </div>
                    )}
                    {view === 'discovery' && (
                      <div className="w-full max-w-md mx-auto px-4 pt-2">            
                        <div className="flex flex-col items-center justify-start min-h-[60vh]">
                            {!candidates[currentIndex] && (
                                 <div className="text-center p-8 bg-white rounded-2xl shadow-sm w-full mt-10">
                                    <h3 className="text-xl font-bold text-gray-800">No More Profiles</h3>
                                    <p className="text-gray-500 text-sm mt-2">Adjust your filters to see more people.</p>
                                    <button onClick={() => fetchCandidates(session.user.id, profile.gender, profile)} className="mt-4 text-rose-600 font-bold text-sm">Refresh</button>
                                 </div>
                            )}
                            {candidates[currentIndex] && (
                                <DiscoverCard 
                                    candidate={candidates[currentIndex]}
                                    onPass={handlePass}
                                    onConnect={handleConnect}
                                    // NEW PROPS
                                    onViewProfile={handleViewProfile}
                                    onLike={handleLike}
                                    onSuperLike={handleSuperLike}
                                    loading={actionLoadingId === candidates[currentIndex]?.id}
                                    isLiked={myCrushes.some(c => c.liked_id === candidates[currentIndex]?.id)}
                                    isSuperLiked={superLikes.includes(candidates[currentIndex]?.id)}
                                    isVerified={verifiedUsers.includes(candidates[currentIndex]?.id)}
                                    // Undo State (to show button in card if desired)
                                    lastPassed={lastPassedCandidate}
                                    handleUndo={handleUndo}
                                />
                            )}
                        </div>
                      </div>
                    )}

                    {view === 'search' && (
                      <div className="w-full max-w-md mx-auto px-4 pt-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Find People</h2>
                        
                        {/* Search Input */}
                        <div className="relative mb-6">
                            <input 
                                type="text" 
                                placeholder="Search by name or city..." 
                                className="w-full p-4 pl-12 pr-4 rounded-2xl shadow-sm bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    handleGlobalSearch(e.target.value);
                                }}
                            />
                            <div className="absolute left-4 top-4.5 text-gray-400">
                                <Activity size={20} />
                            </div>
                        </div>

                        {/* Results */}
                        <div className="space-y-3 pb-20">
                            {searchResults.length === 0 && searchQuery.length > 1 ? (
                                <div className="text-center text-gray-400 mt-10">No users found.</div>
                            ) : (
                                searchResults.map((user) => (
                                    <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`} className="w-12 h-12 rounded-full bg-gray-100" />
                                            <div>
                                                <h3 className="font-bold text-gray-900">{user.full_name}</h3>
                                                <p className="text-xs text-rose-600">{user.city}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => { handleViewProfile(user); }} className="text-rose-600 font-bold text-xs bg-rose-50 px-3 py-2 rounded-full">View</button>
                                    </div>
                                ))
                            )}
                        </div>
                      </div>
                    )}
                    {view === 'stories' && (
                      <div className="w-full max-w-md mx-auto px-4 pt-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-between">
                            Daily Stories
                            <label htmlFor="story-upload" className="cursor-pointer bg-rose-50 text-rose-600 text-xs font-bold px-3 py-2 rounded-full hover:bg-rose-100 transition">
                                + Add Story
                            </label>
                            <input type="file" id="story-upload" className="hidden" accept="image/*" onChange={handleStoryUpload} />
                        </h2>
                        
                        {/* Horizontal Scroll Container - Instagram Style Wrapping */}
                        <div className="flex flex-wrap gap-4 pb-20 justify-start">
                            {/* My Story Circle (Always first) - Clickable if has story */}
                            {(() => {
                              const myStory = stories.find(s => s.user_id === session?.user?.id);
                              return (
                            <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                    <div 
                                      onClick={myStory ? () => {
                                        // Find my profile for story context
                                        const myProfile = { id: session.user.id, full_name: profile?.full_name, avatar_url: profile?.avatar_url };
                                        handleViewProfile(myProfile, myStory);
                                      } : undefined}
                                      className={`w-20 h-20 rounded-full border-2 border-rose-500 p-1 relative ${myStory ? 'cursor-pointer' : ''}`}>
                                    <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden">
                                        <img 
                                                src={previewUrl || profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name}`} 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    {/* Add Button Overlay */}
                                        <label htmlFor="story-upload" className="absolute bottom-0 right-0 bg-blue-500 text-white w-6 h-6 rounded-full border-2 border-white flex items-center justify-center cursor-pointer z-10">
                                        <Plus size={12} />
                                    </label>
                                </div>
                                    <span className="text-xs font-medium truncate w-20 text-center text-gray-200 dark:text-gray-300">
                                      {myStory ? 'My Story' : 'Add Story'}
                                    </span>
                            </div>
                              );
                            })()}

                            {/* Other Stories */}
                            {stories.map((story) => (
                                <div 
                                  key={story.id} 
                                  className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer" 
                                  onClick={() => handleViewProfile(story.profiles, story)}
                                >

                                    {/* --- 1. THE INSTAGRAM RING WRAPPER --- */}
                                    <div className="relative w-20 h-20">
                                        
                                        {/* The Gradient Border (Ring) */}
                                        <div className="absolute inset-0 rounded-full p-[3px] bg-gradient-to-tr from-rose-400 via-pink-500 to-orange-400"></div>
                                        
                                        {/* The Inner White Border (Creates gap between ring and image) */}
                                        <div className="absolute inset-[3px] rounded-full border-2 border-white overflow-hidden">
                                            <img 
                                                src={story.media_url} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>

                                    {/* Name Below Circle */}
                                    <span className="text-[10px] font-medium text-gray-200 dark:text-gray-300 truncate w-20 text-center">{story.profiles?.full_name}</span>
                                </div>
                            ))}

                            
                            {stories.length === 0 && (
                                <div className="w-full text-center text-gray-400 mt-10">
                                    No active stories right now.
                                </div>
                            )}
                        </div>
                      </div>
                    )}
                    {view === 'interests' && (
                      <div className="w-full max-w-md mx-auto px-4 pt-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Interests</h2>
                        <p className="text-sm text-gray-500 mb-6 text-center">Pending connections and requests.</p>
                        <div className="space-y-3 pb-20">
                            {myMatches.filter(m => m.status === 'pending').length === 0 ? (
                                <div className="text-center text-gray-400 mt-10">No pending interests yet.</div>
                            ) : (
                                myMatches.filter(m => m.status === 'pending').map((match) => {
                                    const partnerId = match.user_a_id === session.user.id ? match.user_b_id : match.user_a_id;
                                    const partnerProfile = partnerProfiles.find(p => p.id === partnerId);
                                    if (!partnerProfile) return null;
                                    
                                    const isIncoming = match.user_a_id !== session.user.id; // Someone sent to me
                                    const isOutgoing = match.user_a_id === session.user.id; // I sent to someone

                                    return (
                                        <div key={match.id} className="bg-white p-4 rounded-xl shadow-sm border border-yellow-50 flex items-center gap-4">
                                            <img src={partnerProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerProfile.full_name}`} className="w-12 h-12 rounded-full bg-gray-100" />
                                            <div className="flex-grow min-w-0"><h3 className="font-bold text-gray-900 truncate">{partnerProfile.full_name}</h3><p className="text-xs text-rose-600 truncate">{partnerProfile.city}</p></div>
                                            <div className="flex gap-2">
                                                {isIncoming ? (
                                                    // --- Incoming Request ---
                                                    <>
                                                        <button onClick={async () => {
                                                            await supabase.from('matches').update({ status: 'mutual' }).eq('id', match.id);
                                                            // Don't insert duplicate match - just update status
                                                            // CRITICAL: Ensure mutual matches are excluded from discovery
                                                            await supabase.from('discovery_exclusions').insert([
                                                                { user_id: session.user.id, excluded_user_id: partnerId },
                                                                { user_id: partnerId, excluded_user_id: session.user.id }
                                                            ], { onConflict: 'ignore' });
                                                            showToast("Match Accepted!", 'success'); 
                                                            fetchMyMatches();
                                                            // Refresh discovery to remove matched users
                                                            if (profile) await fetchCandidates(session.user.id, profile.gender, profile);
                                                        }} className="bg-green-100 text-green-600 p-2 rounded-full hover:bg-green-200 transition">
                                                            <Check size={20} />
                                                        </button>
                                                        <button onClick={async () => {
                                                            await supabase.from('matches').delete().eq('id', match.id);
                                                            await supabase.from('discovery_exclusions').delete().or(`and(user_id.eq.${session.user.id},excluded_user_id.eq.${partnerId}),and(user_id.eq.${partnerId},excluded_user_id.eq.${session.user.id})`);
                                                            fetchMyMatches();
                                                        }} className="bg-red-100 text-red-600 p-2 rounded-full"><X size={20} /></button>
                                                    </>
                                                ) : (
                                                    // --- Outgoing Request (Unsend Button) ---
                                                    <button 
                                                        onClick={() => handleCancelRequest(partnerId, match.id)} 
                                                        disabled={actionLoadingId === match.id}
                                                        className={`text-xs font-bold text-gray-400 border border-gray-200 px-3 py-1.5 rounded-full hover:bg-red-50 hover:text-red-500 transition ${actionLoadingId === match.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        Unsend
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                      </div>
                    )}
                    {view === 'crushes' && (
                      <CrushesView 
                        myCrushes={myCrushes}
                        incomingCrushes={incomingCrushes}
                        onViewProfile={handleViewProfile}
                      />
                    )}
                    {view === 'matches' && (
                      <div className="w-full max-w-md mx-auto px-4 pt-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Your Connections</h2>
                        <div className="space-y-3 pb-20">
                            {/* FIX: Calculate mutual matches FIRST before checking length */}
                            {(() => {
                                const mutualMatches = partnerProfiles.filter((p) => {
                                    const match = myMatches.find(m => 
                                        (m.user_a_id === session.user.id && m.user_b_id === p.id) || 
                                        (m.user_b_id === session.user.id && m.user_a_id === p.id)
                                    );
                                    return match && match.status === 'mutual';
                                });

                                if (mutualMatches.length === 0) {
                                  return (
                                    <div className="text-center text-gray-400 mt-10">No connections yet.</div>
                                  );
                                }

                                return mutualMatches.map((p) => {
                                    const match = myMatches.find(m => (m.user_a_id === session.user.id && m.user_b_id === p.id) || (m.user_b_id === session.user.id && m.user_a_id === p.id));
                                    
                                    return (
                                    <div key={p.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-sm flex items-center gap-4 p-4">
                                        <img src={p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.full_name}`} className="w-12 h-12 rounded-full bg-gray-100" />
                                        <div className="flex-grow min-w-0">
                                            <div className="flex flex-col items-start">
                                                <h3 className="font-bold text-gray-900 truncate">{p.full_name}</h3>
                                                <div className="flex items-center gap-1 text-xs mt-0.5">
                                                    <MapPin size={10} className="text-rose-600" /> 
                                                    <span className="text-rose-600">{p.city}</span>
                                                    {onlineUsers.includes(p.id) && (
                                                        <span className="text-[9px] text-green-500 font-medium flex items-center gap-1">
                                                            <div className="w-1 h-1 bg-green-400 rounded-full"></div> Online
                                                        </span>
                                                    )}
                                                </div>
                                                {p.bio && (<p className="text-xs text-gray-500 line-clamp-1 mt-1">{p.bio}</p>)}
                                            </div>
                                        </div>
                                        
                                        {/* Actions for Mutual Matches */}
                                        <div className="flex gap-2">
                                            <div className="relative">
                                                <button onClick={async () => {
                                                    setView('chat'); setActiveChatProfile(p);
                                                    if (match) {
                                                        setUnreadCounts(prev => ({ ...prev, [p.id]: 0 })); setChatMessages([]); await fetchMessages(match.id);
                                                        await supabase.from('messages').update({ read_at: new Date() }).eq('match_id', match.id).neq('sender_id', session.user.id).is('read_at', null);
                                                    }
                                                }} className="bg-rose-50 text-rose-600 p-2 rounded-full hover:bg-rose-100 transition">
                                                    <MessageCircle size={20} />
                                                </button>
                                                {unreadCounts[p.id] > 0 && (
                                                    <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce-in">
                                                        {unreadCounts[p.id] > 9 ? '9+' : unreadCounts[p.id]}
                                                    </span>
                                                )}
                                            </div>
                                            <button onClick={() => { if (match) handleUnmatch(p.id, match.id); }} disabled={actionLoadingId === p.id} className={`text-gray-400 hover:text-gray-600 p-2 rounded-full transition hover:bg-gray-100 ${actionLoadingId === p.id ? 'opacity-50 cursor-not-allowed' : ''}`} title="Unmatch"><X size={18} /></button>
                                            <button onClick={() => { if (match) handleBlock(p.id, match.id); }} disabled={actionLoadingId === p.id} className={`text-gray-400 hover:text-red-500 p-2 rounded-full transition hover:bg-red-50 ${actionLoadingId === p.id ? 'opacity-50 cursor-not-allowed' : ''}`} title="Block User"><AlertTriangle size={18} /></button>
                                        </div>
                                    </div>
                                    )
                                })
                            })()}
                        </div>
                      </div>
                    )}
                    {view === 'visitors' && (
                      <div className="w-full max-w-md mx-auto px-4 pt-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-2">
                          <Eye className="text-rose-500" /> Profile Visitors
                        </h2>
                        <div className="space-y-3 pb-20">
                          {visitors.length === 0 ? (
                            <div className="text-center text-gray-400 mt-10 bg-white p-6 rounded-xl border border-dashed border-gray-200">
                                <Eye size={32} className="mx-auto mb-2 text-gray-300" /> 
                                <p className="text-sm">No visitors yet.</p>
                            </div>
                          ) : (
                            visitors
                              .filter((visit) => visit.viewer) // Filter out null viewers first
                              .map((visit, index) => {
                                const p = visit.viewer;
                                const timeAgo = new Date(visit.created_at).toLocaleDateString();

                                return (
                                  <div key={visit.id || `visitor-${index}`} className="bg-white p-4 rounded-xl shadow-sm border border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img 
                                            src={p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.full_name}`} 
                                            className="w-12 h-12 rounded-full bg-gray-100 object-cover" 
                                        />
                                        <div>
                                            <h3 className="font-bold text-gray-900">{p.full_name}</h3>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <MapPin size={12} /> {p.city}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                                            {timeAgo}
                                        </span>
                                    </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                    {view === 'blocked' && (
                        <div className="w-full max-w-md mx-auto px-4 pt-6">
                           <div className="flex items-center justify-between mb-6 px-2">
                              <button onClick={() => setView('profile')} className="text-gray-600"><ArrowLeft size={24}/></button>
                              <h2 className="text-xl font-bold text-gray-800">Blocked Users</h2>
                              <div className="w-6"></div> {/* Invisible spacer to center title */}
                           </div>
                        <div className="space-y-3 pb-20">
                          {blockedUsers.length === 0 ? (<div className="text-center text-gray-400 mt-10">You have not blocked anyone.</div>) : (
                            blockedUsers.map((item) => (
                                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3"><img src={item.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.profile?.full_name}`} className="w-10 h-10 rounded-full bg-gray-100" /><span className="font-bold text-gray-800">{item.profile?.full_name}</span></div>
                                    <button onClick={() => handleUnblock(item.id)} className="bg-gray-100 text-gray-700 font-bold py-1.5 px-4 rounded-lg text-sm hover:bg-gray-200 transition">Unblock</button>
                                </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                    {/* SETTINGS VIEW (Settings Icon) */}
                    {view === 'settings' && (
                      <div className="w-full max-w-md mx-auto px-4 pt-6 pb-20">
                        <div className="flex items-center justify-between mb-6 px-2">
                            <button onClick={() => setView('profile')} className="text-white/80 hover:text-rose-300"><ArrowLeft size={24}/></button>
                            <h2 className="text-xl font-bold text-white">Settings</h2>
                            <div className="w-6"></div>
                        </div>
                        
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-6">
                            {/* Toggle 1: Discovery */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-white">Show in Discovery</h3>
                                    <p className="text-xs text-white/60">If turned off, new users won't see your profile.</p>
                                </div>
                                <button 
                                    onClick={() => setShowInDiscovery(!showInDiscovery)}
                                    className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ${showInDiscovery ? 'bg-rose-600' : 'bg-white/20'}`}
                                >
                                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${showInDiscovery ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            {/* Toggle 2: Online Status */}
                            <div className="flex items-center justify-between border-t border-white/10 pt-6">
                                <div>
                                    <h3 className="font-bold text-white">Show Online Status</h3>
                                    <p className="text-xs text-white/60">Others will see a green dot next to your name.</p>
                                </div>
                                <button 
                                    onClick={() => setShowOnlineStatus(!showOnlineStatus)}
                                    className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ${showOnlineStatus ? 'bg-rose-600' : 'bg-white/20'}`}
                                >
                                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${showOnlineStatus ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </button>
                            </div>
                            
                            {/* Contact Details Section */}
                            <div className="border-t border-white/10 pt-6">
                                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                                    <Mail size={18} />
                                    Contact Details
                                </h3>
                                <div className="space-y-3">
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                                        <div className="text-xs text-white/60 mb-1">Email</div>
                                        <div className="text-white font-medium flex items-center gap-2">
                                            <Mail size={14} />
                                            {session?.user?.email || 'Not set'}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                                        <div className="text-xs text-white/60 mb-1">Phone Number</div>
                                        <div className="text-white font-medium flex items-center gap-2">
                                            <Phone size={14} />
                                            {profile?.phone || session?.user?.phone || 'Not set'}
                                        </div>
                                    </div>
                                    <p className="text-xs text-white/40 mt-2">
                                        These are your contact details. Email is required for account verification and password recovery.
                                    </p>
                                </div>
                            </div>
                            
                            {/* Looking For Feature */}
                            <div className="border-t border-white/10 pt-6">
                                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                                    <Heart size={18} />
                                    Looking For
                                </h3>
                                <p className="text-xs text-white/60 mb-4">Choose who you want to see in your discovery feed</p>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => {
                                            const newValue = lookingFor === 'men' ? null : 'men';
                                            setLookingFor(newValue);
                                        }}
                                        className={`w-full p-3 rounded-xl border-2 transition ${
                                            lookingFor === 'men' 
                                                ? 'bg-rose-600/20 border-rose-500 text-white' 
                                                : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">Men</span>
                                            {lookingFor === 'men' && <CheckCircle size={18} className="text-rose-400" />}
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            const newValue = lookingFor === 'women' ? null : 'women';
                                            setLookingFor(newValue);
                                        }}
                                        className={`w-full p-3 rounded-xl border-2 transition ${
                                            lookingFor === 'women' 
                                                ? 'bg-rose-600/20 border-rose-500 text-white' 
                                                : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">Women</span>
                                            {lookingFor === 'women' && <CheckCircle size={18} className="text-rose-400" />}
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            const newValue = lookingFor === 'both' ? null : 'both';
                                            setLookingFor(newValue);
                                        }}
                                        className={`w-full p-3 rounded-xl border-2 transition ${
                                            lookingFor === 'both' 
                                                ? 'bg-rose-600/20 border-rose-500 text-white' 
                                                : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">Both</span>
                                            {lookingFor === 'both' && <CheckCircle size={18} className="text-rose-400" />}
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={updatePreferences} 
                                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl border border-white/20 mt-4 transition"
                            >
                                Save Changes
                            </button>

                            {/* Share/Invite Friends Feature */}
                            <div className="border-t border-white/10 pt-6">
                                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                                    <Share size={18} />
                                    Share & Invite Friends
                                </h3>
                                <p className="text-xs text-white/60 mb-4">Invite friends to join Sacred Hearts</p>
                                <button 
                                    onClick={async () => {
                                        const shareData = {
                                            title: 'Sacred Hearts',
                                            text: 'Join me on Sacred Hearts - a platform for meaningful connections!',
                                            url: window.location.origin
                                        };
                                        
                                        try {
                                            if (navigator.share) {
                                                await navigator.share(shareData);
                                                showToast('Thanks for sharing!', 'success');
                                            } else {
                                                // Fallback: Copy link to clipboard
                                                await navigator.clipboard.writeText(shareData.url);
                                                showToast('Link copied to clipboard!', 'success');
                                            }
                                        } catch (err) {
                                            // User cancelled or error occurred
                                            if (err.name !== 'AbortError') {
                                                // Fallback: Copy link to clipboard
                                                try {
                                                    await navigator.clipboard.writeText(shareData.url);
                                                    showToast('Link copied to clipboard!', 'success');
                                                } catch (clipboardErr) {
                                                    showToast('Failed to share. Please copy the link manually.', 'error');
                                                }
                                            }
                                        }
                                    }}
                                    className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl border border-white/20 transition flex items-center justify-center gap-2"
                                >
                                    <Share size={18} />
                                    Share App
                                </button>
                            </div>
                            
                            {/* Profile Boost Feature */}
                            <div className="border-t border-white/10 pt-6">
                                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                                    <Zap size={18} />
                                    Profile Boost
                                </h3>
                                <p className="text-xs text-white/60 mb-4">Get more visibility for 24 hours</p>
                                <button 
                                    onClick={() => {
                                        if (profileBoost) {
                                            showToast("Boost already active!", 'info');
                                            return;
                                        }
                                        setConfirmModal({
                                            isOpen: true,
                                            title: "Boost Your Profile?",
                                            message: "Your profile will be shown to more people for 24 hours. This is a premium feature.",
                                            type: "info",
                                            onConfirm: async () => {
                                                try {
                                                    const expiresAt = new Date();
                                                    expiresAt.setHours(expiresAt.getHours() + 24);
                                                    await supabase.from('profiles').update({ 
                                                        boost_active: true,
                                                        boost_expires_at: expiresAt.toISOString()
                                                    }).eq('id', session.user.id);
                                                    setProfileBoost(true);
                                                    showToast("Profile boosted! 🚀", 'success');
                                                    fetchProfile(session.user.id);
                                                } catch (err) {
                                                    showToast("Error activating boost.", 'error');
                                                }
                                            }
                                        });
                                    }}
                                    className={`w-full py-3 rounded-xl font-medium transition ${
                                        profileBoost 
                                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' 
                                            : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600'
                                    }`}
                                >
                                    {profileBoost ? '⭐ Boost Active' : '🚀 Boost My Profile'}
                                </button>
                            </div>
                            
                            {/* Icebreaker Prompts */}
                            <div className="border-t border-white/10 pt-6">
                                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                                    <HelpCircle size={18} />
                                    Icebreaker Prompts
                                </h3>
                                <p className="text-xs text-white/60 mb-4">Add conversation starters to your profile</p>
                                <div className="space-y-2">
                                    {icebreakerPrompts.length === 0 ? (
                                        <p className="text-xs text-white/40 italic">No prompts yet. Add one below!</p>
                                    ) : (
                                        icebreakerPrompts.map((prompt, idx) => (
                                            <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/10 flex items-center justify-between">
                                                <p className="text-sm text-white/80 flex-1">{prompt}</p>
                                                <button 
                                                    onClick={() => {
                                                        setIcebreakerPrompts(prev => prev.filter((_, i) => i !== idx));
                                                        // Auto-save
                                                        supabase.from('profiles').update({
                                                            icebreaker_prompts: JSON.stringify(icebreakerPrompts.filter((_, i) => i !== idx))
                                                        }).eq('id', session.user.id);
                                                    }}
                                                    className="text-red-400 hover:text-red-300 ml-2"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                    <button 
                                        onClick={() => {
                                            setInputModal({
                                                isOpen: true,
                                                title: "Add Icebreaker Prompt",
                                                placeholder: "Enter a conversation starter (e.g., 'What's your favorite hobby?')",
                                                onSubmit: async (promptText) => {
                                                    if (promptText && promptText.trim()) {
                                                        const newPrompts = [...icebreakerPrompts, promptText.trim()];
                                                        setIcebreakerPrompts(newPrompts);
                                                        try {
                                                            await supabase.from('profiles').update({
                                                                icebreaker_prompts: JSON.stringify(newPrompts)
                                                            }).eq('id', session.user.id);
                                                            showToast("Prompt added!", 'success');
                                                        } catch (err) {
                                                            showToast("Error saving prompt.", 'error');
                                                        }
                                                    }
                                                }
                                            });
                                        }}
                                        className="w-full bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg border border-white/20 text-sm transition"
                                    >
                                        + Add Prompt
                                    </button>
                                </div>
                            </div>
                        </div>
                      </div>
                    )}

                    {/* PRIVACY VIEW (Lock Icon) */}
                    {view === 'privacy' && (
                      <div className="w-full max-w-md mx-auto px-4 pt-6 pb-20">
                        <div className="flex items-center justify-between mb-6 px-2">
                            <button onClick={() => setView('profile')} className="text-white/80 hover:text-rose-300"><ArrowLeft size={24}/></button>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Lock size={20} />
                                Privacy & Security
                            </h2>
                            <div className="w-6"></div>
                        </div>
                        
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-6">
                            {/* Password Change Section */}
                            <div className="border-b border-white/10 pb-6">
                                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                                    <Lock size={18} />
                                    Change Password
                                </h3>
                                <form onSubmit={handlePasswordUpdate} className="space-y-3">
                                    {/* Current Password */}
                                <div className="relative">
                                    <input 
                                        type={showOldPassword ? "text" : "password"} 
                                            placeholder="Current Password" 
                                            className="w-full p-3 pr-10 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-rose-500" 
                                        value={oldPassword} 
                                            onChange={e=>setOldPassword(e.target.value)}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowOldPassword(!showOldPassword)} 
                                            className="absolute right-3 top-3.5 text-white/60 hover:text-white transition"
                                    >
                                            {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                    {/* New Password */}
                                <div className="relative">
                                    <input 
                                        type={showNewPassword ? "text" : "password"} 
                                            placeholder="New Password" 
                                            className="w-full p-3 pr-10 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-rose-500" 
                                        value={newPassword} 
                                            onChange={e=>setNewPassword(e.target.value)}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowNewPassword(!showNewPassword)} 
                                            className="absolute right-3 top-3.5 text-white/60 hover:text-white transition"
                                        >
                                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    
                                    {/* Confirm Password */}
                                    <div className="relative">
                                        <input 
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm New Password" 
                                            className="w-full p-3 pr-10 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-rose-500" 
                                            value={confirmPassword} 
                                            onChange={e=>setConfirmPassword(e.target.value)}
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-3.5 text-white/60 hover:text-white transition"
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading} 
                                        className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-50"
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                            
                            {/* Account Actions */}
                            <div className="border-t border-white/10 pt-6 space-y-4">
                                <h3 className="font-bold text-white mb-3">Account Actions</h3>
                                
                                {/* Hide Account */}
                                <button 
                                    onClick={() => {
                                        setConfirmModal({
                                            isOpen: true,
                                            title: "Hide Account?",
                                            message: "Your profile will be hidden from discovery. You can unhide anytime.",
                                            type: "warning",
                                            onConfirm: async () => {
                                                try {
                                                    await supabase.from('profiles').update({ show_in_discovery: false }).eq('id', session.user.id);
                                                    setShowInDiscovery(false);
                                                    showToast("Account hidden.", 'success');
                                                } catch (err) {
                                                    showToast("Error hiding account.", 'error');
                                                }
                                            }
                                        });
                                    }}
                                    className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 py-3 rounded-xl font-medium border border-yellow-500/30 transition"
                                >
                                    Hide My Account
                                </button>
                                
                                {/* Delete Account */}
                                <button 
                                    onClick={() => {
                                        setConfirmModal({
                                            isOpen: true,
                                            title: "Delete Account?",
                                            message: "This action cannot be undone. All your data will be permanently deleted.",
                                            type: "danger",
                                            onConfirm: async () => {
                                                try {
                                                    // Delete user data
                                                    await supabase.from('profiles').delete().eq('id', session.user.id);
                                                    await supabase.from('matches').delete().or(`user_a_id.eq.${session.user.id},user_b_id.eq.${session.user.id}`);
                                                    await supabase.from('messages').delete().or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);
                                                    // Sign out
                                                    await supabase.auth.signOut();
                                                    showToast("Account deleted.", 'success');
                                                } catch (err) {
                                                    showToast("Error deleting account.", 'error');
                                                }
                                            }
                                        });
                                    }}
                                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 py-3 rounded-xl font-medium border border-red-500/30 transition"
                                >
                                    Delete My Account
                                </button>
                            </div>
                        </div>
                      </div>
                    )}

                    {view === 'stats' && (
                       <div className="w-full max-w-md mx-auto px-4 pt-6">
                         <h2 className="text-2xl font-bold text-gray-800 mb-6">Platform Growth</h2>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-6 rounded-2xl shadow-sm text-center border border-rose-50"><div className="text-3xl font-bold text-rose-600">{stats.users}</div><div className="text-xs text-gray-500 font-medium mt-1">Users</div></div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm text-center border border-rose-50"><div className="text-3xl font-bold text-rose-600">{stats.matches}</div><div className="text-xs text-gray-500 font-medium mt-1">Matches</div></div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm text-center border border-rose-50 col-span-2"><div className="text-3xl font-bold text-rose-600">{stats.messages}</div><div className="text-xs text-gray-500 font-medium mt-1">Messages</div></div>
                         </div>
                         <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100"><p className="text-sm text-blue-500 font-medium text-center">💡 Tip: Refresh this tab to see real-time growth.</p></div>
                      </div>
                    )}
                    {view === 'chat' && activeChatProfile && (
                        <div className="fixed inset-0 z-[60] bg-gray-900 flex flex-col h-full sm:max-w-md sm:mx-auto sm:my-4 sm:rounded-2xl sm:border sm:border-gray-700 sm:shadow-2xl sm:h-[90vh] sm:relative sm:inset-auto">
                             <div className="bg-rose-600 text-white p-4 flex items-center justify-between shadow-sm">
                                 <div className="flex items-center gap-3 flex-grow min-w-0">
                                    <button onClick={() => setView('matches')}><ArrowLeft size={24}/></button>
                                    <button 
                                        onClick={() => {
                                            // Set the target profile to view
                                            setTargetProfile(activeChatProfile);
                                            setView('profile-view');
                                        }}
                                        className="relative cursor-pointer"
                                    >
                                        <img 
                                            src={activeChatProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChatProfile.full_name}`} 
                                            className="w-10 h-10 rounded-full border-2 border-white hover:opacity-80 transition" 
                                        />
                                        {onlineUsers.includes(activeChatProfile.id) && (
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-rose-600 rounded-full"></div>
                                        )}
                                    </button>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold truncate">{activeChatProfile.full_name}</span>
                                            {onlineUsers.includes(activeChatProfile.id) && (
                                                <span className="text-[10px] font-bold text-green-200">Online</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-rose-200 truncate mt-0.5 flex items-center gap-1">
                                            <MapPin size={10} /> {activeChatProfile.city}
                                        </div>
                                    </div>
                                 </div>
                                  <div className="flex items-center gap-2 ml-2 shrink-0">
                                    {/* Audio Call Button */}
                                    <button 
                                      onClick={() => showToast("Audio call feature coming soon!", 'success')}
                                      className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition shadow-sm border border-white/10" 
                                      title="Audio Call"
                                    >
                                      <Phone size={16} />
                                    </button>
                                    
                                    {/* Video Call Button */}
                                    <button 
                                      onClick={() => showToast("Video call feature coming soon!", 'success')}
                                      className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition shadow-sm border border-white/10" 
                                      title="Video Call"
                                    >
                                      <Video size={16} />
                                    </button>
                                    
                                    {/* Report Button */}
                                  <button 
                                    onClick={() => {
                                        setSelectedReportCategory('');
                                      setInputModal({
                                        isOpen: true,
                                        title: "Report User",
                                          placeholder: "Please provide additional details...",
                                          showCategorySelect: true,
                                          categories: reportCategories,
                                          onSubmit: async (details) => {
                                            if (!selectedReportCategory) {
                                              showToast("Please select a category.", 'error');
                                              return;
                                            }
                                          try {
                                              await supabase.from('reports').insert({ 
                                                  reporter_id: session.user.id, 
                                                  reported_id: activeChatProfile.id, 
                                                    reason: selectedReportCategory,
                                                    message: details || "User reported via chat interface" 
                                              }).then(() => { 
                                                  showToast("Report submitted.", 'success');
                                              }).catch((err) => { 
                                                  showToast("Error reporting user."); 
                                              }); 
                                          } catch (err) {
                                              showToast("Error reporting user.");
                                          }
                                        }
                                      })
                                    }}
                                      className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold px-2 py-1.5 rounded-full transition shadow-sm flex items-center gap-1.5 border border-white/10" 
                                      title="Report User"
                                  >
                                    <AlertTriangle size={12} /> Report
                                  </button>
                                  </div>
                             </div>
                             
                             {/* --- MESSAGES SCROLL AREA --- */}
                             <div className="flex-grow overflow-y-auto p-4 bg-gray-50 space-y-3 chat-scroll">
                                {chatMessages.map((msg) => {
                                      
                                      // --- 1. DEFINE VARIABLES FOR EACH MESSAGE ---
                                      const isMe = msg.sender_id === session.user.id;
                                      const isImage = msg.type === 'image' || msg.content.startsWith('http');
                                      const isAudio = msg.type === 'audio';

                                      return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            
                                            {/* --- MESSAGE BUBBLE --- */}
                                            <div 
                                              onClick={() => handleSelectMessage(msg.id)}
                                              className={`max-w-[75%] rounded-2xl text-sm flex flex-col relative transition-all duration-200 ${
                                                  isMe ? 'bg-rose-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                              } ${isImage ? 'bg-transparent border-none p-0' : (isAudio ? 'p-2' : 'px-4 py-2')} 
                                              
                                              // --- STYLING IF SELECTED ---
                                              ${selectedMessageId === msg.id ? 'ring-4 ring-rose-300 opacity-90 scale-[0.98]' : ''}
                                            }`}> 
                                                  
                                                {/* --- REPLY INDICATOR --- */}
                                                {msg.replied_to_id && (
                                                    <div className="text-[10px] opacity-70 mb-1 border-b border-white/30 pb-1 flex items-center gap-1 w-full">
                                                       <CornerUpLeft size={10} /> Replying to a message
                                                    </div>
                                                )}

                                                {/* --- CONTENT --- */}
                                                {isAudio ? (
                                                    <audio controls src={msg.content} className="w-48 max-w-full">
                                                        Your browser does not support audio element.
                                                    </audio>
                                                ) : isImage ? (
                                                    <img 
                                                        src={msg.content} 
                                                        alt="Sent photo" 
                                                        className="rounded-2xl max-w-full object-cover shadow-sm border border-gray-100"
                                                    />
                                                ) : (
                                                    <div className="break-words">{msg.content}</div>
                                                )}

                                                {/* --- ENHANCED READ RECEIPTS (Double Checkmarks) --- */}
                                                {isMe && !isImage && !isAudio && (
                                                    <div className="flex justify-end items-center gap-1 mt-2 opacity-70">
                                                        <span className="text-[9px] text-white/60">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                        <div className="flex items-center gap-0.5">
                                                            {msg.read_at ? (
                                                                <div className="flex items-center gap-0.5">
                                                                    <CheckCheck size={14} className="text-blue-400" strokeWidth={2.5}/>
                                                                    <span className="text-[9px] font-medium text-blue-400">Read</span>
                                                                </div>
                                                            ) : (
                                                                <Check size={12} className="text-gray-400"/>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}                                        
                                            </div>
                                        </div>
                                      )
                                    })}
                                    <div ref={messagesEndRef}></div>
                             </div>

                             {/* --- WHATSAPP STYLE ACTION SHEET --- */}
                             {selectedMessageId && (() => {
                                  const msg = chatMessages.find(m => m.id === selectedMessageId);
                                  if (!msg) return null;

                                  // --- LOCAL VARIABLES FOR ACTION SHEET ---
                                  const isMe = msg.sender_id === session.user.id;
                                  const isImage = msg.type === 'image' || msg.content.startsWith('http');
                                  const isAudio = msg.type === 'audio';

                                  return (
                                    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] p-4 z-50 animate-fade-in-up">
                                      
                                          {/* Header */}
                                          <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Selected Message</span>
                                            <button onClick={() => setSelectedMessageId(null)} className="text-gray-400 hover:text-gray-600">
                                              <X size={20} />
                                            </button>
                                          </div>

                                          {/* Action Buttons */}
                                          <div className="flex justify-around items-center">
                                            
                                            {/* 1. REPLY */}
                                            <button onClick={() => handleReplyAction(msg)} className="flex flex-col items-center gap-1.5 text-gray-600 hover:text-rose-600 transition">
                                              <div className="p-3 rounded-full bg-gray-100 hover:bg-rose-50">
                                                <CornerUpLeft size={22} />
                                              </div>
                                              <span className="text-[10px] font-medium">Reply</span>
                                            </button>

                                            {/* 2. FORWARD */}
                                            <button onClick={handleForwardAction} className="flex flex-col items-center gap-1.5 text-gray-600 hover:text-rose-600 transition">
                                              <div className="p-3 rounded-full bg-gray-100 hover:bg-rose-50">
                                                <Share size={22} />
                                              </div>
                                              <span className="text-[10px] font-medium">Forward</span>
                                            </button>

                                            {/* 3. COPY (Only if text) */}
                                            {!isImage && !isAudio && (
                                              <button onClick={() => handleCopyText(msg.content)} className="flex flex-col items-center gap-1.5 text-gray-600 hover:text-rose-600 transition">
                                                <div className="p-3 rounded-full bg-gray-100 hover:bg-rose-50">
                                                  <Copy size={22} />
                                                </div>
                                                <span className="text-[10px] font-medium">Copy</span>
                                              </button>
                                            )}

                                            {/* 4. REPORT */}
                                            <button onClick={() => handleReportAction(msg)} className="flex flex-col items-center gap-1.5 text-gray-600 hover:text-rose-600 transition">
                                              <div className="p-3 rounded-full bg-gray-100 hover:bg-rose-50">
                                                <Flag size={22} />
                                              </div>
                                              <span className="text-[10px] font-medium">Report</span>
                                            </button>

                                            {/* 5. DELETE (Only if sent by me) */}
                                            {isMe && (
                                              <button onClick={() => handleDeleteAction(msg.id)} className="flex flex-col items-center gap-1.5 text-red-500 hover:text-red-600 transition">
                                                <div className="p-3 rounded-full bg-red-50 hover:bg-red-100">
                                                  <Trash2 size={22} />
                                                </div>
                                                <span className="text-[10px] font-medium">Delete</span>
                                              </button>
                                            )}

                                          </div>
                                    </div>
                                  );
                             })()}
                             
                             {/* --- INPUT AREA --- */}
                             <div className="p-3 border-t bg-white flex flex-col gap-2">
                                {/* --- TYPING STATUS --- */}
                                <div className="flex justify-between items-center w-full mb-1">
                                    <div></div> {/* Spacer to balance layout */}
                                    {partnerIsTyping && (
                                        <div className="text-xs text-rose-600 font-medium animate-pulse flex items-center gap-1">
                                            <span>User is typing...</span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* --- REPLY PREVIEW BAR --- */}
                                {replyingTo && (
                                      <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-lg p-2 mb-2 animate-fade-in-up">
                                          <div className="flex items-center gap-2 overflow-hidden">
                                              <div className="bg-rose-200 text-rose-700 rounded-full p-1">
                                                  <CornerUpLeft size={12} />
                                              </div>
                                              <span className="text-xs text-rose-800 font-medium truncate max-w-[200px]">
                                                  Replying to: {replyingTo.content}
                                              </span>
                                          </div>
                                          <button onClick={() => setReplyingTo(null)} className="text-rose-500 hover:text-rose-700 p-1">
                                              <X size={14} />
                                          </button>
                                      </div>
                                )}
                                
                                {/* --- MAIN INPUT CONTROLS --- */}
                                <div className="flex items-center gap-2 w-full">
                                    {/* Show camera on left when input is empty */}
                                    {!inputText.trim() && (
                                        <>
                                            {/* Camera (Take Photo) - Left side */}
                                            <label htmlFor="chat-camera-upload" className="cursor-pointer text-gray-400 hover:text-rose-500 transition p-2 flex-shrink-0">
                                                <Camera size={20} />
                                            </label>
                                            <input 
                                                type="file" 
                                                id="chat-camera-upload" 
                                                className="hidden" 
                                                accept="image/*" 
                                                capture="user" 
                                                onChange={handleImageSend}
                                            />
                                        </>
                                    )}

                                    <textarea 
                                        ref={chatInputRef}
                                        rows="1" 
                                        className="flex-grow rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-rose-100 resize-none overflow-hidden bg-gray-50" 
                                        placeholder="Type a message..." 
                                        value={inputText} 
                                        onChange={handleInputChange} 
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }} } 
                                    />
                                    
                                    {/* Show Mic and Gallery on right when input is empty, otherwise show Send button */}
                                    {!inputText.trim() ? (
                                        <>
                                            {/* Gallery (Select from Gallery) - Right side */}
                                            <label htmlFor="chat-gallery-upload" className="cursor-pointer text-gray-400 hover:text-rose-500 transition p-2 flex-shrink-0">
                                                <ImageIcon size={20} />
                                            </label>
                                            <input 
                                                type="file" 
                                                id="chat-gallery-upload" 
                                                className="hidden" 
                                                accept="image/*" 
                                                onChange={handleImageSend}
                                            />
                                            
                                            {/* HOLD TO RECORD (Mic) - Right side */}
                                            <button 
                                                onPointerDown={startRecording}
                                                onPointerUp={stopRecording}
                                                disabled={!activeChatProfile}
                                                className={`p-2 rounded-full transition flex-shrink-0 ${
                                                    isRecording 
                                                        ? 'bg-red-500 text-white animate-pulse' 
                                                        : 'text-gray-400 hover:text-rose-500'
                                                }`}
                                                aria-label="Hold to Record"
                                            >
                                                <Mic size={20} />
                                            </button>
                                        </>
                                    ) : (
                                        /* Send button (Heart) - Only shows when typing */
                                        <button 
                                            onClick={sendMessage} 
                                            className="bg-rose-600 text-white p-2.5 rounded-full shadow-md hover:bg-rose-700 active:scale-95 transition flex-shrink-0"
                                        >
                                            <Heart size={20} fill="white" />
                                        </button>
                                    )}
                                </div>
                             </div>
                        </div>
                      )}
                        
                    {/* NEW: Beautiful Profile View with Carousel */}
                    {view === 'profile-view' && targetProfile && (
                      <div className="w-full max-w-md mx-auto bg-white min-h-screen shadow-xl pb-20 animate-fade-in-up">
                          
                        {/* --- IMAGE CAROUSEL --- */}
                        <div className="relative w-full aspect-[3/4] bg-gray-200 overflow-hidden group">
                            
                            {/* Calculate Images Array */}
                            {(() => {
                                const images = [
                                    targetProfile.avatar_url, 
                                    targetProfile.avatar_url_2, 
                                    targetProfile.avatar_url_3
                                ].filter(Boolean); // Remove nulls

                                return (
                                    <>
                                        {/* Main Image */}
                                        <img 
                                            src={images[profileViewImgIndex] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetProfile.full_name}`} 
                                            className="w-full h-full object-cover transition-transform duration-500"
                                        />
                                        
                                        {/* Navigation Arrows (Only show if > 1 image) */}
                                        {images.length > 1 && (
                                            <>
                                                <button onClick={() => setProfileViewImgIndex((prev) => (prev + 1) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg text-gray-800"><ChevronLeft size={20} /></button>
                                                <button onClick={() => setProfileViewImgIndex((prev) => (prev - 1 + images.length) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg text-gray-800"><ChevronRight size={20} /></button>
                                            </>
                                        )}

                                        {/* Dots Indicator */}
                                        {images.length > 1 && (
                                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                                {images.map((_, idx) => (
                                                    <div key={idx} className={`w-2 h-2 rounded-full transition ${idx === profileViewImgIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />
                                                ))}
                                            </div>
                                        )}

                                        {/* Back Button Overlay */}
                                        <button onClick={() => setView('discovery')} className="absolute top-4 left-4 bg-black/20 hover:bg-black/40 backdrop-blur-md p-2 rounded-full text-white transition"><ArrowLeft size={20} /></button>
                                    </>
                                )
                            })()}
                        </div>

                        {/* --- PROFILE DETAILS (Slide Up Style) --- */}
                        <div className="relative -mt-6 bg-white rounded-t-3xl px-6 pt-8 pb-8 shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
                            
                            <div className="flex justify-between items-start mb-4">
                                <div className="relative">
                                    
                                    {/* --- NEW: STORY RING --- */}
                                    {targetHasStory && (
                                        <div className="absolute -top-1 -right-1 w-24 h-24 rounded-full border-4 border-rose-500 z-10 pointer-events-none">
                                            {/* This creates a ring effect around avatar */}
                                        </div>
                                    )}
                                    {/* --- AVATAR --- */}
                                    <div className="relative">
                                        {/* --- NEW: STORY RING --- */}
                                        {targetHasStory && (
                                            <div className="absolute inset-0 rounded-full p-[3px] bg-gradient-to-tr from-rose-400 via-pink-500 to-orange-400 z-0 scale-105"></div>
                                        )}
                                        
                                        {/* --- IMAGE CONTAINER --- */}
                                        <div className={`w-24 h-24 rounded-full border-2 overflow-hidden bg-gray-200 ${targetHasStory ? 'border-white' : 'border-gray-200'}`}>
                                            <img 
                                                src={targetProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetProfile.full_name}`} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">{targetProfile.full_name}</h2>
                                        {targetProfile.is_verified && (
                                            <div className="bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center" title="Verified Account">
                                                <Check size={8} className="text-white" strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-rose-600 font-medium text-sm flex items-center gap-1 mt-1">
                                        <MapPin size={14} /> {targetProfile.city}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-serif font-bold text-gray-800">
                                        {targetProfile.date_of_birth ? calculateAge(targetProfile.date_of_birth) : ''}
                                    </div>
                                    <div className="text-xs text-gray-400 uppercase tracking-widest">Age</div>
                                </div>
                            </div>

                            {/* --- STATS GRID (New Feature) --- */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
                                    <span className="block text-2xl font-bold text-rose-600">{targetProfile.height ? targetProfile.height + 'cm' : '-'}</span>
                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Height</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
                                    <span className="block text-2xl font-bold text-rose-600">{targetProfile.weight ? targetProfile.weight + 'kg' : '-'}</span>
                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Weight</span>
                                </div>
                            </div>
                            {/* --- NEW: Occupation --- */}
                            {targetProfile.occupation && (
                                <div className="mb-4">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-1">Occupation</h3>
                                    <p className="text-gray-800 font-medium">{targetProfile.occupation}</p>
                                </div>
                            )}

                            <div className="flex gap-2 mb-6">
                                 <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100">{targetProfile.religion}</span>
                                 <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">{targetProfile.intent}</span>
                            </div>

                            {/* --- NEW: Hobbies Grid --- */}
                            {targetProfile.hobbies && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">Interests</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {targetProfile.hobbies.split(',').filter(Boolean).map((hobby, idx) => (
                                            <span key={idx} className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100">
                                                {hobby}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {targetProfile.bio && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">About Me</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        "{targetProfile.bio}"
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                {/* Only show Connect button if users are NOT already matched/connected */}
                                {!isTargetProfileMatched && (
                                    <button 
                                        onClick={() => { setView('discovery'); handleConnect(); }} 
                                        disabled={loading}
                                        className="flex-1 bg-rose-600 text-white font-bold py-3.5 rounded-2xl hover:bg-rose-700 transition active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Heart size={20} fill="white" /> Connect
                                    </button>
                                )}
                            </div>
                        </div>
                      </div>
                    )}
                  
                  </main>
                  {view !== 'chat' && !showFilters && (<DashboardFooter currentView={view} setView={setView} />)}
                  {showFilters && (
                    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50">
                      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-fade-in-up shadow-2xl">
                        <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-gray-900">Filter Discovery</h3><button onClick={() => setShowFilters(false)} className="text-gray-400"><X size={24}/></button></div>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Demographics</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-gray-500 mb-1 font-bold">Min Age</label>
                                        <select className="w-full p-2.5 text-sm border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition [&>option]:text-gray-800" value={filterMinAge || ""} onChange={(e) => setFilterMinAge(e.target.value)}>
                                            <option value="">Any</option>
                                            {Array.from({length: 60}, (_, i) => i + 18).map(age => (
                                                <option key={age} value={age}>{age}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 mb-1 font-bold">Max Age</label>
                                        <select className="w-full p-2.5 text-sm border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition [&>option]:text-gray-800" value={filterMaxAge || ""} onChange={(e) => setFilterMaxAge(e.target.value)}>
                                            <option value="">Any</option>
                                            {Array.from({length: 60}, (_, i) => i + 18).map(age => (
                                                <option key={age} value={age}>{age}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] text-gray-500 mb-1 font-bold">Religion</label>
                                        <select className="w-full p-2.5 text-sm border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition [&>option]:text-gray-800" value={filterReligion} onChange={(e) => setFilterReligion(e.target.value)}>
                                            <option value="">All Religions</option>
                                            <option value="Christian">Christian</option>
                                            <option value="Muslim">Muslim</option>
                                            <option value="Others">Others</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* --- Location --- */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Location</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                         <label className="text-[10px] text-gray-500 mb-1 font-bold">City</label>
                                        <select className="w-full p-2.5 text-sm border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition [&>option]:text-gray-800" value={filterCity} onChange={(e) => setFilterCity(e.target.value)}><option value="">All Cities</option><option value="Accra">Accra</option><option value="Kumasi">Kumasi</option><option value="Tema">Tema</option><option value="Tamale">Tamale</option><option value="Cape Coast">Cape Coast</option><option value="Takoradi">Takoradi</option><option value="Sunyani">Sunyani</option><option value="Ho">Ho</option><option value="Wa">Wa</option><option value="Techiman">Techiman</option><option value="Goaso">Goaso</option><option value="Nalerigu">Nalerigu</option><option value="Sefwi Wiaso">Sefwi Wiaso</option><option value="Damango">Damango</option><option value="Dambai">Dambai</option><option value="Bolgatanga">Bolgatanga</option></select>
                                    </div>
                                    <div>
                                         <label className="text-[10px] text-gray-500 mb-1 font-bold">Distance</label>
                                                          <select className="w-full p-2.5 text-sm border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition [&>option]:text-gray-800" value={filterDistance || ""} onChange={(e) => setFilterDistance(e.target.value)}><option value="">Any Distance</option><option value="10">Within 10 km</option><option value="25">Within 25 km</option><option value="50">Within 50 km</option><option value="100">Within 100 km</option></select>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => { 
                                setShowFilters(false); 
                                // Save to LocalStorage
                                localStorage.setItem('sacred_min_age_filter', filterMinAge);
                                localStorage.setItem('sacred_max_age_filter', filterMaxAge);
                                fetchCandidates(session.user.id, profile.gender, profile); 
                            }} className="w-full bg-rose-600 text-white font-bold py-3 rounded-lg shadow-lg">
                                Apply Filters
                            </button>
                        </div>
                      </div>
                    </div> 
                    )}    

                    {viewingStory && (
                      <StoryOverlay 
                          story={viewingStory} 
                          onClose={closeStory} 
                      />
                    )}


                    {/* --- CUSTOM MODALS --- */}
                    <ConfirmModal 
                        isOpen={confirmModal.isOpen}
                        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                        onConfirm={confirmModal.onConfirm}
                        title={confirmModal.title}
                        message={confirmModal.message}
                        type={confirmModal.type}
                    />
                    
                    <InputModal
                        isOpen={inputModal.isOpen}
                        onClose={() => setInputModal({ ...inputModal, isOpen: false })}
                        onSubmit={inputModal.onSubmit}
                        title={inputModal.title}
                        placeholder={inputModal.placeholder}
                        showCategorySelect={inputModal.showCategorySelect}
                        categories={inputModal.categories}
                        selectedCategory={selectedReportCategory}
                        onCategoryChange={setSelectedReportCategory}
                    />
                </div> 
              )}      
            </>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

function calculateAge(dateString) { if (!dateString) return ""; const today = new Date(); const birthDate = new Date(dateString); let age = today.getFullYear() - birthDate.getFullYear(); const m = today.getMonth() - birthDate.getMonth(); if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age-- } return age }

// --- HELPER COMPONENT: Full Screen Loader ---
const Loader = () => {
  // --- State to track if logo has loaded ---
  const [isLogoLoaded, setIsLogoLoaded] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">

      {/* 2. Custom Logo (Triggers Load) */}
      <img 
        src={logo} 
        onLoad={() => setIsLogoLoaded(true)} // Set state to true when image is ready
        className="h-40 w-full max-w-[250px] object-contain animate-pulse" 
      />
    </div>

  );
};

export default App;