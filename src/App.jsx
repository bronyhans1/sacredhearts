import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import { Heart, LogOut, ArrowLeft, Lock, Eye, EyeOff, X, Check, CheckCheck, AlertTriangle, Edit, MapPin, Save, MessageCircle, Flame, Users, ChevronLeft, ChevronRight, Camera, Settings, Mic, Activity, Plus, CheckCircle, User, Mail, Calendar, CornerUpLeft, Trash2, Copy, Flag, Share, Phone, Video, Image as ImageIcon, Clock, Shield, Zap, Star, HelpCircle, BadgeCheck } from 'lucide-react'
 

import logo from './assets/logo.webp';
import StoryOverlay from './components/StoryOverlay';
import ImageCropModal from './components/ImageCropModal';
import loginImg from './assets/loginimg.webp'; 

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
import VerifiedBadge from './components/VerifiedBadge';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import CommunityGuidelines from './components/CommunityGuidelines';
import VerifyScreen from './components/VerifyScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import SetNewPasswordScreen from './components/SetNewPasswordScreen';
import UsernameStep from './components/UsernameStep';
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
  const [username, setUsername] = useState('')
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
  
  // Username availability check state
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid'
  const usernameCheckTimeout = useRef(null);
  const usernameCheckRequestId = useRef(0); // Track request ID to ignore stale responses

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
  // Date format helper - normalize to YYYY-MM-DD (database format)
  // We use YYYY-MM-DD throughout the app to match database
  const normalizeDateFormat = (dateStr) => {
    if (!dateStr) return '';
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // If in DD-MM-YYYY format, convert to YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 2) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    // If in other format, try to parse
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
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
  
  // Image crop modal state
  const [showCropModal, setShowCropModal] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState(null)
  const [cropImageSlot, setCropImageSlot] = useState(null) // 'avatar_url', 'avatar_url_2', 'avatar_url_3'

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
  const [isTextareaExpanded, setIsTextareaExpanded] = useState(false) // Track if textarea is expanded (more than 1 line)
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
  const [preMatchMessageCount, setPreMatchMessageCount] = useState(0); // Track messages sent before matching
  const [longPressTimer, setLongPressTimer] = useState(null); // For long-press detection
  
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
  const [viewingStories, setViewingStories] = useState([]);
  const [viewedStoryViews, setViewedStoryViews] = useState([]); // { story_id, story_owner_id } for start-from-first-unviewed + ring styling
  const [initialStoryIndex, setInitialStoryIndex] = useState(0);

    // --- NEW: Audio Recorder State ---
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const [audioLevels, setAudioLevels] = useState([]); // For waveform visualization
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  //Global Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Unread message count for matches tab badge (total across all matches)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Image Preview States (WhatsApp-style)
  const [cameraPreview, setCameraPreview] = useState(null); // Single image from camera
  const [galleryPreview, setGalleryPreview] = useState([]); // Multiple images from gallery
  const [imageQuality, setImageQuality] = useState('hd'); // 'hd' or 'low'
  const [sendingImages, setSendingImages] = useState({}); // Track sending status: { imageId: 'sending' | 'sent' | 'error' }


  // Refs
  const typingTimeout = useRef(null)
  const partnerTypingTimeout = useRef(null)
  const messagesEndRef = useRef(null)
  const chatInputRef = useRef(null)
  const lastOpenedChatId = useRef(null)
  const realtimeChannel = useRef(null)
  const messageChannelRef = useRef(null)
  const pushSetupAttemptedForUser = useRef(null)

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
        // Don't reset form state here - let fetchProfile load the data first
        // resetFormState() will clear fields that fetchProfile is trying to load
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
          // Don't reset form state - fetchProfile will load existing data or metadata
          // Only reset on SIGN_OUT event, not on SIGN_IN
          fetchProfile(session.user.id);
        } else {
          // Only reset on logout/sign out
          pushSetupAttemptedForUser.current = null;
          resetFormState();
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

  // Profile is complete when all required fields are filled (must complete before using app)
  const isProfileComplete = (p) => {
    if (!p) return false;
    const hasHobbies = p.hobbies != null && (Array.isArray(p.hobbies) ? p.hobbies.length > 0 : String(p.hobbies || '').trim().length > 0);
    const hasHeight = p.height != null && String(p.height).trim() !== '';
    const hasWeight = p.weight != null && String(p.weight).trim() !== '';
    return Boolean(
      p.username && p.gender && p.date_of_birth && p.city && p.avatar_url &&
      hasHeight && hasWeight && hasHobbies && p.religion && p.intent && (p.bio != null && String(p.bio).trim() !== '')
    );
  };

  // Gate app: redirect to setup if user tries to access main app without completing profile
  useEffect(() => {
    if (!session || !profile) return;
    if (view !== 'discovery' && view !== 'matches' && view !== 'profile' && view !== 'crushes') return;
    if (isProfileComplete(profile)) return;
    setView('setup');
    showToast('Complete your profile to continue.', 'info');
  }, [session, profile, view]);

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
              setUnreadCounts(prev => {
                const newCounts = { 
                  ...prev, 
                  [partnerId]: (prev[partnerId] || 0) + 1 
                };
                // Update total unread count
                const total = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
                setUnreadMessageCount(total);
                return newCounts;
              });
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
                      setUnreadCounts(prev => {
                        const newCounts = { 
                          ...prev, 
                          [partnerId]: Math.max(0, (prev[partnerId] || 0) - 1)
                        };
                        // Update total unread count
                        const total = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
                        setUnreadMessageCount(total);
                        return newCounts;
                      });
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
    setViewingStories([]);
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

  // Username availability check (debounced)
  useEffect(() => {
    if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current);
    
    const normalized = username.trim().toLowerCase();
    if (!normalized) {
      setUsernameStatus(null);
      return;
    }
    
    // Validate format: 3-30 chars, alphanumeric + underscore
    const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
    if (normalized.length < 3 || normalized.length > 30 || !USERNAME_REGEX.test(normalized)) {
      if (normalized.length >= 3) {
        setUsernameStatus('invalid');
      } else {
        setUsernameStatus(null);
      }
      return;
    }
    
    // Unchanged username → no status (indicator only when user is changing username)
    if (profile?.username && normalized === profile.username.toLowerCase()) {
      setUsernameStatus(null);
      return;
    }
    
    // Debounce the check with request ID to prevent race conditions
    setUsernameStatus('checking');
    const currentRequestId = ++usernameCheckRequestId.current;
    usernameCheckTimeout.current = setTimeout(async () => {
      // Check if this request is still current (not superseded by a newer one)
      if (currentRequestId !== usernameCheckRequestId.current) {
        return; // Ignore stale request
      }
      
      try {
        // Exclude current user's ID when checking availability (for profile editing)
        let query = supabase
          .from('profiles')
          .select('id')
          .eq('username', normalized);
        
        // If we have a session and profile, exclude current user
        if (session?.user?.id) {
          query = query.neq('id', session.user.id);
        }
        
        const { data, error } = await query.maybeSingle();
        
        // Check again if request is still current before updating state
        if (currentRequestId !== usernameCheckRequestId.current) {
          return; // Ignore stale response
        }
        
        if (error) {
          setUsernameStatus(null);
          return;
        }
        
        setUsernameStatus(data ? 'taken' : 'available');
      } catch {
        // Check if request is still current
        if (currentRequestId === usernameCheckRequestId.current) {
          setUsernameStatus(null);
        }
      }
    }, 400);
    
    return () => {
      if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current);
    };
  }, [username, profile?.username])    

  // --- DATA FETCHING FUNCTIONS ---
  async function uploadAvatar(file) {
    if (!file) return null;
    try {
      setUploading(true);
      
      // Show upload progress for better UX
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Upload with error handling
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Error uploading image: ' + (error.message || 'Please try again'), 'error');
      return null;
    } finally {
      setUploading(false);
    }
  }


  const handleStoryUpload = async (e) => {
    if (!session) return; // Safety check: ensure user is logged in
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

      // Determine media type
      const mediaType = file.type.startsWith('video') ? 'video' : 'image';

      // Insert into DB (Expires in 24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await supabase.from('stories').insert({
        user_id: session.user.id,
        media_url: publicUrl,
        media_type: mediaType,
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
      // Get current session - it might have been updated
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession || !currentSession.user) {
        setLoading(false);
        return;
      }
      
      // Use currentSession instead of session state to ensure we have latest data
      const session = currentSession;
      
      // Check if account is deleted BEFORE fetching profile
      // Use database function to bypass RLS issues
      let isDeleted = false;
      let deletionInfo = null;
      
      try {
        // Try using the database function first (more reliable, bypasses RLS)
        const { data: functionData, error: functionError } = await supabase
          .rpc('get_my_deleted_status');
        
        if (!functionError && functionData && functionData.length > 0) {
          isDeleted = functionData[0].is_deleted === true;
          if (isDeleted) {
            deletionInfo = {
              deletion_reason: functionData[0].deletion_reason,
              deleted_at: functionData[0].deleted_at
            };
          }
        } else if (functionError) {
          // Fallback: Try direct query if function doesn't exist or fails
          const { data, error: directError } = await supabase
            .from('deleted_accounts')
            .select('user_id, deletion_reason, deleted_at')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (!directError && data) {
            isDeleted = true;
            deletionInfo = {
              deletion_reason: data.deletion_reason,
              deleted_at: data.deleted_at
            };
          } else if (directError && directError.code !== '42501') {
            // Only non-permission errors (42501 is expected if RLS blocks it)
          }
        }
      } catch (err) {
        // Silently handle any errors - don't block login if check fails
      }
      
      if (isDeleted) {
        // Account is deleted - sign out and show message
        await supabase.auth.signOut();
        showToast("This account has been deleted. If you want to rejoin, please sign up again.", 'error');
        setLoading(false);
        return;
      }
      
      let myProfile;
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      myProfile = profileData;

      // CRITICAL: Get user metadata FIRST before checking profile
      // This ensures we have all signup data available
      // Note: Session is already checked at the start of this function (line 766)
      const userMetadata = session?.user?.user_metadata;
      
      if (profileError) {
        // IF PROFILE MISSING (New User), DO NOT SIGN OUT.
        // Instead, check if we have the data in Auth Metadata (from signup)
        if (profileError.code === 'PGRST116') {
             // New user detected - creating profile from metadata
             
             // 1. Pre-fill our React State with that metadata (so user doesn't have to refill)
             // All data from signup should be preserved
             if (userMetadata?.full_name) {
               setFullName(userMetadata.full_name);
             }
             if (userMetadata?.gender) {
               setGender(userMetadata.gender);
             }
             // Use YYYY-MM-DD format directly (matches database)
             if (userMetadata?.date_of_birth) {
               const normalizedDate = normalizeDateFormat(userMetadata.date_of_birth);
               setDateOfBirth(normalizedDate);
             }
             if (userMetadata?.phone) {
               setPhone(userMetadata.phone);
             }

             // 2. CRITICAL: Create profile immediately with ALL metadata fields
             // This ensures signup data is saved, not just name
             try {
               // Safely get email from session (used for login-by-username resolution)
               const userEmail = session?.user?.email || null;
               const userPhone = session?.user?.phone || null;
               
               const profileData = {
                 id: userId,
                 full_name: userMetadata?.full_name || (userEmail ? userEmail.split('@')[0] : 'New User'),
                 email: userEmail || null,
                 phone: userMetadata?.phone || userPhone || null,
                 gender: userMetadata?.gender || null,
                 date_of_birth: userMetadata?.date_of_birth ? normalizeDateFormat(userMetadata.date_of_birth) : null,
                 city: null,
                 region: null,
                 avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userMetadata?.full_name || 'user'}`
               };
               
               // Creating profile with signup data
               
               const { data: newProfile, error: insertError } = await supabase
                 .from('profiles')
                 .insert(profileData)
                 .select()
                 .single();

               if (insertError) {
                 console.error("❌ Error creating profile from metadata:", insertError);
                 // If insert fails due to duplicate (trigger might have created it), try to update instead
                 if (insertError.code === '23505') { // Unique violation
                   // Remove 'id' from update data (can't update primary key)
                   const { id, ...updateData } = profileData;
                   const { data: updatedProfile, error: updateError } = await supabase
                     .from('profiles')
                     .update(updateData)
                     .eq('id', userId)
                     .select()
                     .single();
                   
                   if (updateError) {
                     console.error("❌ Error updating existing profile:", updateError);
                   } else {
                     setProfile(updatedProfile);
                   }
                 } else {
                   // Continue to setup view even if insert fails - user can still complete profile
                 }
               } else {
                 // Profile created with all signup data
                 setProfile(newProfile); // Set profile so it's available
               }
             } catch (createError) {
               console.error("❌ Error creating profile:", createError);
               // Continue to username step - user can complete profile
             }

             // 3. Send to username step first (onboarding: username → images → location → setup)
             setView('username');
             setLoading(false);
             return;
        } else {
            throw profileError
        }
      }
      
      // CRITICAL FIX: If profile exists but is missing fields that are in metadata, update them IMMEDIATELY
      // This handles the case where a database trigger created a profile with only the name
      if (userMetadata && myProfile) {
        let needsUpdate = false;
        const updateFields = {};
        
        // Check if profile is missing fields that exist in metadata
        if (userMetadata.gender && !myProfile.gender) {
          setGender(userMetadata.gender);
          updateFields.gender = userMetadata.gender;
          needsUpdate = true;
        }
        if (userMetadata.date_of_birth && !myProfile.date_of_birth) {
          const normalizedDate = normalizeDateFormat(userMetadata.date_of_birth);
          setDateOfBirth(normalizedDate);
          updateFields.date_of_birth = normalizedDate;
          needsUpdate = true;
        }
        if (userMetadata.city && !myProfile.city) {
          setCity(userMetadata.city);
          updateFields.city = userMetadata.city;
          needsUpdate = true;
        }
        if (userMetadata.region && !myProfile.region) {
          updateFields.region = userMetadata.region;
          needsUpdate = true;
        }
        if (userMetadata.phone && !myProfile.phone) {
          setPhone(userMetadata.phone);
          updateFields.phone = userMetadata.phone;
          needsUpdate = true;
        }
        // NOTE: We DON'T update full_name from metadata if profile already exists
        // User should be able to update their name freely, and we shouldn't override it with metadata
        
        // CRITICAL: Update profile with metadata if fields are missing
        // This MUST happen before we continue, so the profile has all data
        if (needsUpdate) {
          try {
            const { data: updatedProfile, error: updateError } = await supabase
              .from('profiles')
              .update(updateFields)
              .eq('id', userId)
              .select()
              .single();
            
            if (updateError) {
              console.error("❌ Error updating profile with metadata:", updateError);
            } else {
              // Profile updated with metadata fields
              // Update the profile state so UI reflects the changes
              setProfile(updatedProfile);
              myProfile = updatedProfile; // Update local variable for rest of function
            }
          } catch (updateError) {
            console.error("❌ Error updating profile with metadata:", updateError);
          }
        }
      }

      // Check if account is deactivated (after profile is fetched)
      if (myProfile?.is_deactivated) {
        // Account is deactivated - show reactivation option
        // Don't sign out - allow user to reactivate
        setProfile(myProfile);
        setView('deactivated'); // New view for deactivated accounts
        setLoading(false);
        return;
      }

      const age = myProfile.date_of_birth ? calculateAge(myProfile.date_of_birth) : 0
      if (age > 0 && age < 18) {
          showToast("Access Denied: You must be at least 18 years old.")
          await supabase.auth.signOut()
          setLoading(false)
          return
      }

      // --- NEW ONBOARDING: Profile exists but no location → username → images → location → setup
      // (Handles trigger-created profiles: user signed up, trigger made a row, so we never hit "profile missing")
      if (myProfile && !myProfile.city && !myProfile.region) {
        setProfile(myProfile);
        setView('username');
        setLoading(false);
        return;
      }

      // --- Ask for Push Permission ---
      requestNotificationPermission(); 

      setProfile(myProfile)
      
      // Load all profile fields into state for editing
      if (myProfile.full_name) setFullName(myProfile.full_name);
      if (myProfile.username) setUsername(myProfile.username);
      if (myProfile.gender) setGender(myProfile.gender);
      if (myProfile.city) setCity(myProfile.city);
      if (myProfile.religion) setReligion(myProfile.religion);
      if (myProfile.denomination) setDenomination(myProfile.denomination);
      if (myProfile.intent) setIntent(myProfile.intent);
      if (myProfile.bio) setBio(myProfile.bio);
      if (myProfile.height) setHeight(String(myProfile.height));
      if (myProfile.weight) setWeight(String(myProfile.weight));
      if (myProfile.occupation) setOccupation(myProfile.occupation);
      if (myProfile.hobbies) {
        setHobbies(typeof myProfile.hobbies === 'string' ? myProfile.hobbies.split(',').filter(Boolean) : myProfile.hobbies);
      }
      
      // Load phone number
      if (myProfile.phone) setPhone(myProfile.phone);
      else if (session?.user?.phone) setPhone(session.user.phone);
      
      // Use YYYY-MM-DD format directly (matches database) - no conversion needed
      if (myProfile.date_of_birth) {
        const normalizedDate = normalizeDateFormat(myProfile.date_of_birth);
        setDateOfBirth(normalizedDate);
      } else {
        setDateOfBirth(''); // Clear if no date
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
      if(myProfile?.username) setUsername(myProfile.username)
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

      // Check if user needs to set username (only for existing users without username)
      // New signups will set username in setup form
      if (myProfile && (!myProfile?.username || myProfile.username.trim() === '') && (myProfile?.gender && myProfile?.intent)) {
        // Existing user with complete profile but no username - redirect to username step
        setView('username');
        setLoading(false);
        return;
      }

      if (!myProfile?.gender || !myProfile?.intent) {
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
      
      // 4. Fetch stories from matched users + own stories (oldest first for playback order)
      const { data, error } = await supabase
        .from('stories')
        .select('*, profiles(full_name, avatar_url)')
        .in('user_id', userIdsToFetch)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true }); // Oldest first → newest last (Instagram/WhatsApp)

      if (error) throw error;
      setStories(data || []);

      // Fetch which stories the current user has viewed (for start-from-first-unviewed + ring styling)
      const { data: views } = await supabase
        .from('story_views')
        .select('story_id, story_owner_id')
        .eq('viewer_id', session.user.id);
      setViewedStoryViews(views || []);
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

 
    // 1. Fetch Excluded IDs from blocks/discovery_exclusions
    const { data: exclusions } = await supabase
      .from('discovery_exclusions')
      .select('excluded_user_id')
      .eq('user_id', myId)
    
    const excludedIds = exclusions ? exclusions.map(e => e.excluded_user_id) : [];
    
    // 2. CRITICAL: Also fetch matched users (mutual OR pending) to exclude from discovery
    const { data: matches } = await supabase
      .from('matches')
      .select('user_a_id, user_b_id, status')
      .or(`user_a_id.eq.${myId},user_b_id.eq.${myId}`)
      .in('status', ['mutual', 'pending']);
    
    // Extract matched user IDs
    const matchedUserIds = matches ? matches.map(m => 
      m.user_a_id === myId ? m.user_b_id : m.user_a_id
    ) : [];
    
    // Combine all excluded IDs (blocks, exclusions, AND matched users)
    const allExcluded = [...new Set([...excludedIds, ...matchedUserIds])];

    // 2. Setup Query
    const hasLocation = myCurrentProfile?.lat && myCurrentProfile?.long;

    let query = supabase
      .from('profiles')
      .select('*')
      .neq('id', myId)
      .eq('is_deactivated', false) // Exclude deactivated accounts from discovery

    // Only filter by gender if NOT "New friends"
    if (!isNewFriends && targetGender) {
      query = query.eq('gender', targetGender);
    }

  // Exclude matched/blocked users from discovery
    if (allExcluded.length > 0) {
      // Use proper Supabase syntax to exclude multiple IDs
      // Convert array to comma-separated string for Supabase
      const excludedIdsString = allExcluded.map(id => `"${id}"`).join(',');
      query = query.not('id', 'in', `(${excludedIdsString})`);
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
            // CRITICAL: Double-check to filter out matched users (safety net)
            const filteredProfiles = profiles ? profiles.filter(p => !allExcluded.includes(p.id)) : [];
            
            const candidatesWithDistance = filteredProfiles
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
        else { 
          // CRITICAL: Double-check to filter out matched users (safety net)
          const filteredData = data ? data.filter(p => !allExcluded.includes(p.id)) : [];
          setCandidates(filteredData || []); 
          setCurrentIndex(0) 
        }
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

  // --- FEATURE C: Enable Push Notifications (create/save Web Push subscription) ---
  const enablePushNotifications = async (user, supabaseClient) => {
    if (!user) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      showToast('Push notifications not configured (missing VAPID key).', 'error');
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();
      let isNewSubscription = false;

      if (!subscription) {
        const padding = '='.repeat((4 - (vapidKey.length % 4)) % 4);
        const base64 = (vapidKey + padding).replace(/-/g, '+').replace(/_/g, '/');
        const applicationServerKey = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
        isNewSubscription = true;
      }

      const token = JSON.stringify(subscription.toJSON());
      const { error } = await supabaseClient
        .from('push_tokens')
        .upsert(
          { user_id: user.id, token, platform: 'web' },
          { onConflict: 'user_id,platform' }
        );
      if (error) throw error;
      if (isNewSubscription) {
        showToast('Notifications enabled. You\'ll get alerts for messages and likes.', 'success');
      }
    } catch (err) {
      showToast('Could not enable notifications. Try again later.', 'error');
    }
  };

  const requestNotificationPermission = async () => {
    if (session?.user) await enablePushNotifications(session.user, supabase);
  };

  // Run push setup once when user is available (after login)
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid || pushSetupAttemptedForUser.current === uid) return;
    pushSetupAttemptedForUser.current = uid;
    enablePushNotifications(session.user, supabase);
  }, [session?.user?.id]);

  // --- FEATURE A: Fetch Visitors (FIXED VERSION) ---
  const fetchVisitors = async () => {
    if (!session) return;
    try {
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
        // Calculate total unread message count
        const totalUnread = Object.values(counts).reduce((sum, count) => sum + count, 0);
        setUnreadMessageCount(totalUnread);
    } catch (error) {
        console.error("Critical error in fetchMyMatches:", error)
        setMyMatches([]); setPartnerProfiles([]); setUnreadCounts({})
        setUnreadMessageCount(0);
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
        } catch (err) {}
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
      } catch (err) {}
    }
  };

  // --- UPDATED: Handle Like / Unlike (Toggle) ---
  // --- NEW: Super Like Handler ---
  const handleSuperLike = async (targetId) => {
    if (actionLoadingId) return;
    setActionLoadingId(targetId);
    
    const isCurrentlySuperLiked = superLikes.includes(targetId);
    
    try {
      // First, check if super_likes table exists by trying to query it
      const { error: tableCheckError } = await supabase
        .from('super_likes')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        console.error("Super likes table check error:", tableCheckError);
        if (tableCheckError.code === '42P01' || tableCheckError.message.includes('does not exist')) {
          showToast("Super like feature is not available yet. Please contact support.", 'error');
          return;
        }
        throw tableCheckError;
      }
      
      if (isCurrentlySuperLiked) {
        // Remove super like
        const { error: deleteError } = await supabase
          .from('super_likes')
          .delete()
          .match({
            liker_id: session.user.id,
            liked_id: targetId
          });
        
        if (deleteError) throw deleteError;
        
        setSuperLikes(prev => prev.filter(id => id !== targetId));
        showToast("Super like removed.", 'success');
      } else {
        // Add super like
        const { error: insertError } = await supabase
          .from('super_likes')
          .insert({
            liker_id: session.user.id,
            liked_id: targetId
          });
        
        if (insertError) {
          // Check if it's a duplicate error (unique constraint)
          if (insertError.code === '23505' || insertError.message.includes('duplicate')) {
            showToast("You've already super liked this user.", 'info');
            return;
          }
          throw insertError;
        }
        
        setSuperLikes(prev => [...prev, targetId]);
        showToast("⭐ Super Liked! They'll see a special notification.", 'success');
      }
    } catch (err) {
      // Safely extract error message (avoid cyclic structure issues)
      // Don't use console.error with the full error object as it may contain React elements
      let errorMessage = "Error processing super like.";
      
      try {
        if (err) {
          if (typeof err.message === 'string') {
            errorMessage = err.message;
          } else if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (typeof err === 'string') {
            errorMessage = err;
          } else if (err.code) {
            errorMessage = `Error code: ${err.code}`;
          } else if (err.hint) {
            errorMessage = err.hint;
          } else if (err.details) {
            errorMessage = err.details;
          }
        }
      } catch (parseErr) {
        // If even extracting the error fails, use default message
        errorMessage = "Error processing super like.";
      }
      
      // Only log safe error info (no React elements)
      if (err && typeof err === 'object' && !err.message && !err.error) {
        console.error("Super like error code:", err.code || 'unknown');
      }
      
      showToast(errorMessage, 'error');
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
    // Show crop modal for main avatar too
    const imageUrl = URL.createObjectURL(file);
    setCropImageSrc(imageUrl);
    setCropImageSlot('avatar_url');
    setShowCropModal(true);
    e.target.value = ''; // Reset input
  };
  
  // Handle crop complete callback
  const handleCropComplete = (croppedFile) => {
    if (!croppedFile || !cropImageSlot) return;
    
    // Determine which slot to update based on cropImageSlot
    if (cropImageSlot === 'avatar_url') {
      setAvatarFile(croppedFile);
      setPreviewUrl(URL.createObjectURL(croppedFile));
    } else if (cropImageSlot === 'avatar_url_2') {
      setAvatarFile2(croppedFile);
      setPreviewUrl2(URL.createObjectURL(croppedFile));
    } else if (cropImageSlot === 'avatar_url_3') {
      setAvatarFile3(croppedFile);
      setPreviewUrl3(URL.createObjectURL(croppedFile));
    }
    
    // Clean up
    if (cropImageSrc && cropImageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(cropImageSrc);
    }
    setCropImageSrc(null);
    setCropImageSlot(null);
  };
  
  // Handle crop modal close (user skipped or closed)
  const handleCropClose = () => {
    // Clean up blob URL
    if (cropImageSrc && cropImageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(cropImageSrc);
    }
    setShowCropModal(false);
    setCropImageSrc(null);
    setCropImageSlot(null);
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
        const { emailOrUsername, password, rememberMe } = formData;
        const input = (emailOrUsername || '').trim();

        // Helper function to format phone to E.164 (Ghana +233 default)
        const formatPhoneToE164 = (phone) => {
          let cleaned = phone.replace(/[^\d+]/g, '');
          if (!cleaned.startsWith('+')) {
            // Remove leading zero if present
            cleaned = cleaned.replace(/^0/, '');
            // Add Ghana country code if not present
            if (!cleaned.startsWith('233')) {
              cleaned = '+233' + cleaned;
            } else {
              cleaned = '+' + cleaned;
            }
          }
          // Validate minimum length (country code + at least 7 digits)
          if (cleaned.length < 10) {
            throw new Error('Phone number too short');
          }
          return cleaned;
        };

        // Detect input type: email (@), phone (+), or username (check username first to avoid numeric username conflicts)
        let loginIdentifier = null; // 'email' | 'phone' | 'username'
        let email = null;
        let phone = null;
        
        if (input.includes('@')) {
          // Email - definitely email
          loginIdentifier = 'email';
          email = input;
        } else if (input.startsWith('+')) {
          // Phone - starts with + is definitely a phone number
          try {
            loginIdentifier = 'phone';
            phone = formatPhoneToE164(input);
          } catch (formatError) {
            showToast('Invalid phone number format. Please use format: +233XXXXXXXXX', 'error');
            setLoading(false);
            return;
          }
        } else {
          // Could be username OR phone (numeric). Check username first to avoid conflicts
          const un = input.toLowerCase().trim();
          if (!un) {
            showToast('Please enter your email, username, or phone number.', 'error');
            setLoading(false);
            return;
          }
          
          // Try username lookup first (handles numeric usernames correctly)
          const { data: profileByUsername, error: lookupErr } = await supabase
            .from('profiles')
            .select('id, email, phone')
            .eq('username', un)
            .maybeSingle();
          
          if (lookupErr) {
            console.error('Username lookup error:', lookupErr);
            showToast('Something went wrong. Please try again.', 'error');
            setLoading(false);
            return;
          }
          
          if (profileByUsername) {
            // Username found - get email from profiles
            if (profileByUsername.email) {
              // Email exists in profiles table - use it
              loginIdentifier = 'username';
              email = profileByUsername.email;
            } else {
              // Email is NULL in profiles - this shouldn't happen after our fix
              // But if it does, we need to backfill it
              // For now, show helpful error and suggest using email login
              // After they login with email, the profile will be updated with email
              showToast('Username found but email is missing. Please login with your email address instead. We\'ll fix this automatically.', 'error');
              setLoading(false);
              return;
            }
          } else {
            // Username not found - check if it looks like a phone number
            // Only treat as phone if it's all digits/spaces/dashes/parentheses AND has reasonable length (7+ digits)
            const digitsOnly = input.replace(/\D/g, '');
            if (/^[\d\s\-()]+$/.test(input) && digitsOnly.length >= 7) {
              // Looks like a phone number - try to format it
              try {
                loginIdentifier = 'phone';
                phone = formatPhoneToE164(input);
              } catch (formatError) {
                showToast('Invalid phone number format. Please use format: +233XXXXXXXXX or 0XXXXXXXXX', 'error');
                setLoading(false);
                return;
              }
            } else {
              // Not a valid username or phone
              showToast('No account found with this username. Try your email, phone, or create an account.', 'error');
              setLoading(false);
              return;
            }
          }
        }
        
        // For login_attempts, use email if available, otherwise use phone
        const attemptKey = email || phone;
        if (!attemptKey) {
          showToast('Invalid login credentials.', 'error');
          setLoading(false);
          return;
        }

        // Check if account is locked (handle potential duplicates)
        let { data: attemptRecords, error: attemptError } = await supabase
          .from('login_attempts')
          .select('*')
          .eq('email', attemptKey)
          .order('last_attempt_at', { ascending: false }); // Get most recent first
        
        // If not found by email, try phone
        if ((!attemptRecords || attemptRecords.length === 0) && phone) {
          const { data: phoneAttemptRecords } = await supabase
            .from('login_attempts')
            .select('*')
            .eq('email', phone)
            .order('last_attempt_at', { ascending: false });
          attemptRecords = phoneAttemptRecords;
        }

        // Handle duplicates: use the most recent record, delete others
        let attemptData = null;
        if (attemptRecords && attemptRecords.length > 0) {
          // Use the most recent record (first in our sorted list)
          attemptData = attemptRecords[0];
          
          // If there are duplicates, clean them up (keep only the most recent)
          if (attemptRecords.length > 1) {
            const idsToDelete = attemptRecords.slice(1).map(r => r.id);
            if (idsToDelete.length > 0) {
              await supabase
                .from('login_attempts')
                .delete()
                .in('id', idsToDelete);
            }
          }
        }

        if (attemptError) {
          console.error("Error checking login attempts:", attemptError);
        }

        // Check if attempts should be reset (24 hours passed since last attempt)
        if (attemptData) {
          const lastAttempt = new Date(attemptData.last_attempt_at);
          const now = new Date();
          const hoursSinceLastAttempt = (now - lastAttempt) / (1000 * 60 * 60);
          
          // Reset attempts if 24 hours have passed since last attempt
          if (hoursSinceLastAttempt >= 24) {
            await supabase
              .from('login_attempts')
              .delete()
              .eq('email', attemptKey);
            attemptData = null; // Clear attemptData so it's treated as fresh
          } else if (attemptData?.is_locked) {
            const lockedUntil = new Date(attemptData.locked_until);
            
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
                .eq('email', attemptKey);
              attemptData = null;
            }
          }
        }
        
        // Wrap signInWithPassword in try-catch to ensure all errors are caught
        let loginError = null;
        try {
          // Use phone or email based on login identifier
          const signInParams = loginIdentifier === 'phone' 
            ? { phone, password }
            : { email, password };
          
          const { error, data } = await supabase.auth.signInWithPassword(signInParams);
          loginError = error;
          
          // CRITICAL: After successful login, refresh session to get latest user_metadata
          // Note: The auth state change handler will call fetchProfile, so we don't need to do it here
          // Just ensure the session is set properly
          if (!error && data?.user) {
            try {
              // Get the latest session which should have user_metadata
              const { data: { session: refreshedSession }, error: sessionError } = await supabase.auth.getSession();
              if (!sessionError && refreshedSession) {
                setSession(refreshedSession);
                
                // CRITICAL: Backfill email in profiles table if it's missing
                // This fixes the issue where existing users have NULL email in profiles
                if (refreshedSession.user?.email) {
                  const { data: currentProfile } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('id', refreshedSession.user.id)
                    .maybeSingle();
                  
                  // If email is NULL or missing, backfill it
                  if (!currentProfile?.email) {
                    await supabase
                      .from('profiles')
                      .update({ email: refreshedSession.user.email })
                      .eq('id', refreshedSession.user.id);
                  }
                }
              }
            } catch (refreshErr) {}
          }
        } catch (signInErr) {
          // If signInWithPassword throws an exception, convert it to an error object
          loginError = signInErr;
          console.error("SignIn exception:", signInErr);
        }

        if (loginError) {
          console.error("Login error:", loginError); // Debug log
          
          // Determine error type for better user feedback
          const isInvalidCredentials = loginError.message?.includes('Invalid login credentials') || 
                                      loginError.message?.includes('Email not confirmed') ||
                                      loginError.message?.includes('Invalid password');
          const isEmailNotFound = loginError.message?.includes('User not found') ||
                                 loginError.message?.includes('No user found');
          
          // Only track attempts for existing accounts (not for non-existent emails/phones)
          // Check if account exists by trying to get user (we'll use a simple check)
          let shouldTrackAttempt = true;
          if (isEmailNotFound) {
            shouldTrackAttempt = false; // Don't track attempts for non-existent accounts
          }
          
          // Track failed attempt only if account exists
          if (shouldTrackAttempt) {
            const attemptCount = attemptData ? attemptData.attempt_count + 1 : 1;
            const isLocked = attemptCount >= 5;
            const lockedUntil = isLocked ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null; // Lock for 24 hours

            // Update or create login attempt record (use attemptKey which can be email or phone)
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
                  .eq('email', attemptKey);
              } else {
                // Create new record (login_attempts.email column stores email or phone)
                await supabase
                  .from('login_attempts')
                  .insert({
                    email: attemptKey, // Store email or phone in 'email' column
                    attempt_count: attemptCount,
                    is_locked: isLocked,
                    locked_until: lockedUntil,
                    last_attempt_at: new Date().toISOString()
                  });
              }
            } catch (dbError) {
              console.error("Error updating login attempts:", dbError);
            }

            // Show appropriate error message
            if (isLocked) {
              showToast(
                `Account locked after 5 failed attempts. Please contact support@sacredhearts.app to unlock your account.`,
                'error'
              );
            } else {
              const remainingAttempts = 5 - attemptCount;
              showToast(
                `Incorrect password. ${remainingAttempts} attempt(s) remaining before account lockout.`,
                'error'
              );
            }
          } else {
            // Account doesn't exist - show friendly message with context
            let identifierType = 'email';
            if (loginIdentifier === 'phone') {
              identifierType = 'phone number';
            } else if (loginIdentifier === 'username') {
              identifierType = 'username';
            }
            showToast(
              `No account found with this ${identifierType}. Please check and try again, or create a new account.`,
              'error'
            );
          }
          setLoading(false);
          return; // Exit early on error
        } else {
          // Successful login - reset attempts immediately (by attemptKey)
          if (attemptData) {
            await supabase
              .from('login_attempts')
              .delete()
              .eq('email', attemptKey);
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
      const { method, signupName, signupGender, signupDOB, signupEmail, signupPhone, password } = formData;
      
      // Normalize date to YYYY-MM-DD format (matches database)
      const normalizedDate = normalizeDateFormat(signupDOB);
      
      // Save signup data to metadata. City/region are collected after verification in onboarding.
      const userMetadata = {
        full_name: signupName?.trim() || '',
        gender: signupGender?.trim() || '',
        date_of_birth: normalizedDate || '',
        phone: method === 'phone' ? (signupPhone?.trim() || null) : null,
      };
      
      // Saving signup metadata to user_metadata

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
          // Format phone number to E.164 format (required by Supabase)
          const formatPhoneToE164 = (phone) => {
            // Remove all non-digit characters except +
            let cleaned = phone.replace(/[^\d+]/g, '');
            
            // If doesn't start with +, add country code
            if (!cleaned.startsWith('+')) {
              // Remove leading 0 if present
              cleaned = cleaned.replace(/^0/, '');
              // Add Ghana country code (+233) if not present
              if (!cleaned.startsWith('233')) {
                cleaned = '+233' + cleaned;
              } else {
                cleaned = '+' + cleaned;
              }
            }
            
            return cleaned;
          };
          
          const formattedPhone = formatPhoneToE164(signupPhone);
          const { error, data } = await supabase.auth.signUp({
            phone: formattedPhone,
            password: password,
            options: {
              data: userMetadata
            }
          });
          
          if (error) {
            console.error("Phone signup error:", error?.message || error);
            if (error.status === 429) throw new Error("Too many requests. Try again in a minute.");
            if (error.message?.includes('phone') || error.message?.includes('SMS')) {
              throw new Error("SMS service error. Please check your phone number format (+233XXXXXXXXX) and try again.");
            }
            throw error;
          }

          // CRITICAL STEP:
          // Phone signup DOES NOT create a session yet. 
          // We must save the phone & password temporarily so VerifyScreen can use them.
          setPendingPhone(formattedPhone); // Use formatted phone
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

  // Username + location step: save both then go to images (onboarding) or setup/discovery (existing user)
  const handleUsernameSubmit = async (payload) => {
    if (!session?.user?.id) return;
    const username = typeof payload === 'object' && payload?.username != null ? payload.username : payload;
    const city = typeof payload === 'object' ? payload?.city?.trim() : null;
    const region = typeof payload === 'object' && (payload?.region === 'ghana' || payload?.region === 'diaspora') ? payload.region : null;

    setLoading(true);
    try {
      const updatePayload = { username, updated_at: new Date().toISOString() };
      if (city) updatePayload.city = city;
      if (region) updatePayload.region = region;

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', session.user.id)
        .select()
        .single();
      if (error) throw error;
      if (updatedProfile) {
        setProfile(updatedProfile);
        if (city) setCity(city);
      }

      if (city && region) {
        await supabase.auth.updateUser({
          data: { ...session.user.user_metadata, city, region }
        });
      }

      // Onboarding: had no location before → go to images step
      if (!profile?.city && !profile?.region && city && region) {
        setView('onboarding-images');
        showToast('Saved! Add a photo to continue.', 'success');
        return;
      }
      // Existing user (already had location) or only set username: go to setup or discovery
      if (updatedProfile?.gender && updatedProfile?.intent) {
        setView('discovery');
        await fetchCandidates(session.user.id, updatedProfile.gender, updatedProfile);
        showToast('Username saved! Welcome back.', 'success');
      } else {
        setView('setup');
        showToast('Username saved! Complete your profile.', 'success');
      }
    } catch (e) {
      console.error('Username/location save error:', e);
      showToast(e?.message || 'Could not save. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Onboarding: save images then go to location step
  const handleOnboardingImagesContinue = async () => {
    if (!session?.user?.id || !profile) return;
    if (!avatarFile && !profile?.avatar_url) {
      showToast('Please upload at least one profile photo to continue.', 'error');
      return;
    }
    setLoading(true);
    try {
      let finalAvatarUrl = profile?.avatar_url;
      let finalAvatarUrl2 = profile?.avatar_url_2;
      let finalAvatarUrl3 = profile?.avatar_url_3;
      if (avatarFile) finalAvatarUrl = await uploadAvatar(avatarFile) || finalAvatarUrl;
      if (avatarFile2) finalAvatarUrl2 = await uploadAvatar(avatarFile2) || finalAvatarUrl2;
      if (avatarFile3) finalAvatarUrl3 = await uploadAvatar(avatarFile3) || finalAvatarUrl3;
      const { data: updated, error } = await supabase
        .from('profiles')
        .update({
          avatar_url: finalAvatarUrl,
          avatar_url_2: finalAvatarUrl2,
          avatar_url_3: finalAvatarUrl3,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id)
        .select()
        .single();
      if (error) throw error;
      if (updated) setProfile(updated);
      setAvatarFile(null); setAvatarFile2(null); setAvatarFile3(null);
      setPreviewUrl(finalAvatarUrl || ''); setPreviewUrl2(finalAvatarUrl2 || ''); setPreviewUrl3(finalAvatarUrl3 || '');
      setView('setup');
      showToast('Photos saved! Complete your profile to continue.', 'success');
    } catch (e) {
      console.error(e);
      showToast(e?.message || 'Failed to save photos. Try again.', 'error');
    } finally {
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
      const { data, error } = await supabase.auth.verifyOtp({
        phone: pendingPhone,
        token: code,
        type: 'sms'
      });

      if (error) {
        console.error("OTP verification error:", error.message);
        throw error;
      }

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
          setUnreadCounts(prev => { 
            const copy = { ...prev }; 
            delete copy[partnerId]; 
            // Update total unread count
            const total = Object.values(copy).reduce((sum, count) => sum + count, 0);
            setUnreadMessageCount(total);
            return copy; 
          });

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
    
    // CRITICAL: Preserve dateOfBirth value - check state, profile, and metadata
    // This prevents the value from being lost during upload
    const currentDateOfBirth = dateOfBirth || profile?.date_of_birth || session?.user?.user_metadata?.date_of_birth || '';
    
    if (!currentDateOfBirth) { 
      showToast("Please enter your Date of Birth."); 
      return 
    }
    
    // Normalize date to YYYY-MM-DD format (matches database)
    // Accept YYYY-MM-DD format directly, or convert from other formats
    let normalizedDate = normalizeDateFormat(currentDateOfBirth.trim());
    
    // Validate format is YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
      // Try to fix format if it's close (might be DD-MM-YYYY or other)
      const cleaned = currentDateOfBirth.trim().replace(/\D/g, '');
      if (cleaned.length === 8) {
        // Try DD-MM-YYYY format
        const day = cleaned.slice(0, 2);
        const month = cleaned.slice(2, 4);
        const year = cleaned.slice(4, 8);
        normalizedDate = `${year}-${month}-${day}`;
        setDateOfBirth(normalizedDate); // Update state with corrected format
      } else {
        showToast("Please enter date in YYYY-MM-DD format (e.g., 1990-12-25)", 'error');
        return;
      }
    }
    
    // Validate the date is valid
    const dateObj = new Date(normalizedDate);
    if (isNaN(dateObj.getTime())) {
      showToast("Invalid date. Please check your date of birth.", 'error');
      return;
    }
    
    // Use normalized date directly (already in YYYY-MM-DD format)
    const dbFormatDate = normalizedDate;
    
    // Ensure state is updated with the normalized date
    if (dateOfBirth !== normalizedDate) {
      setDateOfBirth(normalizedDate);
    }
    
    if (calculateAge(dbFormatDate) < 18) { showToast("You must be 18+."); return }
    
    // Require at least one image during signup (setup view)
    if (view === 'setup' && !avatarFile && !profile?.avatar_url) {
      showToast("Please upload at least one profile photo to continue.", 'error');
      return;
    }

    // Setup: require full profile before entering app
    if (view === 'setup') {
      if (!height?.trim()) { showToast("Please enter your height.", 'error'); return; }
      if (!weight?.trim()) { showToast("Please enter your weight.", 'error'); return; }
      const hobbiesList = Array.isArray(hobbies) ? hobbies : (typeof hobbies === 'string' ? hobbies.split(',').map(h => h.trim()).filter(Boolean) : []);
      if (!hobbiesList.length) { showToast("Please select at least one hobby.", 'error'); return; }
      if (!religion?.trim()) { showToast("Please select your religion.", 'error'); return; }
      if (!intent?.trim()) { showToast("Please select your intent.", 'error'); return; }
      if (!bio?.trim()) { showToast("Please write a short bio.", 'error'); return; }
    }
    
    // Require phone number after initial profile setup
    if (view === 'profile' && !phone) { 
      showToast("Phone number is required for account security.", 'error'); 
      return 
    }
    
    // Validate username - required for setup, optional for profile edit
    const normalizedUsername = username.trim().toLowerCase();
    if (view === 'setup') {
      // Username is required in setup
      if (!normalizedUsername) {
        showToast("Username is required. Please choose a unique username.", 'error');
        return;
      }
      const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
      if (!USERNAME_REGEX.test(normalizedUsername)) {
        showToast("Username must be 3-30 characters, letters, numbers, and underscores only.", 'error');
        return;
      }
      // Check if username is available (must show green checkmark)
      if (usernameStatus === null || usernameStatus === 'checking') {
        showToast("Please wait for username availability check to complete.", 'error');
        return;
      }
      if (usernameStatus === 'taken' || usernameStatus === 'invalid') {
        showToast("Please choose an available username. Wait for the green checkmark.", 'error');
        return;
      }
      if (usernameStatus !== 'available') {
        showToast("Please choose an available username. Wait for the green checkmark.", 'error');
        return;
      }
    } else if (normalizedUsername) {
      // Profile edit - username is optional but if provided, must be valid
      const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
      if (!USERNAME_REGEX.test(normalizedUsername)) {
        showToast("Username must be 3-30 characters, letters, numbers, and underscores only.", 'error');
        return;
      }
      
      // If username changed, check availability
      const currentUsername = profile?.username?.toLowerCase();
      if (normalizedUsername !== currentUsername) {
        // Only require availability check if username actually changed
        if (usernameStatus === null || usernameStatus === 'checking') {
          showToast("Please wait for username availability check to complete.", 'error');
          return;
        }
        if (usernameStatus === 'taken' || usernameStatus === 'invalid') {
          showToast("Please choose an available username. Wait for the green checkmark.", 'error');
          return;
        }
        if (usernameStatus !== 'available') {
          showToast("Please wait for username availability check or choose an available username.", 'error');
          return;
        }
      }
    }
    
    setLoading(true)
    
    // CRITICAL: Preserve dateOfBirth value before any operations
    // Store it in a variable to prevent it from being cleared during upload
    const preservedDateOfBirth = dateOfBirth || profile?.date_of_birth || '';
    
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
        
        // CRITICAL: Ensure dateOfBirth is preserved after upload
        // If it got cleared during upload, restore it from the validated date
        if (!dateOfBirth && dbFormatDate) {
            setDateOfBirth(dbFormatDate);
        }

        const finalHeight = height ? parseInt(height) : null;
        const finalWeight = weight ? parseInt(weight) : null;

        if (height && isNaN(finalHeight)) throw new Error("Height must be a valid number.");
        if (weight && isNaN(finalWeight)) throw new Error("Weight must be a valid number.");

        // --- FIX: Prepare Update Data carefully ---
        // Use the already normalized and converted date (dbFormatDate from validation above)
        // Ensure date_of_birth is always in YYYY-MM-DD format for database
        // CRITICAL: Prioritize form values over metadata - user should be able to update their info
        // Only use metadata as fallback when creating a NEW profile (not when updating existing one)
        const updateData = {
            // Use form values first - user can update their name, city, etc.
            full_name: fullName?.trim() || '',
            // Save username: use new value if provided and valid, otherwise keep existing
            username: (normalizedUsername && normalizedUsername.length > 0) 
              ? normalizedUsername 
              : (profile?.username || null), // Keep existing username if field is cleared
            gender: gender || '', // Gender can be locked, but use form value if provided
            city: city?.trim() || '',
            religion: religion || null,
            denomination: denomination || null,
            intent: intent || null,
            bio: bio || null,
            date_of_birth: dbFormatDate, // Use validated and normalized date
            avatar_url: finalAvatarUrl,
            avatar_url_2: finalAvatarUrl2,
            avatar_url_3: finalAvatarUrl3,
            height: finalHeight,
            weight: finalWeight,
            occupation: occupation || null, 
            hobbies: hobbies.length > 0 ? hobbies.join(',') : null,
            phone: phone?.trim() || null,
            region: profile?.region || null, // Preserve region set in onboarding
            email: session?.user?.email || profile?.email || null,
            icebreaker_prompts: JSON.stringify(icebreakerPrompts),
            updated_at: new Date(),
        };
        
        // Ensure dateOfBirth state is set with the final value
        if (dateOfBirth !== dbFormatDate) {
            setDateOfBirth(dbFormatDate);
        }

        // ONLY update lat/long if we actually have coordinates (to prevent deleting existing location)
        if (userCoords.lat && userCoords.long) {
            updateData.lat = userCoords.lat;
            updateData.long = userCoords.long;
        }

        // Check if profile exists - if not, create it; if yes, update it
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id, gender, date_of_birth, city, phone, region')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }
        
        // If profile doesn't exist, get metadata to ensure all signup data is saved
        let finalUpdateData = { ...updateData };
        if (!existingProfile) {
          const userMetadata = session?.user?.user_metadata;
          // CRITICAL: When creating a new profile, use ALL metadata fields
          // This ensures signup data is fully saved, not just name
          if (userMetadata) {
            // Use metadata values if form state is empty or missing
            if (!finalUpdateData.gender && userMetadata.gender) {
              finalUpdateData.gender = userMetadata.gender;
              if (!gender) setGender(userMetadata.gender); // Update state if empty
            }
            if (!finalUpdateData.date_of_birth && userMetadata.date_of_birth) {
              const normalizedDate = normalizeDateFormat(userMetadata.date_of_birth);
              finalUpdateData.date_of_birth = normalizedDate;
              if (!dateOfBirth) setDateOfBirth(normalizedDate); // Update state if empty
            }
            if (!finalUpdateData.city && userMetadata.city) {
              finalUpdateData.city = userMetadata.city;
              if (!city) setCity(userMetadata.city); // Update state if empty
            }
            if (!finalUpdateData.region && (userMetadata.region === 'ghana' || userMetadata.region === 'diaspora')) {
              finalUpdateData.region = userMetadata.region;
            }
            if (!finalUpdateData.full_name && userMetadata.full_name) {
              finalUpdateData.full_name = userMetadata.full_name;
              if (!fullName) setFullName(userMetadata.full_name); // Update state if empty
            }
            if (!finalUpdateData.phone && userMetadata.phone) {
              finalUpdateData.phone = userMetadata.phone;
              if (!phone) setPhone(userMetadata.phone); // Update state if empty
            }
          }
        } else {
          // Profile exists - DO NOT use metadata to override user's form input
          // User should be able to update their name, city, etc. freely
          // Only use existing profile values if form fields are truly empty AND profile has the value
          // This allows users to update their information without metadata overriding it
          if (!finalUpdateData.full_name && existingProfile.full_name) {
            finalUpdateData.full_name = existingProfile.full_name;
          }
          if (!finalUpdateData.gender && existingProfile.gender) {
            finalUpdateData.gender = existingProfile.gender;
          }
          if (!finalUpdateData.city && existingProfile.city) {
            finalUpdateData.city = existingProfile.city;
          }
          if (!finalUpdateData.phone && existingProfile.phone) {
            finalUpdateData.phone = existingProfile.phone;
          }
          if (existingProfile.region) {
            finalUpdateData.region = existingProfile.region;
          }
          // Note: We don't use metadata here because user should be able to update their info
        }
        
        let error;
        if (!existingProfile) {
          // Profile doesn't exist - create it with ALL fields (including metadata)
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              ...finalUpdateData
            });
          error = insertError;
        } else {
          // Profile exists - update it with all fields
          const { error: updateError } = await supabase
            .from('profiles')
            .update(finalUpdateData)
            .eq('id', session.user.id);
          error = updateError;
        }
          
        if (error) throw error
        
        showToast('Profile Saved!', 'success')
        
        // Store current preview URLs before clearing
        const oldPreviews = { previewUrl, previewUrl2, previewUrl3 };
        
        // Clear file states (but keep preview URLs temporarily to prevent flicker)
        setAvatarFile(null); 
        setAvatarFile2(null); 
        setAvatarFile3(null);
        
        await fetchProfile(session.user.id);

        // If they just completed setup, update profile state and send them to discovery
        if (view === 'setup') {
          const forDiscovery = { ...profile, ...finalUpdateData };
          setProfile(forDiscovery);
          setView('discovery');
          await fetchCandidates(session.user.id, forDiscovery.gender || profile?.gender, forDiscovery);
        }
        
        // Wait for profile state to update, then clear preview URLs
        // This prevents flicker by keeping previews until profile loads with new URLs
        // Don't clear previews immediately - let them persist until user navigates away or new image is confirmed
        setTimeout(() => {
          // Only clear preview if we have a new profile image URL that's different from preview
          // This ensures the new uploaded image shows immediately and stays visible
          if (profile?.avatar_url && oldPreviews.previewUrl) {
            // Profile has new URL, safe to clear preview
            if (oldPreviews.previewUrl.startsWith('blob:')) {
              try { URL.revokeObjectURL(oldPreviews.previewUrl); } catch(e) {}
            }
            setPreviewUrl(null);
          }
          if (profile?.avatar_url_2 && oldPreviews.previewUrl2) {
            if (oldPreviews.previewUrl2.startsWith('blob:')) {
              try { URL.revokeObjectURL(oldPreviews.previewUrl2); } catch(e) {}
            }
            setPreviewUrl2(null);
          }
          if (profile?.avatar_url_3 && oldPreviews.previewUrl3) {
            if (oldPreviews.previewUrl3.startsWith('blob:')) {
              try { URL.revokeObjectURL(oldPreviews.previewUrl3); } catch(e) {}
            }
            setPreviewUrl3(null);
          }
        }, 2000); // Increased timeout to ensure profile images are fully loaded
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
    if (!matchId || !session) return
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
    
    if (error) { 
      console.error("Error fetching messages:", error); 
      return 
    }
    
    // Filter out messages deleted by current user (soft delete per user)
    const filteredMessages = (data || []).filter(msg => {
      // If deleted_by exists and contains current user ID, exclude it
      if (msg.deleted_by && Array.isArray(msg.deleted_by)) {
        return !msg.deleted_by.includes(session.user.id);
      }
      // Handle JSONB format (if it's stored as JSONB array of strings)
      if (msg.deleted_by && typeof msg.deleted_by === 'object') {
        const deletedByArray = Array.isArray(msg.deleted_by) ? msg.deleted_by : [];
        return !deletedByArray.some(id => id === session.user.id || id === session.user.id.toString());
      }
      return true; // No deleted_by field or empty, show message
    });
    
    setChatMessages(filteredMessages)
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
    if (!session) return; // Safety check: ensure user is logged in
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
    
    // WhatsApp-style: Auto-resize with max-height, then scroll
    const MAX_HEIGHT = 120; // Maximum height in pixels (like WhatsApp)
    const SINGLE_LINE_HEIGHT = 40; // Approximate single line height
    
    e.target.style.height = "auto";
    const scrollHeight = e.target.scrollHeight;
    const newHeight = Math.min(scrollHeight, MAX_HEIGHT);
    e.target.style.height = newHeight + "px";
    
    // Enable scrolling when max height is reached
    e.target.style.overflowY = scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
    
    // Update border radius: rounded-full when single line, rounded-xl when expanded
    const isExpanded = newHeight > SINGLE_LINE_HEIGHT;
    setIsTextareaExpanded(isExpanded);
    
    if (!text.trim()) {
      // Reset when empty
      setIsTextareaExpanded(false);
      return;
    }
    
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
  }

  // --- FIX: Handle Image Sending (Images Only) ---
  // Handle camera capture - show preview
  const handleCameraCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setCameraPreview({
        file: file,
        preview: event.target.result,
        id: `camera_${Date.now()}`
      });
    };
    reader.readAsDataURL(file);
    
    // Reset input to allow capturing same photo again
    e.target.value = '';
  };

  // Handle gallery selection - allow multiple
  const handleGallerySelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Create preview objects for each selected image
    const previews = [];
    let loadedCount = 0;
    
    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        previews.push({
          file: file,
          preview: event.target.result,
          id: `gallery_${Date.now()}_${index}`,
          status: 'pending' // pending, sending, sent, error
        });
        
        loadedCount++;
        if (loadedCount === files.length) {
          setGalleryPreview(prev => [...prev, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input to allow selecting same files again
    e.target.value = '';
  };

  // Compress image for low quality
  const compressImage = (file, quality = 0.6) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 1200px for low quality)
          let width = img.width;
          let height = img.height;
          const maxDimension = quality === 0.6 ? 1200 : img.width; // HD keeps original size
          
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(blob || file);
          }, 'image/jpeg', quality);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Send camera preview image
  const sendCameraImage = async () => {
    if (!cameraPreview || !activeChatProfile) return;
    
    const match = myMatches.find(m => 
      (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
      (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
    );
    
    if (!match) {
      showToast("No active match found.", 'error');
      return;
    }

    let tempMessageId = null; // Declare outside try for catch access
    
    try {
      setSendingImages(prev => ({ ...prev, [cameraPreview.id]: 'sending' }));
      
      // Compress if low quality selected
      let fileToUpload = cameraPreview.file;
      if (imageQuality === 'low') {
        fileToUpload = await compressImage(cameraPreview.file, 0.6);
      }
      
      const fileExt = cameraPreview.file.name.split('.').pop() || 'jpg';
      const fileName = `${session.user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      // OPTIMISTIC UI: Add message immediately
      const tempImageUrl = cameraPreview.preview;
      tempMessageId = `temp_camera_${Date.now()}`;
      const tempMessage = {
        id: tempMessageId,
        match_id: match.id,
        sender_id: session.user.id,
        content: tempImageUrl,
        type: 'image',
        created_at: new Date().toISOString(),
        read_at: null
      };
      setChatMessages(prev => [...prev, tempMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, fileToUpload, {
          contentType: `image/${fileExt}`,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Insert message to database
      const { data: insertedMessage, error: msgError } = await supabase
        .from('messages')
        .insert({
          match_id: match.id, 
          sender_id: session.user.id, 
          content: publicUrl,
          type: 'image'
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // Replace temporary message with real message
      setChatMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? insertedMessage : msg
      ));

      setSendingImages(prev => ({ ...prev, [cameraPreview.id]: 'sent' }));
      showToast("Photo sent!", 'success');
      
      // Clear preview
      setCameraPreview(null);
      
      // Scroll to bottom again
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);

    } catch (error) {
      console.error("Image send error:", error);
      setSendingImages(prev => ({ ...prev, [cameraPreview.id]: 'error' }));
      showToast("Failed to send photo.", 'error');
      // Remove optimistic message on error - use the stored tempMessageId
      if (typeof tempMessageId !== 'undefined') {
        setChatMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      }
    }
  };

  // Send gallery images (one or multiple)
  const sendGalleryImages = async (imageIds = null) => {
    // If specific IDs provided, send only those. Otherwise send all pending
    const imagesToSend = imageIds 
      ? galleryPreview.filter(img => imageIds.includes(img.id))
      : galleryPreview.filter(img => img.status === 'pending');
    
    if (imagesToSend.length === 0 || !activeChatProfile) return;
    
    const match = myMatches.find(m => 
      (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
      (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
    );
    
    if (!match) {
      showToast("No active match found.", 'error');
      return;
    }

    // Send each image
    for (const image of imagesToSend) {
      try {
        // Update status to sending
        setGalleryPreview(prev => prev.map(img => 
          img.id === image.id ? { ...img, status: 'sending' } : img
        ));
        setSendingImages(prev => ({ ...prev, [image.id]: 'sending' }));
        
        // Compress if low quality
        let fileToUpload = image.file;
        if (imageQuality === 'low') {
          fileToUpload = await compressImage(image.file, 0.6);
        }
        
        const fileExt = image.file.name.split('.').pop() || 'jpg';
        const fileName = `${session.user.id}_${Date.now()}_${Math.random()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;

        // OPTIMISTIC UI: Add message immediately
        const tempMessage = {
          id: `temp_${image.id}`,
          match_id: match.id,
          sender_id: session.user.id,
          content: image.preview,
          type: 'image',
          created_at: new Date().toISOString(),
          read_at: null
        };
        setChatMessages(prev => [...prev, tempMessage]);

        // Upload to Supabase
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, fileToUpload, {
            contentType: `image/${fileExt}`,
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Insert message to database
        const { data: insertedMessage, error: msgError } = await supabase
          .from('messages')
          .insert({
            match_id: match.id, 
            sender_id: session.user.id, 
            content: publicUrl,
            type: 'image'
          })
          .select()
          .single();

        if (msgError) throw msgError;

        // Replace temporary message with real message
        setChatMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id ? insertedMessage : msg
        ));

        // Update status to sent
        setGalleryPreview(prev => prev.map(img => 
          img.id === image.id ? { ...img, status: 'sent' } : img
        ));
        setSendingImages(prev => ({ ...prev, [image.id]: 'sent' }));

      } catch (error) {
        console.error("Image send error:", error);
        setGalleryPreview(prev => prev.map(img => 
          img.id === image.id ? { ...img, status: 'error' } : img
        ));
        setSendingImages(prev => ({ ...prev, [image.id]: 'error' }));
        showToast(`Failed to send ${image.file.name}`, 'error');
      }
    }
    
    // Remove sent images from preview after a delay
    setTimeout(() => {
      setGalleryPreview(prev => prev.filter(img => img.status !== 'sent'));
      // Scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 1000);
    
    if (imagesToSend.every(img => img.status === 'sent' || img.status === 'error')) {
      showToast("Photos sent!", 'success');
    }
  };

  // Remove image from gallery preview
  const removeGalleryImage = (imageId) => {
    setGalleryPreview(prev => prev.filter(img => img.id !== imageId));
  };


  // --- NEW: Start Recording ---
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support audio recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Audio Context for waveform visualization
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Start waveform animation
      const levels = new Uint8Array(analyser.frequencyBinCount);
      const updateWaveform = () => {
        if (!isRecording && !mediaRecorderRef.current) return;
        analyser.getByteFrequencyData(levels);
        setAudioLevels(Array.from(levels.slice(0, 20))); // Use first 20 for visualization
        requestAnimationFrame(updateWaveform);
      };
      updateWaveform();
      
      // Determine best MIME type for mobile compatibility
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }
      
      const recorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = recorder;
      audioChunks.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Clean up audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        if (analyserRef.current) {
          analyserRef.current = null;
        }
        setAudioLevels([]);
        
        const blob = new Blob(audioChunks.current, { type: mimeType });
        
        // 1. Upload Audio with optimistic UI update
        await uploadAudioMessage(blob, mimeType);
        
        // 2. Reset State
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      // Stop recording
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      // Stop all tracks to release microphone
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
    
    // Clean up audio context if still active
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    
    setAudioLevels([]);
    setIsRecording(false);
  };

  const uploadAudioMessage = async (blob, mimeType = 'audio/webm') => {
    let tempMessageId = null; // Declare outside try for catch access
    let tempAudioUrl = null;
    
    try {
      setUploading(true);
      
      const match = myMatches.find(m => 
        (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
        (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
      );
      
      if (!match) {
        showToast("No active match found.", 'error');
        return;
      }

      // Determine file extension based on MIME type
      let fileExt = 'webm';
      if (mimeType.includes('mp4')) fileExt = 'm4a';
      else if (mimeType.includes('ogg')) fileExt = 'ogg';
      else if (mimeType.includes('webm')) fileExt = 'webm';
      
      const fileName = `${session.user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      // OPTIMISTIC UI: Show audio message immediately (before upload completes)
      tempAudioUrl = URL.createObjectURL(blob);
      tempMessageId = `temp_${Date.now()}_${Math.random()}`; // Unique temp ID
      const tempMessage = {
        id: tempMessageId,
        match_id: match.id,
        sender_id: session.user.id,
        content: tempAudioUrl,
        type: 'audio',
        created_at: new Date().toISOString(),
        read_at: null
      };
      setChatMessages(prev => [...prev, tempMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // Upload to Supabase (Using 'avatars' bucket)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: mimeType,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Revoke temporary URL
      if (tempAudioUrl) {
        URL.revokeObjectURL(tempAudioUrl);
        tempAudioUrl = null;
      }

      // Insert message to database
      const { data: insertedMessage, error: msgError } = await supabase
        .from('messages')
        .insert({
          match_id: match.id, 
          sender_id: session.user.id, 
          content: publicUrl,
          type: 'audio'
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // Replace temporary message with real message from database
      setChatMessages(prev => prev.map(msg => 
        msg.id === tempMessageId ? insertedMessage : msg
      ));

      showToast("Voice sent!", 'success');
      
      // Scroll to bottom again after real message is loaded
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);

    } catch (error) {
      console.error("Audio upload error:", error);
      showToast("Failed to send voice.", 'error');
      // Remove optimistic message on error
      if (tempMessageId) {
        setChatMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      }
      // Revoke temporary URL if it exists
      if (tempAudioUrl) {
        URL.revokeObjectURL(tempAudioUrl);
      }
    } finally {
      setUploading(false);
    }
  };


  // --- 1. SELECT MESSAGE (Click/Long-press to Select) ---
  const handleSelectMessage = (msgId) => {
    setSelectedMessageId(msgId);
  };
  
  // Simple click handler - works for both desktop and mobile
  const handleMessageClick = (msgId, e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSelectMessage(msgId);
  };
  
  // Long-press handler for mobile (using pointer events to avoid passive listener warning)
  const handleLongPressStart = (msgId, e) => {
    // Don't preventDefault on touch events (they're passive) - just stop propagation
    e.stopPropagation();
    
    // Clear any existing timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
    
    // Set timer for long-press (300ms)
    const timer = setTimeout(() => {
      handleSelectMessage(msgId);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 300);
    
    setLongPressTimer(timer);
  };
  
  // Cancel long-press if user lifts finger too soon
  const handleLongPressEnd = (e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // --- 2. REPLY ---
  const handleReplyAction = (msg) => {
    // Validate that the message object is valid
    if (!msg) {
      console.error("handleReplyAction: msg is null or undefined");
      showToast("Cannot reply to this message. Please try again.", 'error');
      setSelectedMessageId(null);
      return;
    }
    
    // Validate that the message has an ID
    if (!msg.id) {
      console.error("handleReplyAction: msg.id is missing", msg);
      showToast("Cannot reply to this message. Missing message ID.", 'error');
      setSelectedMessageId(null);
      return;
    }
    
    const msgId = msg.id.toString();
    
    // Check if it's a temporary message ID (optimistic update) - only block if it's clearly a temp ID
    const isTempId = msgId.startsWith('temp_') || 
                     msgId.startsWith('temp_msg_') || 
                     msgId.startsWith('temp_camera_') || 
                     msgId.startsWith('temp_ice_');
    
    if (isTempId) {
      showToast("Please wait for the message to be sent before replying.", 'error');
      setSelectedMessageId(null);
      return;
    }
    
    // Accept both numeric IDs (integers) and UUIDs
    // Numeric IDs are valid (e.g., auto-incrementing integers from database)
    // UUID format: 8-4-4-4-12 hexadecimal characters
    const isNumericId = !isNaN(msgId) && msgId.length > 0;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidId = isNumericId || uuidRegex.test(msgId);
    
    if (!isValidId) {
      console.error("Invalid message ID format for reply:", msgId, "Type:", typeof msg.id);
      showToast("Cannot reply to this message. Invalid message reference.", 'error');
      setSelectedMessageId(null);
      return;
    }
    
    // All validations passed - set the reply
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

  // --- 6. DELETE (Soft Delete Per User - WhatsApp style) ---
  const handleDeleteAction = async (msgId) => {
    if (!session) return;
    
    // Optimistic UI Remove (only from current user's view)
    setChatMessages(prev => prev.filter(msg => msg.id !== msgId));
    setSelectedMessageId(null); // Close menu

    // Soft Delete: Add current user ID to deleted_by array
    // This removes the message from this user's view only
    const { data: currentMessage, error: fetchError } = await supabase
      .from('messages')
      .select('deleted_by')
      .eq('id', msgId)
      .single();
    
    if (fetchError) {
      console.error("Error fetching message:", fetchError);
      showToast("Failed to delete message.", 'error');
      // Re-fetch messages to restore state
      const match = myMatches.find(m => 
        (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
        (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
      );
      if (match) await fetchMessages(match.id);
      return;
    }
    
    // Get current deleted_by array (or empty array if null)
    let deletedByArray = [];
    if (currentMessage?.deleted_by) {
      if (Array.isArray(currentMessage.deleted_by)) {
        deletedByArray = [...currentMessage.deleted_by];
      } else if (typeof currentMessage.deleted_by === 'object') {
        // Handle JSONB format
        deletedByArray = Object.values(currentMessage.deleted_by).map(v => 
          typeof v === 'string' ? v : String(v)
        );
      }
    }
    
    // Add current user ID if not already in array
    const userIdString = session.user.id.toString();
    if (!deletedByArray.includes(userIdString) && !deletedByArray.includes(session.user.id)) {
      deletedByArray.push(userIdString);
    }
    
    // Update message with new deleted_by array
    const { error } = await supabase
      .from('messages')
      .update({ deleted_by: deletedByArray })
      .eq('id', msgId);
    
    if (error) {
      console.error("Delete error:", error);
      showToast("Failed to delete message.", 'error');
      // Re-fetch messages to restore state if delete failed
      const match = myMatches.find(m => 
        (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
        (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
      );
      if (match) await fetchMessages(match.id);
    } else {
      showToast("Message deleted.", 'success');
    }
  };



  // --- SEND ICEBREAKER PROMPT (Before Matching) ---
  const sendIcebreakerPrompt = async (promptText, targetUserId = null) => {
    if (!session) return;
    
    const userId = targetUserId || activeChatProfile?.id;
    if (!userId) return;
    
    // Find or create match (status will be 'pending' if not matched yet)
    let match = myMatches.find(m => 
      (m.user_a_id === session.user.id && m.user_b_id === userId) ||
      (m.user_b_id === session.user.id && m.user_a_id === userId)
    );
    
    // If no match exists, create a pending match
    if (!match) {
      const { data: newMatch, error: matchError } = await supabase
        .from('matches')
        .insert({
          user_a_id: session.user.id,
          user_b_id: userId,
          status: 'pending'
        })
        .select()
        .single();
      
      if (matchError) {
        console.error("Error creating match:", matchError);
        showToast("Failed to send prompt.", 'error');
        return;
      }
      
      match = newMatch;
      // Refresh matches
      await fetchMyMatches();
      
      // If in chat view, switch to chat
      if (view !== 'chat' && !targetUserId) {
        setView('chat');
        setActiveChatProfile(activeChatProfile || partnerProfiles.find(p => p.id === userId));
      }
    }
    
    // Check if already matched
    if (match.status === 'mutual') {
      // Already matched, use regular sendMessage
      setInputText(promptText);
      return;
    }
    
    // Count messages sent before matching (only by current user)
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('match_id', match.id)
      .eq('sender_id', session.user.id);
    
    const messageCount = existingMessages?.length || 0;
    
    if (messageCount >= 3) {
      showToast("You've reached the 3-message limit. Connect to continue chatting!", 'error');
      return;
    }
    
    // Send the prompt as a message
    const tempMessageId = `temp_ice_${Date.now()}`;
    const tempMessage = {
      id: tempMessageId,
      match_id: match.id,
      sender_id: session.user.id,
      content: promptText,
      created_at: new Date().toISOString(),
      read_at: null,
      type: 'text'
    };
    
    if (view === 'chat' && activeChatProfile?.id === userId) {
      setChatMessages(prev => [...prev, tempMessage]);
    }
    
    const { data: insertedMessage, error } = await supabase
      .from('messages')
      .insert({
        match_id: match.id,
        sender_id: session.user.id,
        content: promptText,
        read_at: null,
        type: 'text'
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error sending icebreaker:", error);
      showToast("Failed to send prompt.", 'error');
      if (view === 'chat' && activeChatProfile?.id === userId) {
        setChatMessages(prev => prev.filter(m => m.id !== tempMessageId));
      }
    } else {
      if (view === 'chat' && activeChatProfile?.id === userId) {
        setChatMessages(prev => prev.map(m => m.id === tempMessageId ? insertedMessage : m));
      }
      showToast("Prompt sent!", 'success');
      
      // Refresh matches to update count
      await fetchMyMatches();
      if (match.id) await fetchMessages(match.id);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !activeChatProfile || !session) return;

    const currentReplyingTo = replyingTo;
    const messageContent = inputText.trim();
        
    const match = myMatches.find(m => 
        (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
        (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
    )
    if (!match) {
      showToast("You must connect first before sending messages.", 'error');
      return;
    }
    
    // CHECK: If not matched yet (status is 'pending'), restrict to 3 icebreaker messages only
    if (match.status !== 'mutual') {
      // Count messages sent by current user before matching
      const { data: myMessages, error: countError } = await supabase
        .from('messages')
        .select('id')
        .eq('match_id', match.id)
        .eq('sender_id', session.user.id);
      
      if (!countError && myMessages && myMessages.length >= 3) {
        showToast("You've reached the 3-message limit. Wait for them to connect to continue chatting!", 'error');
        return;
      }
      
      // Allow sending if under 3 messages
      // Continue with normal send...
    }
    
    // Validate replied_to_id
    // IMPORTANT: In this app, `messages.id` is numeric (bigint/integer). We should store replied_to_id as the same type.
    // If your DB column is still UUID, the insert will fail; we handle that below with a safe retry.
    let validRepliedToId = null;
    if (currentReplyingTo?.id !== undefined && currentReplyingTo?.id !== null) {
      const repliedId = currentReplyingTo.id;
      const repliedIdStr = String(repliedId);

      // Disallow replying to optimistic/temp messages (no real DB id yet)
      const isTempId =
        repliedIdStr.startsWith('temp_') ||
        repliedIdStr.startsWith('temp_msg_') ||
        repliedIdStr.startsWith('temp_camera_') ||
        repliedIdStr.startsWith('temp_ice_');

      if (isTempId) {
        console.error("Cannot reply to temporary message:", repliedId);
        showToast("Please wait for the message to be sent before replying.", 'error');
        setReplyingTo(null);
        return;
      }

      // Prefer numeric IDs (current production schema uses numeric message IDs)
      const asNumber = Number(repliedIdStr);
      const isFiniteNumber = Number.isFinite(asNumber);

      if (isFiniteNumber) {
        validRepliedToId = asNumber;
      } else {
        // Fallback: allow UUID if your DB uses UUID message IDs (older schema)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(repliedIdStr)) {
          validRepliedToId = repliedIdStr;
        } else {
          console.error("Invalid ID format for replied_to_id:", repliedId, "Type:", typeof repliedId);
          showToast("Invalid reply reference. Please try again.", 'error');
          setReplyingTo(null);
          return;
        }
      }
    }
    
    // 1. Optimistic UI: Show message immediately with unique temp ID
    const tempMessageId = `temp_msg_${Date.now()}_${Math.random()}`;
    const tempMessage = {
      id: tempMessageId, 
      match_id: match.id, 
      sender_id: session.user.id,
      content: messageContent, 
      created_at: new Date().toISOString(), 
      read_at: null,
      deleted_by: null,
      replied_to_id: validRepliedToId
    };
    
    setChatMessages(prev => [...prev, tempMessage]);
    setInputText(""); 
    setReplyingTo(null);
    setIsTextareaExpanded(false); // Reset textarea to single line (rounded-full)
    
    // Reset textarea height
    if (chatInputRef.current) {
      chatInputRef.current.style.height = "auto";
      chatInputRef.current.style.height = "40px";
    }
    
    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    // 2. Database Insert
    const insertPayload = {
      match_id: match.id,
      sender_id: session.user.id,
      content: messageContent,
      read_at: null,
      replied_to_id: validRepliedToId
    };

    // First attempt: include replied_to_id (so replies actually persist and render)
    let { data: insertedMessage, error } = await supabase
      .from('messages')
      .insert(insertPayload)
      .select()
      .single();

    // Safe fallback: if DB column type mismatch exists, retry without replied_to_id so the message still sends.
    // This keeps the app usable while you run the SQL fix to align the schema.
    if (error?.code === '22P02' && validRepliedToId !== null) {
      const retryPayload = {
        match_id: match.id,
        sender_id: session.user.id,
        content: messageContent,
        read_at: null
      };
      const retry = await supabase.from('messages').insert(retryPayload).select().single();
      insertedMessage = retry.data;
      error = retry.error;
      if (!error) {
        showToast("Reply couldn't be attached yet (database needs reply column fix).", 'info');
      }
    }
    
    if (error) {
      console.error("Error sending message:", error);
      showToast("Failed to send message.", 'error');
      // Remove optimistic message on error
      setChatMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
    } else {
      // 3. Replace temp message with real message from database
      setChatMessages(prev => prev.map(msg => 
        msg.id === tempMessageId ? insertedMessage : msg
      ));
      
      // Update pre-match message count if not matched
      if (match.status !== 'mutual') {
        setPreMatchMessageCount(prev => prev + 1);
      }
      
      // 4. DB Success: Trigger Push Notification
      try {
        const partnerId = match.user_a_id === session.user.id ? match.user_b_id : match.user_a_id;
        
        // Call the Edge Function we just deployed
        await supabase.functions.invoke('send-push-notification', {
          recipient_id: partnerId,
          title: `New message from ${profile.full_name}`,
          body: messageContent
        });
        
        showToast("Message sent!", 'success');
      } catch (pushErr) {
        showToast("Message sent!", 'success');
      }
      
      // Scroll to bottom again after real message is loaded
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    }
  };

  // --- TRACK PRE-MATCH MESSAGE COUNT ---
  useEffect(() => {
    if (!session || view !== 'chat' || !activeChatProfile) {
      setPreMatchMessageCount(0);
      return;
    }
    
    const match = myMatches.find(m => 
      (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
      (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
    );
    
    if (!match) {
      setPreMatchMessageCount(0);
      return;
    }
    
    // If matched (status is 'mutual'), reset count (no restriction)
    if (match.status === 'mutual') {
      setPreMatchMessageCount(0);
      return;
    }
    
    // If not matched (status is 'pending'), count messages sent by current user
    const countMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('match_id', match.id)
        .eq('sender_id', session.user.id);
      
      if (!error && data) {
        setPreMatchMessageCount(data.length);
      }
    };
    
    countMessages();
  }, [session, view, activeChatProfile, myMatches]);

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
        setUnreadCounts(prev => {
          const newCounts = { ...prev, [activeChatProfile.id]: 0 };
          // Update total unread count
          const total = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
          setUnreadMessageCount(total);
          return newCounts;
        });
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
          // CRITICAL: Only add if message is NOT deleted by current user
          const msg = payload.new;
          const isDeletedByMe = msg.deleted_by && (
            (Array.isArray(msg.deleted_by) && msg.deleted_by.includes(session.user.id)) ||
            (typeof msg.deleted_by === 'object' && Object.values(msg.deleted_by).includes(session.user.id)) ||
            (Array.isArray(msg.deleted_by) && msg.deleted_by.some(id => id === session.user.id.toString()))
          );
          
          if (isDeletedByMe) return; // Don't add if deleted by current user
          
          // Only add if not already in messages (avoid duplicates)
          setChatMessages(prev => {
            // Check if message already exists (by ID)
            const existsById = prev.some(m => m.id === payload.new.id);
            if (existsById) return prev; // Already exists, don't add
            
            // If message is from current user, check for temp message to replace
            if (payload.new.sender_id === session.user.id) {
              // Find temp message with matching content and timestamp (within 3 seconds)
              const tempMsg = prev.find(m => 
                (m.id.toString().startsWith('temp_') || m.id.toString().startsWith('temp_msg_')) && 
                m.sender_id === session.user.id &&
                m.content === payload.new.content &&
                Math.abs(new Date(m.created_at).getTime() - new Date(payload.new.created_at).getTime()) < 3000
              );
              
              if (tempMsg) {
                // Replace temp message with real one
                return prev.map(m => m.id === tempMsg.id ? payload.new : m);
              }
              
              // No matching temp message found, but it's from current user
              // This shouldn't happen normally, but if it does, don't add duplicate
              // The sendMessage function should have already added it
              return prev;
            }
            
            // Message is from other user, add it
            return [...prev, payload.new];
          });
          
          // Auto-mark new messages as seen if chat is open
          if (view === 'chat' && payload.new.sender_id !== session.user.id) {
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', payload.new.id)
              .neq('sender_id', session.user.id);
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, (payload) => {
            const msg = payload.new;
            // Check if message was deleted by current user
            const isDeletedByMe = msg.deleted_by && (
              (Array.isArray(msg.deleted_by) && msg.deleted_by.includes(session.user.id)) ||
              (typeof msg.deleted_by === 'object' && Object.values(msg.deleted_by).includes(session.user.id)) ||
              (Array.isArray(msg.deleted_by) && msg.deleted_by.some(id => id === session.user.id.toString()))
            );
            
            if (isDeletedByMe) {
              // Remove from state if deleted by current user
              setChatMessages(prev => prev.filter(m => m.id !== msg.id));
            } else {
              // Update message in state
              setChatMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
            }
        })
        // Note: We don't listen to DELETE events anymore since we use soft delete (UPDATE with deleted_by)
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
              {/* --- USERNAME STEP (post-signup, before setup) --- */}
              {session && view === 'username' && (
                <UsernameStep
                  fullName={fullName || profile?.full_name}
                  onSubmit={handleUsernameSubmit}
                  loading={loading}
                  currentUserId={session?.user?.id}
                  initialCity={profile?.city || ''}
                  initialRegion={profile?.region || ''}
                />
              )}
              {/* --- ONBOARDING: IMAGES (after username, before location) --- */}
              {session && view === 'onboarding-images' && (
                <>
                  <div style={{ fontFamily: 'Montserrat, sans-serif' }} className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 -z-10 h-full w-full">
                      <img src={loginImg} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    </div>
                    <div className="relative z-10 w-full max-w-md mx-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8">
                      <button type="button" onClick={() => setView('username')} className="absolute -top-12 left-0 text-white hover:text-rose-200 transition flex items-center gap-2">← Back</button>
                      <div className="flex flex-col items-center mb-4">
                        <img src={logo} alt="SacredHearts" className="h-14 w-auto object-contain drop-shadow-2xl mb-3" />
                        <h2 className="text-xl font-bold text-white text-center">Add your photos</h2>
                        <p className="text-sm text-white/80 text-center mt-1">At least one photo is required.</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                          { file: avatarFile, preview: previewUrl, profileKey: 'avatar_url', isPrimary: true },
                          { file: avatarFile2, preview: previewUrl2, profileKey: 'avatar_url_2', isPrimary: false },
                          { file: avatarFile3, preview: previewUrl3, profileKey: 'avatar_url_3', isPrimary: false }
                        ].map((slot, idx) => (
                          <label key={idx} htmlFor={`onboarding-avatar-${idx}`} className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer group block ${slot.isPrimary ? 'border-rose-300/50' : 'border-white/20'} ${uploading ? 'opacity-50 pointer-events-none' : ''}`} style={{ WebkitTapHighlightColor: 'transparent' }}>
                            <img src={slot.preview || profile?.[slot.profileKey] || (slot.isPrimary ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name || 'user'}` : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23e5e7eb"/></svg>')} className="w-full h-full object-cover" alt="" />
                            {uploading && slot.file && <div className="absolute inset-0 bg-black/70 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" /></div>}
                            {slot.isPrimary && !slot.preview && !profile?.avatar_url && <div className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">Required</div>}
                            <input type="file" id={`onboarding-avatar-${idx}`} className="hidden" accept="image/*" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) { setCropImageSrc(URL.createObjectURL(file)); setCropImageSlot(slot.profileKey); setShowCropModal(true); } e.target.value = ''; }} />
                          </label>
                        ))}
                      </div>
                      <p className="text-sm text-white/90 text-center mb-4 px-2">Uploading all three images gives you more chances of getting a match easy and faster.</p>
                      <button type="button" onClick={handleOnboardingImagesContinue} disabled={loading || (!avatarFile && !profile?.avatar_url)} className="w-full bg-rose-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed">Continue</button>
                    </div>
                  </div>
                  {showCropModal && cropImageSrc && <ImageCropModal imageSrc={cropImageSrc} onClose={handleCropClose} onCropComplete={handleCropComplete} />}
                </>
              )}
              {/* --- LOGGED IN APP --- */}
              {session && view !== 'username' && view !== 'onboarding-images' && (
                <div className="app-shell min-h-screen w-full h-full overflow-hidden">
                  {/* Hide DashboardHeader in chat view – chat has its own top bar (back, name). Prevents header covering chat bar on mobile/PWA. */}
                  {view !== 'chat' && (
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
                  )}
                  
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
                                        {/* Verified Badge - Instagram/X style - bottom-right of avatar */}
                                        {profile?.is_verified && (
                                          <span className="absolute -bottom-0.5 -right-0.5 z-10 drop-shadow-md">
                                            <VerifiedBadge size="md" />
                                          </span>
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
                                <form 
                                  onSubmit={handleSaveProfile} 
                                  className="space-y-4"
                                  onReset={(e) => {
                                    // Prevent accidental form resets
                                    e.preventDefault();
                                  }}
                                >
                                    
                                    {/* --- 1. IMAGES --- */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {[{ file: avatarFile, setFile: setAvatarFile, preview: previewUrl, setPreview: setPreviewUrl, profileKey: 'avatar_url', isPrimary: true },
                                          { file: avatarFile2, setFile: setAvatarFile2, preview: previewUrl2, setPreview: setPreviewUrl2, profileKey: 'avatar_url_2' },
                                          { file: avatarFile3, setFile: setAvatarFile3, preview: previewUrl3, setPreview: setPreviewUrl3, profileKey: 'avatar_url_3' }]
                                          .map((slot, idx) => (
                                            <label 
                                              key={idx}
                                              htmlFor={`avatar-input-${idx}`}
                                              onClick={(e) => {
                                                // Prevent label click from bubbling to form
                                                e.stopPropagation();
                                                if (uploading) {
                                                  e.preventDefault();
                                                }
                                              }}
                                              className={`relative aspect-square rounded-xl overflow-hidden border-2 ${slot.isPrimary ? 'border-rose-300/50' : 'border-white/20'} cursor-pointer group transition hover:border-rose-300 ${uploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} touch-manipulation block`}
                                              style={{ WebkitTapHighlightColor: 'transparent' }}>
                                                {/* Image with fallback - prioritize preview (new upload) over profile image */}
                                                <img 
                                                  src={
                                                    slot.preview 
                                                      ? slot.preview 
                                                      : (profile?.[slot.profileKey] 
                                                          ? profile[slot.profileKey] 
                                                          : (slot.isPrimary 
                                                              ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name || 'user'}` 
                                                              : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23e5e7eb"/></svg>'))
                                                  } 
                                                  className="w-full h-full object-cover opacity-90" 
                                                  alt={slot.isPrimary ? "Profile" : "Additional photo"}
                                                  key={slot.preview ? `preview-${slot.profileKey}` : `profile-${slot.profileKey}`}
                                                />
                                                
                                                {/* Upload status overlay */}
                                                {uploading && slot.file && (
                                                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                                                    <span className="text-white text-xs font-medium">Uploading...</span>
                                                  </div>
                                                )}
                                                
                                                {/* Edit overlay (only show when not uploading) */}
                                                {!uploading && (
                                                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                                                    <Edit size={18} className="text-white"/>
                                                  </div>
                                                )}
                                                
                                                {/* Required indicator for first image in setup */}
                                                {view === 'setup' && slot.isPrimary && !slot.preview && !profile?.avatar_url && (
                                                  <div className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">Required</div>
                                                )}
                                                
                                                {/* Hidden Input - Mobile optimized */}
                                                <input 
                                                  type="file" 
                                                  id={`avatar-input-${idx}`} 
                                                  className="hidden" 
                                                  accept="image/*"
                                                  disabled={uploading}
                                                  onClick={(e) => {
                                                    // Prevent form events on mobile
                                                    e.stopPropagation();
                                                  }}
                                                  onChange={(e) => {
                                                      // Prevent form submission/reset
                                                      e.preventDefault();
                                                      e.stopPropagation();
                                                      
                                                      if (uploading) {
                                                        e.target.value = '';
                                                        return;
                                                      }
                                                      
                                                      const file = e.target.files?.[0]; 
                                                      if(file) { 
                                                        // Show crop modal instead of directly setting file
                                                        const imageUrl = URL.createObjectURL(file);
                                                        setCropImageSrc(imageUrl);
                                                        setCropImageSlot(slot.profileKey); // 'avatar_url', 'avatar_url_2', 'avatar_url_3'
                                                        setShowCropModal(true);
                                                      }
                                                      // Reset input to allow selecting same file again
                                                      e.target.value = '';
                                                  }} 
                                                />
                                            </label>
                                          ))}
                                    </div>

                                    {/* --- 2. FULL NAME --- */}
                                    <div>
                                        <label className="block text-xs text-white/60 font-bold mb-1 pl-1">Full Name</label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-3.5 text-white/60"><User size={18} strokeWidth={1.5}/></div>
                                            <input type="text" placeholder="Enter your full name" className="w-full p-3 pl-10 border border-white/20 bg-white/10 text-white placeholder-white/40 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition" value={fullName} onChange={e=>setFullName(e.target.value)} />
                                        </div>
                                    </div>

                                    {/* --- 2.5. USERNAME (Editable) --- */}
                                    <div>
                                        <label className="block text-xs text-white/60 font-bold mb-1 pl-1">Username</label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-3.5 text-white/60"><User size={18} strokeWidth={1.5}/></div>
                                            <input 
                                                type="text" 
                                                placeholder="Choose a unique username (3-30 chars)" 
                                                className="w-full p-3 pl-10 pr-12 border border-white/20 bg-white/10 text-white placeholder-white/40 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition font-mono text-sm" 
                                                value={username} 
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (val.length <= 30) {
                                                        setUsername(val);
                                                        setUsernameStatus(null); // Reset status on change
                                                    }
                                                }}
                                                maxLength={30}
                                            />
                                            <div className="absolute right-3 top-3.5 flex items-center justify-center w-6">
                                                {usernameStatus === 'checking' && (
                                                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                                                )}
                                                {usernameStatus === 'available' && (
                                                    <Check size={20} className="text-emerald-400" strokeWidth={2.5} />
                                                )}
                                                {usernameStatus === 'taken' && (
                                                    <AlertTriangle size={18} className="text-rose-400" />
                                                )}
                                                {usernameStatus === 'invalid' && username.length >= 3 && (
                                                    <AlertTriangle size={18} className="text-amber-400" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {usernameStatus === 'taken' && (
                                        <p className="text-sm text-rose-300 font-medium flex items-center gap-2 -mt-2">
                                            <AlertTriangle size={14} />
                                            Username taken. Try another.
                                        </p>
                                    )}
                                    {usernameStatus === 'invalid' && username.length >= 3 && (
                                        <p className="text-sm text-amber-300 font-medium flex items-center gap-2 -mt-2">
                                            <AlertTriangle size={14} />
                                            Use 3-30 letters, numbers, and underscores only.
                                        </p>
                                    )}
                                    {usernameStatus === 'available' && (
                                        <p className="text-sm text-emerald-300 font-medium flex items-center gap-2 -mt-2">
                                            <Check size={14} />
                                            Username available.
                                        </p>
                                    )}

                                    {/* --- 3. GENDER --- */}
                                    {view === 'profile' ? ( 
                                      <div className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white/70">Gender: {gender === 'male' ? 'Man' : 'Woman'} (Locked)</div> 
                                    ) : (
                                      <select className="w-full p-3 pl-3 border border-white/20 bg-white/10 text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none [&>option]:text-gray-800" value={gender} onChange={e=>setGender(e.target.value)}><option value="">Gender</option><option value="male">Man</option><option value="female">Woman</option></select>
                                    )}

                                    {/* --- 4. DATE OF BIRTH --- */}
                                    <div>
                                        <label className="block text-xs text-white/60 font-bold mb-1 pl-1">Date of Birth</label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-3.5 text-white/60"><Calendar size={18} strokeWidth={1.5}/></div>
                                            <input 
                                                type="text" 
                                                placeholder="YYYY-MM-DD (e.g., 1990-12-25)" 
                                                inputMode="numeric"
                                                className="w-full p-3 pl-10 border border-white/20 bg-white/10 text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition placeholder-white/40" 
                                                value={dateOfBirth} 
                                                onChange={(e) => {
                                                    // Allow manual entry in YYYY-MM-DD format
                                                    let value = e.target.value;
                                                    // Remove any non-digit characters except dashes
                                                    value = value.replace(/[^\d-]/g, '');
                                                    // Limit to 10 characters (YYYY-MM-DD)
                                                    if (value.length > 10) value = value.slice(0, 10);
                                                    // Auto-format: YYYY-MM-DD
                                                    if (value.length > 4 && value[4] !== '-') {
                                                        value = value.slice(0, 4) + '-' + value.slice(4);
                                                    }
                                                    if (value.length > 7 && value[7] !== '-') {
                                                        value = value.slice(0, 7) + '-' + value.slice(7);
                                                    }
                                                    setDateOfBirth(value);
                                                }}
                                                onBlur={(e) => {
                                                    // Validate format on blur - must be YYYY-MM-DD
                                                    const value = e.target.value.trim();
                                                    if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                                                        // Try to fix format if close
                                                        const cleaned = value.replace(/\D/g, '');
                                                        if (cleaned.length === 8) {
                                                            // Assume YYYYMMDD format
                                                            const fixed = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
                                                            setDateOfBirth(fixed);
                                                        } else {
                                                            showToast("Please enter date in YYYY-MM-DD format (e.g., 1990-12-25)", 'error');
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
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

                                    {/* --- 8. CITY (Ghana dropdown or Diaspora text) --- */}
                                    {profile?.region === 'diaspora' ? (
                                      <div>
                                        <label className="block text-xs text-white/60 font-bold mb-1 pl-1">City (Diaspora)</label>
                                        <input type="text" placeholder="e.g. London" className="w-full p-3 border border-white/20 bg-white/10 text-white placeholder-white/40 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none" value={city} onChange={e=>setCity(e.target.value)} />
                                      </div>
                                    ) : (
                                      <select className="w-full p-3 pl-3 border border-white/20 bg-white/10 text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none [&>option]:text-gray-800" value={city} onChange={e=>setCity(e.target.value)}><option value="">City</option><option value="Accra">Accra</option><option value="Kumasi">Kumasi</option><option value="Tema">Tema</option><option value="Tamale">Tamale</option><option value="Cape Coast">Cape Coast</option><option value="Takoradi">Takoradi</option><option value="Sunyani">Sunyani</option><option value="Ho">Ho</option><option value="Wa">Wa</option><option value="Techiman">Techiman</option><option value="Goaso">Goaso</option><option value="Nalerigu">Nalerigu</option><option value="Sefwi Wiaso">Sefwi Wiaso</option><option value="Damango">Damango</option><option value="Dambai">Dambai</option><option value="Bolgatanga">Bolgatanga</option></select>
                                    )}
                                    
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
                      <div className="discovery-view-root">
                        <div className="discovery-view-inner">
                            {!candidates[currentIndex] && (
                                 <div className="text-center p-8 bg-white/10 rounded-2xl shadow-sm w-full max-w-md mx-auto">
                                    <h3 className="text-xl font-bold text-gray-200">No More Profiles</h3>
                                    <p className="text-gray-400 text-sm mt-2">Adjust your filters to see more people.</p>
                                    <button onClick={() => session && profile && fetchCandidates(session.user.id, profile.gender, profile)} className="mt-4 text-rose-500 font-bold text-sm">Refresh</button>
                                 </div>
                            )}
                            {candidates[currentIndex] && (
                                <div className="discovery-card-slot">
                                  <DiscoverCard 
                                    candidate={candidates[currentIndex]}
                                    onPass={handlePass}
                                    onConnect={handleConnect}
                                    onViewProfile={handleViewProfile}
                                    onLike={handleLike}
                                    onSuperLike={handleSuperLike}
                                    loading={actionLoadingId === candidates[currentIndex]?.id}
                                    isLiked={myCrushes.some(c => c.liked_id === candidates[currentIndex]?.id)}
                                    isSuperLiked={superLikes.includes(candidates[currentIndex]?.id)}
                                    isVerified={verifiedUsers.includes(candidates[currentIndex]?.id)}
                                    lastPassed={lastPassedCandidate}
                                    handleUndo={handleUndo}
                                  />
                                </div>
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
                                                <p className="text-xs text-rose-600">{(user.city || '').split(',')[0].trim()}</p>
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
                            <input type="file" id="story-upload" className="hidden" accept="image/*,video/*" onChange={handleStoryUpload} />
                        </h2>
                        
                        {/* Horizontal Scroll Container - WhatsApp/Instagram Style */}
                        <div className="flex gap-4 pb-20 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {/* My Story Circle (Always first) */}
                            {(() => {
                              // My stories: oldest first (playback order)
                              const myStories = stories
                                .filter(s => s.user_id === session?.user?.id)
                                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                              const hasMyStory = myStories.length > 0;
                              return (
                                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                    <div 
                                      onClick={hasMyStory ? () => {
                                        setViewingStory(myStories[0]);
                                        setViewingStories(myStories);
                                        setInitialStoryIndex(0); // Own stories always start at 0
                                      } : undefined}
                                      className={`w-20 h-20 rounded-full relative ${hasMyStory ? 'cursor-pointer' : ''}`}>
                                      {/* Gradient Ring for My Story */}
                                      {hasMyStory && (
                                        <div className="absolute inset-0 rounded-full p-[3px] bg-gradient-to-tr from-rose-400 via-pink-500 to-orange-400"></div>
                                      )}
                                      <div className={`w-full h-full rounded-full ${hasMyStory ? 'absolute inset-[3px] border-2 border-white' : 'border-2 border-gray-300'} overflow-hidden`}>
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
                                      {hasMyStory ? 'My Story' : 'Add Story'}
                                    </span>
                                </div>
                              );
                            })()}

                            {/* Group stories by user - Show one circle per user */}
                            {(() => {
                              // Group by user_id; keep stories in fetched order (already oldest first)
                              const storiesByUser = {};
                              stories.forEach(story => {
                                if (story.user_id !== session?.user?.id) {
                                  if (!storiesByUser[story.user_id]) {
                                    storiesByUser[story.user_id] = {
                                      user: story.profiles,
                                      stories: []
                                    };
                                  }
                                  storiesByUser[story.user_id].stories.push(story);
                                }
                              });
                              // Sort each user's stories oldest first (playback order)
                              Object.values(storiesByUser).forEach(userStories => {
                                userStories.stories.sort((a, b) =>
                                  new Date(a.created_at) - new Date(b.created_at)
                                );
                              });

                              return Object.values(storiesByUser).map((userStories, idx) => {
                                const firstStory = userStories.stories[0];
                                const user = userStories.user;
                                const ownerId = firstStory.user_id;
                                const viewedIds = viewedStoryViews
                                  .filter(v => v.story_owner_id === ownerId)
                                  .map(v => v.story_id);
                                const hasUnviewed = userStories.stories.some(s => !viewedIds.includes(s.id));
                                const startIndex = (() => {
                                  const i = userStories.stories.findIndex(s => !viewedIds.includes(s.id));
                                  return i !== -1 ? i : userStories.stories.length - 1;
                                })();

                                return (
                                  <div 
                                    key={user.id || idx} 
                                    className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer" 
                                    onClick={() => {
                                      setViewingStory(firstStory);
                                      setViewingStories(userStories.stories);
                                      setInitialStoryIndex(startIndex);
                                    }}
                                  >
                                    <div className="relative w-20 h-20">
                                      <div className={`absolute inset-0 rounded-full p-[3px] ${hasUnviewed ? 'bg-gradient-to-tr from-rose-400 via-pink-500 to-orange-400' : 'bg-gray-500'}`}></div>
                                      <div className="absolute inset-[3px] rounded-full border-2 border-white overflow-hidden">
                                        <img 
                                          src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`} 
                                          alt={user.full_name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      {verifiedUsers.includes(ownerId) && (
                                        <span className="absolute -bottom-0.5 -right-0.5 z-10 drop-shadow-md">
                                          <VerifiedBadge size="sm" />
                                        </span>
                                      )}
                                    </div>

                                    <span className="text-[10px] font-medium text-gray-200 dark:text-gray-300 truncate w-20 text-center">
                                      {user.full_name}
                                    </span>
                                  </div>
                                );
                              });
                            })()}

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
                                            <div className="flex-grow min-w-0"><h3 className="font-bold text-gray-900 truncate">{partnerProfile.full_name}</h3><p className="text-xs text-rose-600 truncate">{(partnerProfile.city || '').split(',')[0].trim()}</p></div>
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
                                                    <span className="text-rose-600">{(p.city || '').split(',')[0].trim()}</span>
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
                                                        setUnreadCounts(prev => {
                                                          const newCounts = { ...prev, [p.id]: 0 };
                                                          // Update total unread count
                                                          const total = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
                                                          setUnreadMessageCount(total);
                                                          return newCounts;
                                                        }); 
                                                        setChatMessages([]); 
                                                        await fetchMessages(match.id);
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
                                                <MapPin size={12} /> {(p.city || '').split(',')[0].trim()}
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
                    {/* Deactivated Account View */}
                    {view === 'deactivated' && profile?.is_deactivated && (
                      <div className="w-full max-w-md mx-auto px-4 pt-6 pb-20">
                        <div className="bg-black/20 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 text-center">
                          <div className="mb-6">
                            <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-orange-500/40">
                              <Lock size={42} className="text-orange-400 drop-shadow-lg" />
                            </div>
                          </div>
                          
                          <h2 className="text-2xl font-extrabold text-white mb-2">Account Deactivated</h2>
                          <p className="text-sm text-white/80 mb-6">
                            Your account has been deactivated. You can reactivate it anytime to continue using the app.
                          </p>
                          
                          <div className="space-y-4">
                            <button
                              onClick={async () => {
                                try {
                                  setLoading(true);
                                  const { error } = await supabase
                                    .from('profiles')
                                    .update({
                                      is_deactivated: false,
                                      deactivated_at: null,
                                      show_in_discovery: true // Show in discovery again
                                    })
                                    .eq('id', session.user.id);
                                  
                                  if (error) throw error;
                                  
                                  // Update local state
                                  setProfile(prev => ({ ...prev, is_deactivated: false }));
                                  setShowInDiscovery(true);
                                  
                                  // Refresh profile and go to discovery
                                  await fetchProfile(session.user.id);
                                  setView('discovery');
                                  showToast("Account reactivated successfully! Welcome back!", 'success');
                                } catch (err) {
                                  console.error("Error reactivating account:", err);
                                  showToast("Error reactivating account. Please try again.", 'error');
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold transition shadow-lg"
                            >
                              Reactivate My Account
                            </button>
                            
                            <p className="text-xs text-white/60">
                              For permanent account deletion, please contact our support team.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
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
                                
                                {/* Hide/Unhide Account */}
                                <button 
                                    onClick={() => {
                                        const isCurrentlyHidden = !showInDiscovery;
                                        setConfirmModal({
                                            isOpen: true,
                                            title: isCurrentlyHidden ? "Unhide Account?" : "Hide Account?",
                                            message: isCurrentlyHidden 
                                                ? "Your profile will be visible in discovery again." 
                                                : "Your profile will be hidden from discovery. You can unhide anytime.",
                                            type: "warning",
                                            onConfirm: async () => {
                                                try {
                                                    const newValue = !showInDiscovery;
                                                    await supabase.from('profiles').update({ show_in_discovery: newValue }).eq('id', session.user.id);
                                                    setShowInDiscovery(newValue);
                                                    showToast(isCurrentlyHidden ? "Account unhidden." : "Account hidden.", 'success');
                                                } catch (err) {
                                                    showToast("Error updating account visibility.", 'error');
                                                }
                                            }
                                        });
                                    }}
                                    className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 py-3 rounded-xl font-medium border border-yellow-500/30 transition"
                                >
                                    {!showInDiscovery ? "Unhide My Account" : "Hide My Account"}
                                </button>
                                
                                {/* Deactivate Account */}
                                <button 
                                    onClick={() => {
                                        setConfirmModal({
                                            isOpen: true,
                                            title: "Deactivate Account?",
                                            message: "Your account will be deactivated and you won't be able to log in. You can reactivate your account anytime you want. For permanent account deletion, please contact our support team.",
                                            type: "warning",
                                            onConfirm: async () => {
                                                // After confirmation, show input modal for deactivation reason
                                                setInputModal({
                                                    isOpen: true,
                                                    title: "Why are you deactivating your account?",
                                                    placeholder: "Please tell us why (this helps us improve). You can reactivate anytime...",
                                                    onSubmit: async (deactivationReason) => {
                                                        if (!deactivationReason || !deactivationReason.trim()) {
                                                            showToast("Please provide a reason for deactivation.", 'error');
                                                            return;
                                                        }
                                                        
                                                        try {
                                                            // Deactivate the account (don't delete)
                                                            const { error: deactivateError } = await supabase
                                                                .from('profiles')
                                                                .update({
                                                                    is_deactivated: true,
                                                                    deactivated_at: new Date().toISOString(),
                                                                    deactivation_reason: deactivationReason.trim(),
                                                                    show_in_discovery: false // Also hide from discovery
                                                                })
                                                                .eq('id', session.user.id);
                                                            
                                                            if (deactivateError) {
                                                                console.error("Error deactivating account:", deactivateError);
                                                                showToast("Error deactivating account. Please try again.", 'error');
                                                                setInputModal({ ...inputModal, isOpen: false });
                                                                return;
                                                            }
                                                            
                                                            // Log to admin system
                                                            try {
                                                                await supabase
                                                                    .from('admin_logs')
                                                                    .insert({
                                                                        admin_id: null,
                                                                        admin_email: null,
                                                                        action_type: 'account_deactivated',
                                                                        target_type: 'user',
                                                                        target_id: session.user.id,
                                                                        action_details: {
                                                                            reason: deactivationReason.trim(),
                                                                            email: session.user.email,
                                                                            full_name: profile?.full_name
                                                                        }
                                                                    });
                                                            } catch (adminLogError) {
                                                                console.error("Error logging to admin:", adminLogError);
                                                                // Continue even if admin log fails
                                                            }
                                                            
                                                            // Update local state
                                                            setProfile(prev => ({ ...prev, is_deactivated: true }));
                                                            setShowInDiscovery(false);
                                                            
                                                            // Sign out user
                                                            await supabase.auth.signOut();
                                                            showToast("Account deactivated successfully. You can reactivate anytime by logging in again.", 'success');
                                                            
                                                            // Close modal
                                                            setInputModal({ ...inputModal, isOpen: false });
                                                        } catch (err) {
                                                            console.error("Error deactivating account:", err);
                                                            showToast("Error deactivating account. Please try again.", 'error');
                                                        }
                                                    }
                                                });
                                            }
                                        });
                                    }}
                                    className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 py-3 rounded-xl font-medium border border-orange-500/30 transition"
                                >
                                    Deactivate My Account
                                </button>
                            </div>
                            
                            {/* App Version Info */}
                            <div className="border-t border-white/10 pt-6 mt-6">
                                <div className="text-center space-y-1">
                                    <p className="text-xs text-white/50 font-medium">Version 2.2.1</p>
                                    <p className="text-xs text-white/40">© 2026 SacredHearts</p>
                                </div>
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
                             <div className="bg-rose-600 text-white p-4 flex items-center justify-between shadow-sm pt-[max(1rem,env(safe-area-inset-top))]">
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
                                            <MapPin size={10} /> {(activeChatProfile.city || '').split(',')[0].trim()}
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
                             <div className="flex-grow overflow-y-auto p-4 bg-black space-y-3 chat-scroll" style={{
                               backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.03) 0%, transparent 50%),
                                                 radial-gradient(circle at 80% 80%, rgba(255,255,255,0.03) 0%, transparent 50%),
                                                 radial-gradient(circle at 40% 20%, rgba(255,255,255,0.02) 0%, transparent 50%)`,
                               backgroundSize: '100% 100%',
                               backgroundRepeat: 'no-repeat'
                             }}>
                                {chatMessages.map((msg) => {
                                      
                                      // --- 1. DEFINE VARIABLES FOR EACH MESSAGE ---
                                      const isMe = msg.sender_id === session.user.id;
                                      const isImage = msg.type === 'image' || msg.content.startsWith('http');
                                      const isAudio = msg.type === 'audio';

                                      return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            
                                            {/* --- MESSAGE BUBBLE --- */}
                                            <div 
                                              onClick={(e) => handleMessageClick(msg.id, e)}
                                              onPointerDown={(e) => {
                                                // Use pointer events instead of touch events to avoid passive listener warning
                                                if (e.pointerType === 'touch') {
                                                  handleLongPressStart(msg.id, e);
                                                }
                                              }}
                                              onPointerUp={handleLongPressEnd}
                                              onPointerCancel={handleLongPressEnd}
                                              onContextMenu={(e) => {
                                                // Prevent context menu on long-press
                                                e.preventDefault();
                                                handleSelectMessage(msg.id);
                                              }}
                                              style={{ touchAction: 'manipulation' }}
                                              className={`max-w-[75%] rounded-2xl text-sm flex flex-col relative transition-all duration-200 cursor-pointer ${
                                                  isMe ? 'bg-rose-600 text-white rounded-br-none' : 'bg-gray-700 text-white border border-gray-600 rounded-bl-none'
                                              } ${isImage ? 'bg-transparent border-none p-0' : (isAudio ? 'p-2' : 'px-4 py-2')} 
                                              
                                              // --- STYLING IF SELECTED ---
                                              ${selectedMessageId === msg.id ? 'ring-4 ring-rose-300 opacity-90 scale-[0.98]' : ''}
                                            }`}> 
                                                  
                                                {/* --- REPLY INDICATOR (WhatsApp-style) --- */}
                                                {msg.replied_to_id && (() => {
                                                    // Find the replied message in chatMessages (handle number vs string ids safely)
                                                    const repliedMsg = chatMessages.find(m => String(m.id) === String(msg.replied_to_id));
                                                    const repliedContent = repliedMsg 
                                                        ? (repliedMsg.type === 'image' ? '📷 Photo' : 
                                                           repliedMsg.type === 'audio' ? '🎤 Audio' : 
                                                           repliedMsg.content.length > 50 
                                                               ? repliedMsg.content.substring(0, 50) + '...' 
                                                               : repliedMsg.content)
                                                        : 'Message';
                                                    const repliedIsMe = repliedMsg?.sender_id === session.user.id;
                                                    
                                                    return (
                                                        <div className={`text-[10px] mb-2 pb-2 border-l-3 ${
                                                            isMe ? 'border-white/40' : 'border-gray-400/40'
                                                        } pl-2 flex flex-col gap-0.5`}>
                                                            <div className={`flex items-center gap-1 ${
                                                                isMe ? 'text-white/80' : 'text-gray-300'
                                                            }`}>
                                                                <CornerUpLeft size={10} />
                                                                <span className="font-medium">{repliedIsMe ? 'You' : activeChatProfile?.full_name || 'User'}</span>
                                                            </div>
                                                            <div className={`${
                                                                isMe ? 'text-white/60' : 'text-gray-400'
                                                            } truncate`}>
                                                                {repliedContent}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* --- CONTENT --- */}
                                                {isAudio ? (
                                                    <div className="flex items-center gap-2">
                                                        <audio 
                                                            controls 
                                                            src={msg.content} 
                                                            className="w-48 max-w-full h-10"
                                                            preload="metadata"
                                                            onError={(e) => {
                                                                console.error("Audio playback error:", e);
                                                                showToast("Unable to play audio. Please try again.", 'error');
                                                            }}
                                                        >
                                                            Your browser does not support audio element.
                                                        </audio>
                                                    </div>
                                                ) : isImage ? (
                                                    <img 
                                                        src={msg.content} 
                                                        alt="Sent photo" 
                                                        className="rounded-2xl max-w-full object-cover shadow-sm border border-gray-100"
                                                    />
                                                ) : (
                                                    <div className="break-words">{msg.content}</div>
                                                )}

                                                {/* --- TIMESTAMP AND READ RECEIPTS --- */}
                                                {/* Sender messages: timestamp + read receipts */}
                                                {isMe && (
                                                    <div className="flex justify-end items-center gap-1 mt-2 opacity-70">
                                                        <span className={`text-[9px] ${isImage || isAudio ? 'text-white/60' : 'text-white/60'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                        {!isImage && !isAudio && (
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
                                                        )}
                                                    </div>
                                                )}
                                                {/* Receiver messages: timestamp only */}
                                                {!isMe && (
                                                    <div className="flex justify-start items-center gap-1 mt-1 opacity-70">
                                                        <span className="text-[9px] text-gray-300">
                                                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
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
                                  // Validate selectedMessageId format
                                  const selectedId = selectedMessageId.toString();
                                  
                                  const msg = chatMessages.find(m => {
                                    // Use loose comparison first, then strict
                                    if (!m || !m.id) return false;
                                    return m.id.toString() === selectedId || m.id === selectedId || m.id === selectedMessageId;
                                  });
                                  
                                  if (!msg) {
                                    // Message not found - close action sheet
                                    return null;
                                  }

                                  // --- LOCAL VARIABLES FOR ACTION SHEET ---
                                  const isMe = msg.sender_id === session.user.id;
                                  const isImage = msg.type === 'image' || msg.content.startsWith('http');
                                  const isAudio = msg.type === 'audio';

                                  return (
                                    <>
                                      {/* Backdrop */}
                                      <div 
                                        className="fixed inset-0 bg-black/50 z-[60]"
                                        onClick={() => setSelectedMessageId(null)}
                                      />
                                      {/* Action Sheet */}
                                      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-[0_-5px_15px_rgba(0,0,0,0.3)] p-4 z-[70] animate-fade-in-up sm:absolute sm:bottom-auto sm:left-auto sm:right-auto">
                                      
                                          {/* Header */}
                                          <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Selected Message</span>
                                            <button onClick={() => setSelectedMessageId(null)} className="text-gray-400 hover:text-white transition">
                                              <X size={20} />
                                            </button>
                                          </div>

                                          {/* Action Buttons */}
                                          <div className="flex justify-around items-center">
                                            
                                            {/* 1. REPLY */}
                                            <button onClick={() => handleReplyAction(msg)} className="flex flex-col items-center gap-1.5 text-gray-300 hover:text-rose-400 transition">
                                              <div className="p-3 rounded-full bg-gray-700 hover:bg-rose-500/20 transition">
                                                <CornerUpLeft size={22} />
                                              </div>
                                              <span className="text-[10px] font-medium">Reply</span>
                                            </button>

                                            {/* 2. FORWARD */}
                                            <button onClick={handleForwardAction} className="flex flex-col items-center gap-1.5 text-gray-300 hover:text-rose-400 transition">
                                              <div className="p-3 rounded-full bg-gray-700 hover:bg-rose-500/20 transition">
                                                <Share size={22} />
                                              </div>
                                              <span className="text-[10px] font-medium">Forward</span>
                                            </button>

                                            {/* 3. COPY (Only if text) */}
                                            {!isImage && !isAudio && (
                                              <button onClick={() => handleCopyText(msg.content)} className="flex flex-col items-center gap-1.5 text-gray-300 hover:text-rose-400 transition">
                                                <div className="p-3 rounded-full bg-gray-700 hover:bg-rose-500/20 transition">
                                                  <Copy size={22} />
                                                </div>
                                                <span className="text-[10px] font-medium">Copy</span>
                                              </button>
                                            )}

                                            {/* 4. REPORT */}
                                            <button onClick={() => handleReportAction(msg)} className="flex flex-col items-center gap-1.5 text-gray-300 hover:text-rose-400 transition">
                                              <div className="p-3 rounded-full bg-gray-700 hover:bg-rose-500/20 transition">
                                                <Flag size={22} />
                                              </div>
                                              <span className="text-[10px] font-medium">Report</span>
                                            </button>

                                            {/* 5. DELETE FOR YOU (Available for all messages - like WhatsApp/Instagram) */}
                                            <button onClick={() => handleDeleteAction(msg.id)} className="flex flex-col items-center gap-1.5 text-red-400 hover:text-red-300 transition">
                                              <div className="p-3 rounded-full bg-red-900/30 hover:bg-red-900/50 transition">
                                                <Trash2 size={22} />
                                              </div>
                                              <span className="text-[10px] font-medium">Delete for you</span>
                                            </button>

                                          </div>
                                    </div>
                                    </>
                                  );
                             })()}
                             
                             {/* --- INPUT AREA --- */}
                             <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-gray-800 bg-black flex flex-col gap-2">
                                {/* --- TYPING STATUS --- */}
                                <div className="flex justify-between items-center w-full mb-1">
                                    <div></div> {/* Spacer to balance layout */}
                                    {partnerIsTyping && (
                                        <div className="text-xs text-rose-600 font-medium animate-pulse flex items-center gap-1">
                                            <span>typing...</span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* --- REPLY PREVIEW BAR --- */}
                                {replyingTo && (
                                      <div className="flex items-center justify-between bg-rose-900/50 border border-rose-700 rounded-lg p-2 mb-2 animate-fade-in-up">
                                          <div className="flex items-center gap-2 overflow-hidden">
                                              <div className="bg-rose-700 text-white rounded-full p-1">
                                                  <CornerUpLeft size={12} />
                                              </div>
                                              <span className="text-xs text-rose-200 font-medium truncate max-w-[200px]">
                                                  Replying to: {replyingTo.content}
                                              </span>
                                          </div>
                                          <button onClick={() => setReplyingTo(null)} className="text-rose-400 hover:text-rose-300 p-1">
                                              <X size={14} />
                                          </button>
                                      </div>
                                )}
                                
                                {/* --- ICEBREAKER PROMPTS (Show when NOT matched) --- */}
                                {activeChatProfile && (() => {
                                  const match = myMatches.find(m => 
                                    (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
                                    (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
                                  );
                                  
                                  // Only show if not matched (status is 'pending') and under 3 messages
                                  if (match && match.status === 'mutual') return null;
                                  
                                  // Parse prompts
                                  let prompts = [];
                                  if (activeChatProfile.icebreaker_prompts) {
                                    try {
                                      prompts = typeof activeChatProfile.icebreaker_prompts === 'string' 
                                        ? JSON.parse(activeChatProfile.icebreaker_prompts || '[]')
                                        : (Array.isArray(activeChatProfile.icebreaker_prompts) ? activeChatProfile.icebreaker_prompts : []);
                                    } catch (e) {
                                      console.error("Error parsing prompts:", e);
                                    }
                                  }
                                  
                                  if (prompts.length === 0) return null;
                                  
                                  // Check message limit
                                  const canSendMore = preMatchMessageCount < 3;
                                  
                                  if (!canSendMore) {
                                    return (
                                      <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-3 mb-2">
                                        <p className="text-xs text-yellow-200 font-medium text-center">
                                          You've sent 3 messages. Wait for them to connect to continue chatting! 💌
                                        </p>
                                      </div>
                                    );
                                  }
                                  
                                  return (
                                    <div className="mb-2">
                                      <p className="text-xs text-gray-300 mb-2 font-medium">
                                        💬 Start a conversation ({preMatchMessageCount}/3 messages used)
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {prompts.slice(0, 3).map((prompt, idx) => (
                                          <button
                                            key={idx}
                                            onClick={() => sendIcebreakerPrompt(prompt)}
                                            className="text-xs bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-lg transition font-medium"
                                          >
                                            {prompt}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}
                                
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
                                                onChange={handleCameraCapture}
                                            />
                                        </>
                                    )}

                                    <textarea 
                                        ref={chatInputRef}
                                        rows="1" 
                                        style={{
                                          maxHeight: '120px',
                                          minHeight: '40px',
                                          resize: 'none'
                                        }}
                                        className={`flex-grow px-4 py-2 outline-none focus:ring-1 focus:ring-rose-100 resize-none bg-gray-900 text-white placeholder-gray-400 border border-gray-700 ${
                                          isTextareaExpanded ? 'rounded-xl' : 'rounded-full'
                                        } ${
                                          (() => {
                                            const match = myMatches.find(m => 
                                              (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
                                              (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
                                            );
                                            if (match && match.status !== 'mutual' && preMatchMessageCount >= 3) {
                                              return 'opacity-50 cursor-not-allowed';
                                            }
                                            return '';
                                          })()
                                        }`}
                                        placeholder={
                                          (() => {
                                            const match = myMatches.find(m => 
                                              (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
                                              (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
                                            );
                                            if (match && match.status !== 'mutual' && preMatchMessageCount >= 3) {
                                              return "3-message limit reached. Wait for them to connect...";
                                            }
                                            return "Type a message...";
                                          })()
                                        }
                                        value={inputText} 
                                        onChange={handleInputChange} 
                                        onKeyDown={(e) => { 
                                          const match = myMatches.find(m => 
                                            (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
                                            (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
                                          );
                                          if (match && match.status !== 'mutual' && preMatchMessageCount >= 3) {
                                            e.preventDefault();
                                            return;
                                          }
                                          if (e.key === 'Enter' && !e.shiftKey) { 
                                            e.preventDefault(); 
                                            sendMessage();
                                          }
                                        }}
                                        disabled={
                                          (() => {
                                            const match = myMatches.find(m => 
                                              (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
                                              (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
                                            );
                                            return match && match.status !== 'mutual' && preMatchMessageCount >= 3;
                                          })()
                                        }
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
                                                multiple
                                                onChange={handleGallerySelect}
                                            />
                                            
                                            {/* HOLD TO RECORD (Mic) - Right side */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {isRecording && (
                                                    <div className="flex items-center gap-1 bg-red-100 px-3 py-1.5 rounded-full">
                                                        {/* Audio Waveform Visualization */}
                                                        {audioLevels.length > 0 && (
                                                            <div className="flex items-center gap-0.5 h-4">
                                                                {audioLevels.slice(0, 8).map((level, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className="bg-red-500 rounded-full transition-all duration-75"
                                                                        style={{
                                                                            width: '2px',
                                                                            height: `${Math.max(2, (level / 255) * 12)}px`
                                                                        }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                        <span className="text-xs text-red-600 font-medium">Recording...</span>
                                                    </div>
                                                )}
                                                <button 
                                                    onPointerDown={startRecording}
                                                    onPointerUp={stopRecording}
                                                    onTouchStart={startRecording}
                                                    onTouchEnd={stopRecording}
                                                    disabled={!activeChatProfile || uploading}
                                                    className={`p-2 rounded-full transition flex-shrink-0 ${
                                                        isRecording 
                                                            ? 'bg-red-500 text-white animate-pulse' 
                                                            : 'text-gray-400 hover:text-rose-500'
                                                    } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    aria-label="Hold to Record"
                                                >
                                                    <Mic size={20} />
                                                </button>
                                            </div>
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

                             {/* --- CAMERA PREVIEW MODAL (WhatsApp-style) --- */}
                             {cameraPreview && (
                                <div className="fixed inset-0 bg-black z-[70] flex flex-col">
                                    <div className="flex-1 flex items-center justify-center p-4">
                                        <img 
                                            src={cameraPreview.preview} 
                                            alt="Preview" 
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                    <div className="bg-gray-900 p-4 flex items-center justify-between gap-4">
                                        <button
                                            onClick={() => setCameraPreview(null)}
                                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition"
                                        >
                                            Cancel
                                        </button>
                                        
                                        {/* Quality Selector */}
                                        <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg">
                                            <button
                                                onClick={() => setImageQuality(imageQuality === 'hd' ? 'low' : 'hd')}
                                                className={`px-3 py-1 rounded text-xs font-medium transition ${
                                                    imageQuality === 'hd' 
                                                        ? 'bg-rose-600 text-white' 
                                                        : 'bg-gray-700 text-gray-300'
                                                }`}
                                            >
                                                {imageQuality === 'hd' ? 'HD' : 'Low'}
                                            </button>
                                        </div>
                                        
                                        <button
                                            onClick={sendCameraImage}
                                            disabled={sendingImages[cameraPreview.id] === 'sending'}
                                            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {sendingImages[cameraPreview.id] === 'sending' ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    <span>Sending...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Check size={18} />
                                                    <span>Send</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                             )}

                             {/* --- GALLERY PREVIEW MODAL (WhatsApp-style) --- */}
                             {galleryPreview.length > 0 && (
                                <div className="fixed inset-0 bg-black z-[70] flex flex-col">
                                    <div className="flex-1 overflow-y-auto p-4">
                                        <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto">
                                            {galleryPreview.map((image) => (
                                                <div key={image.id} className="relative aspect-square group">
                                                    <img 
                                                        src={image.preview} 
                                                        alt="Preview" 
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                    
                                                    {/* Remove button */}
                                                    <button
                                                        onClick={() => removeGalleryImage(image.id)}
                                                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                    
                                                    {/* Status overlay */}
                                                    {image.status === 'sending' && (
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                                        </div>
                                                    )}
                                                    
                                                    {image.status === 'sent' && (
                                                        <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center rounded-lg">
                                                            <Check size={24} className="text-white" />
                                                        </div>
                                                    )}
                                                    
                                                    {image.status === 'error' && (
                                                        <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center rounded-lg">
                                                            <AlertTriangle size={24} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-900 p-4 flex items-center justify-between gap-4 border-t border-gray-800">
                                        <button
                                            onClick={() => setGalleryPreview([])}
                                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition"
                                        >
                                            Cancel
                                        </button>
                                        
                                        {/* Quality Selector */}
                                        <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg">
                                            <button
                                                onClick={() => setImageQuality(imageQuality === 'hd' ? 'low' : 'hd')}
                                                className={`px-3 py-1 rounded text-xs font-medium transition ${
                                                    imageQuality === 'hd' 
                                                        ? 'bg-rose-600 text-white' 
                                                        : 'bg-gray-700 text-gray-300'
                                                }`}
                                            >
                                                {imageQuality === 'hd' ? 'HD' : 'Low'}
                                            </button>
                                        </div>
                                        
                                        <button
                                            onClick={() => sendGalleryImages()}
                                            disabled={galleryPreview.every(img => img.status === 'sending' || img.status === 'sent')}
                                            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {galleryPreview.some(img => img.status === 'sending') ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    <span>Sending...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Check size={18} />
                                                    <span>Send {galleryPreview.filter(img => img.status === 'pending').length} Photo{galleryPreview.filter(img => img.status === 'pending').length !== 1 ? 's' : ''}</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                             )}
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
                                        {targetProfile.is_verified && <VerifiedBadge size="sm" />}
                                    </div>
                                    <p className="text-rose-600 font-medium text-sm flex items-center gap-1 mt-1">
                                        <MapPin size={14} /> {(targetProfile.city || '').split(',')[0].trim()}
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

                            {/* --- ICEBREAKER PROMPTS (Display on Profile View) --- */}
                            {targetProfile.icebreaker_prompts && (() => {
                                let prompts = [];
                                try {
                                    prompts = typeof targetProfile.icebreaker_prompts === 'string' 
                                        ? JSON.parse(targetProfile.icebreaker_prompts || '[]')
                                        : (Array.isArray(targetProfile.icebreaker_prompts) ? targetProfile.icebreaker_prompts : []);
                                } catch (e) {
                                    console.error("Error parsing icebreaker prompts:", e);
                                }
                                
                                if (prompts.length > 0) {
                                    return (
                                        <div className="mb-8">
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                                <HelpCircle size={16} />
                                                Conversation Starters
                                            </h3>
                                            <div className="space-y-2">
                                                {prompts.slice(0, 3).map((prompt, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            // If matched, just set the text for normal message
                                                            if (isTargetProfileMatched) {
                                                                // Go to chat and set the prompt
                                                                const match = myMatches.find(m => 
                                                                    (m.user_a_id === session.user.id && m.user_b_id === targetProfile.id) ||
                                                                    (m.user_b_id === session.user.id && m.user_a_id === targetProfile.id)
                                                                );
                                                                if (match) {
                                                                    setActiveChatProfile(targetProfile);
                                                                    setView('chat');
                                                                    setTimeout(() => {
                                                                        setInputText(prompt);
                                                                        if (chatInputRef.current) chatInputRef.current.focus();
                                                                    }, 100);
                                                                }
                                                            } else {
                                                                // Not matched - send as icebreaker (max 3)
                                                                sendIcebreakerPrompt(prompt, targetProfile.id);
                                                            }
                                                        }}
                                                        className="w-full text-left bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl transition text-sm font-medium"
                                                    >
                                                        💬 {prompt}
                                                    </button>
                                                ))}
                                            </div>
                                            {!isTargetProfileMatched && (
                                                <p className="text-xs text-gray-500 mt-2 italic">
                                                    You can send up to 3 messages before connecting
                                                </p>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            })()}

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
                  {view !== 'chat' && !showFilters && (<DashboardFooter currentView={view} setView={setView} unreadMessageCount={unreadMessageCount} />)}
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
                                if (session && profile && profile.gender) {
                                  fetchCandidates(session.user.id, profile.gender, profile);
                                } 
                            }} className="w-full bg-rose-600 text-white font-bold py-3 rounded-lg shadow-lg">
                                Apply Filters
                            </button>
                        </div>
                      </div>
                    </div> 
                    )}    

                    {viewingStory && (
                      <StoryOverlay 
                          key={viewingStories?.length ? viewingStories[0].user_id : 'none'}
                          story={viewingStory}
                          stories={viewingStories}
                          initialIndex={initialStoryIndex}
                          onClose={closeStory}
                          onStoryViewed={(storyId, storyOwnerId) => {
                            setViewedStoryViews(prev => [...prev, { story_id: storyId, story_owner_id: storyOwnerId }]);
                          }}
                          currentUserId={session?.user?.id}
                          matchedUserId={viewingStory?.user_id}
                      />
                    )}
                    
                    {/* Image Crop Modal */}
                    {showCropModal && cropImageSrc && (
                      <ImageCropModal
                        imageSrc={cropImageSrc}
                        onClose={handleCropClose}
                        onCropComplete={handleCropComplete}
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

function calculateAge(dateString) { 
  if (!dateString) return ""; 
  
  // Parse date string (YYYY-MM-DD format) and create date in local timezone
  // This prevents timezone issues that cause age to be off by 1
  const parts = dateString.split('-');
  if (parts.length !== 3) return "";
  
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const birthDay = parseInt(parts[2], 10);
  
  // Create dates in local timezone to avoid UTC conversion issues
  const today = new Date();
  const birthDate = new Date(birthYear, birthMonth, birthDay);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // If birthday hasn't occurred this year yet, subtract 1 from age
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

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