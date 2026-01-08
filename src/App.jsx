import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { Heart, Church, Save, MapPin, User, X, MessageCircle, ArrowLeft, LogOut, Edit, Check, CheckCheck, EllipsisVertical, Trash2, AlertTriangle, Eye, EyeOff,  SlidersHorizontal, Lock } from 'lucide-react'

function App() {
  // --- STATES ---
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('discovery') // 'discovery', 'matches', 'stats', 'chat', 'setup', 'profile'
  const [realtimeChannel, setRealtimeChannel] = useState(null)
  const [stats, setStats] = useState({ users: 0, matches: 0, messages: 0 })
  const [isSignupSuccess, setIsSignupSuccess] = useState(false)

  // Auth & Form States
  const [authMode, setAuthMode] = useState('login') 
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [gender, setGender] = useState('')
  const [city, setCity] = useState('')
  const [religion, setReligion] = useState('')
  const [denomination, setDenomination] = useState('')
  const [intent, setIntent] = useState('')
  const [bio, setBio] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('') 

  // Old Password State 
  const [oldPassword, setOldPassword] = useState('')

// Show Password State
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  //Password Changed Stat
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  //Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [resetEmail, setResetEmail] = useState('') 

// Password Reset State
  const [newResetPass, setNewResetPass] = useState('')
  const [confirmResetPass, setConfirmResetPass] = useState('')

  // --- LOGIN WALLPAPER STYLE ---

  const loginWallpaperStyle = {
    backgroundColor: '#fff1f2', // Base light rose color
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 20c-8 0-15 10-15 20s10 20 15 20 15-10 15-20-7-20-15-20z' fill='%23fb7185' fill-opacity='0.08'/%3E%3Cpath d='M40 20c-6-6-12 2-12 8s6 12 12 12 12-6 12-12-6-14-12-8z' fill='%23fb7185' fill-opacity='0.08'/%3E%3C/svg%3E")`,
  }
  
  // ---  STATES FOR IMAGE UPLOAD ---
  const [avatarFile, setAvatarFile] = useState(null) // Stores the actual file object
  const [uploading, setUploading] = useState(false) // To show a loading spinner
  const [previewUrl, setPreviewUrl] = useState(null) // To show image preview before saving

  // Discovery States
  const [candidates, setCandidates] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)

  // Matches & Chat States
  const [myMatches, setMyMatches] = useState([])
  const [partnerProfiles, setPartnerProfiles] = useState([])
  const [activeChatProfile, setActiveChatProfile] = useState(null)
  const [partnerIsTyping, setPartnerIsTyping] = useState(false) 
  const typingChannelRef = useRef(null)
  const partnerTypingTimeout = useRef(null)

    // Discovery Filters State
  const [showFilters, setShowFilters] = useState(false)
  const [filterCity, setFilterCity] = useState('') 
  const [filterReligion, setFilterReligion] = useState('') 

  const messageChannelRef = useRef(null)
  const presenceChannelRef = useRef(null)

  //Geographical States
  const [userCoords, setUserCoords] = useState({ lat: null, long: null })

  const [filterDistance, setFilterDistance] = useState(null) 

  const [blockedUsers, setBlockedUsers] = useState([])

  
  const [chatMessages, setChatMessages] = useState([])
  const [inputText, setInputText] = useState("")
  
  // UPGRADE: Online Status State
  const [isPartnerOnline, setIsPartnerOnline] = useState(false)

  // UPGRADE: Password Visibility State
  const [showPassword, setShowPassword] = useState(false)

  // UPGRADE: Unread Counts State
  const [unreadCounts, setUnreadCounts] = useState({})

    // Global Presence (App-Wide Online Status)
  const [onlineUsers, setOnlineUsers] = useState([]) 
  const globalPresenceChannelRef = useRef(null)

  const messagesEndRef = useRef(null)
  const chatInputRef = useRef(null)
  
  // Tracks which chat was last opened (prevents unread badge coming back)
  const [lastOpenedChatId, setLastOpenedChatId] = useState(null)

  // 1. INITIALIZE SESSION
  useEffect(() => {
    // Check URL hash for Supabase tokens (access_token)
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      // If we see an access token, we are likely in a reset flow.
      // Force the view to reset-password immediately to avoid race conditions.
      setView('reset-password');
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        fetchStats();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        // --- LISTEN FOR PASSWORD RECOVERY EVENT ---
        // Supabase fires this specific event when reset link is clicked
        if (_event === 'PASSWORD_RECOVERY') {
            setView('reset-password');
        } 
        else {
            setSession(session);
            if (session) fetchProfile(session.user.id);
            else setLoading(false);
        }
    });

    return () => subscription.unsubscribe();
  }, [])


  // 2. LOAD FILTERS FROM STORAGE
  useEffect(() => {
    const savedCity = localStorage.getItem('sacred_city_filter');
    const savedReligion = localStorage.getItem('sacred_religion_filter');
    const savedDistance = localStorage.getItem('sacred_distance_filter');
    if (savedCity) {
        setFilterCity(savedCity)
    }
    if (savedReligion) {
        setFilterReligion(savedReligion)
    }
    if (savedDistance) { setFilterDistance(savedDistance) } 
  }, [])


  const handleBackToLogin = async () => {
    // 1. Force Sign Out
    // This clears the current session and any URL tokens (#access_token=...)
    // ensuring the user starts completely fresh at the login page.
    await supabase.auth.signOut()
    
    // 2. Reset States (optional, good for cleanup)
    setNewResetPass('')
    setConfirmResetPass('')

    // 3. Go to Login View
    setView('login')
  }

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault()

    if (newResetPass.length < 6) {
        alert("Password must be at least 6 characters.")
        return
    }

    if (newResetPass !== confirmResetPass) {
        alert("Passwords do not match.")
        return
    }

    setLoading(true)

    try {
      // If the user clicked the email link, they are technically already authorized via URL token.
      // So we can just update the user directly.
      const { error } = await supabase.auth.updateUser({ 
        password: newResetPass 
      })

      if (error) throw error
      
      alert("Password updated successfully! You can now log in.")
      setView('login') // Send them back to login
      
    } catch (error) {
      alert("Error updating password: " + error.message)
    } finally {
      setLoading(false)
    }
  }



  const handleResendEmail = async () => {
    if (!email) {
        alert("Please enter your email address first.")
        return
    }
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
    })
    if (error) {
        alert(error.message)
    } else {
        alert("Verification email sent again! Please check your Spam folder.")
    }
  }


  const [rememberMe, setRememberMe] = useState(true) // Default to true (Supabase default)

// Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault()
    
    if (!resetEmail || !resetEmail.includes('@')) {
        alert("Please enter a valid email address.")
        return
    }

    setLoading(true)

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail)
        if (error) throw error
        
        alert("Password reset link sent to " + resetEmail + "! Check your inbox.")
        setShowForgotModal(false) // Close modal
    } catch (error) {
        alert("Error sending reset link: " + error.message)
    } finally {
        setLoading(false)
    }
  }

  // --- GLOBAL PRESENCE ---
  // This runs when user logs in and joins a global room "app-presence"
  useEffect(() => {
    if (!session) return

    const channel = supabase.channel('app-presence')

    channel
      .on('presence', { event: 'sync' }, () => {
        // This function runs whenever list of online users changes
        const state = channel.presenceState()
        
        // FIX: Extract user_ids from the VALUES (payloads), not the keys
        const userIds = new Set()
        
        Object.values(state).forEach(presences => {
          if (Array.isArray(presences)) {
            presences.forEach(p => {
              if (p.user_id) userIds.add(p.user_id)
            })
          } else if (presences && presences.user_id) {
              userIds.add(presences.user_id)
          }
        })

        setOnlineUsers(Array.from(userIds))
      })
      .subscribe(async (status) => {
        // When *I* subscribe, tell everyone I am here
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: session.user.id,
            online_at: new Date().toISOString(),
          })
        }
      })

    globalPresenceChannelRef.current = channel

    // Cleanup: Only remove this when logging out, not changing views
    return () => {
      if (globalPresenceChannelRef.current) {
        supabase.removeChannel(globalPresenceChannelRef.current)
      }
    }
  }, [session])

  // --- NOTIFICATION HELPERS ---
  // 1. Request permission on load
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      // We don't ask immediately; we wait for a user interaction (like a click) usually,
      // but here we will create a function to call later.
    }
  }, [])

  // 2. Function to show the notification
  const showNotification = (title, body, icon) => {
    // Check if permission is granted
    if (Notification.permission === "granted") {
      // Trigger the system notification
      new Notification(title, {
        body: body,
        icon: icon || `https://api.dicebear.com/7.x/avataaars/svg?seed=SacredHearts&backgroundColor=b6e3f4`
      })
    } 
    // If permission is not granted yet, ask once
    else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(title, {
            body: body,
            icon: icon
          })
        }
      })
    }
  }


  // --- GET USER LOCATION ---
  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            long: position.coords.longitude
          })
        },
        (error) => {
          console.log("Location access denied or error:", error)
          alert("Location access is needed to find nearby matches.")
        }
      )
    } else {
      alert("Geolocation is not supported by your browser.")
    }
  }



  // --- IMAGE UPLOAD HELPER ---
  async function uploadAvatar(file) {
    try {
      setUploading(true)      

      // 1. Create a unique file name (random string + extension)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      // 2. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // 3. Get the Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      alert('Error uploading image: ' + error.message)
      return null
    } finally {
      setUploading(false)
    }
  }

    // --- HANDLE FILE SELECTION ---
  const handleFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
        return
    }
    const file = e.target.files[0]
    setAvatarFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }



  // 2. FETCH PROFILE
  async function fetchProfile(userId) {
    try {
      const { data: myProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
             console.warn("Profile deleted or missing. Signing out.")
             supabase.auth.signOut()
             return
        }
        throw profileError
      }

      const age = myProfile.date_of_birth ? calculateAge(myProfile.date_of_birth) : 0
      if (age > 0 && age < 18) {
          alert("Access Denied: You must be at least 18 years old to use SacredHearts.")
          await supabase.auth.signOut()
          setLoading(false)
          return
      }

      setProfile(myProfile)
      
      if(myProfile?.full_name) setFullName(myProfile.full_name)
      if(myProfile?.gender) setGender(myProfile.gender)
      if(myProfile?.city) setCity(myProfile.city)
      if(myProfile?.religion) setReligion(myProfile.religion)
      if(myProfile?.denomination) setDenomination(myProfile.denomination)
      if(myProfile?.intent) setIntent(myProfile.intent)
      if(myProfile?.bio) setBio(myProfile.bio)
      if(myProfile?.date_of_birth) setDateOfBirth(myProfile.date_of_birth)

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

  const fetchStats = async () => {
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: matchCount } = await supabase.from('matches').select('*', { count: 'exact', head: true })
    const { count: msgCount } = await supabase.from('messages').select('*', { count: 'exact', head: true })
    setStats({ users: userCount || 0, matches: matchCount || 0, messages: msgCount || 0 })
  }


  // 3. FETCH POTENTIAL MATCHES (SMART VERSION: GPS or City Fallback) (BLOCKING INCLUDED)
  async function fetchCandidates(myId, myGender, myCurrentProfile) {
    const targetGender = myGender === 'male' ? 'female' : 'male'

    // A. Get existing matches to exclude them
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('user_a_id, user_b_id')
      .or(`user_a_id.eq.${myId},user_b_id.eq.${myId}`)

    const matchedIds = existingMatches
      ? existingMatches.map(m => m.user_a_id === myId ? m.user_b_id : m.user_a_id)
      : []

    // B. Get BLOCKED users to exclude them (NEW)
    const { data: blocked } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', myId)

    const blockedIds = blocked ? blocked.map(b => b.blocked_id) : []

    // Combine lists: You don't want to see people you already Matched OR Blocked
    const excludeIds = [...matchedIds, ...blockedIds]

    // --- DECISION: GPS or City? ---
    const hasLocation = myCurrentProfile?.lat && myCurrentProfile?.long;

    // Create the query builder
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('gender', targetGender)
      .neq('id', myId)

    // Apply exclusion only if we have people to exclude
    if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`)
    }


    // ---  APPLY FILTERS ---    
    // 1. City Filter: Strict City mode
    if (filterCity) {
        query = query.eq('city', filterCity)
    } 
    // 2. Distance Filter: Radar Mode (Ignore cities, just look nearby)
    else if (filterDistance) {
        // Don't filter by SQL city. We will filter in JavaScript below.
        // This allows us to see people in nearby cities.
    } 
    // 3. Default Fallback: My City mode (if no filters and no GPS)
    else if (!hasLocation) {
        query = query.eq('city', myCurrentProfile?.city)
    }

    // Apply Religion to all modes
    if (filterReligion) {
        query = query.eq('religion', filterReligion)
    }


    if (hasLocation) {
        // --- METHOD A: GPS ---
        const { data: profiles, error } = await query.order('updated_at', { ascending: false }) // Order by date initially, we sort by distance locally
        
        if (error) console.error('Error fetching candidates:', error)
        else {
            const candidatesWithDistance = profiles
              .filter(p => p.lat && p.long) 
              .map(p => {
                const dist = calculateDistance(myCurrentProfile.lat, myCurrentProfile.long, p.lat, p.long)
                return { ...p, distance: dist }
              })
              .sort((a, b) => a.distance - b.distance)

              // --- APPLY DISTANCE CUTOFF ---
              let finalCandidates = candidatesWithDistance
              if (filterDistance) {
                  // Only show users within selected radius (e.g., 50km)
                  finalCandidates = candidatesWithDistance.filter(p => p.distance <= parseInt(filterDistance))
              }

              setCandidates(finalCandidates || [])
              setCurrentIndex(0)
        }
    } else {
        // --- METHOD B: CITY ---
        const { data, error } = await query
          .eq('city', myCurrentProfile?.city)
          .order('updated_at', { ascending: false })

        if (error) console.error('Error fetching candidates:', error)
        else {
            setCandidates(data || [])
            setCurrentIndex(0)
        }
    }
  }

  // Helper function to replicate the SQL math in JavaScript for sorting
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2-lat1);  
    const dLon = deg2rad(lon2-lon1); 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  }

  function deg2rad(deg) {
    return deg * (Math.PI/180)
  }


  // --- BLOCKED USERS LOGIC ---

  const fetchBlockedUsers = async () => {
    if (!session) return

    try {
      // 1. Get the list of IDs I blocked
      const { data: blocks, error: blockError } = await supabase
        .from('blocks')
        .select('id, blocked_id')
        .eq('blocker_id', session.user.id)

      if (blockError) throw blockError

      if (!blocks || blocks.length === 0) {
        setBlockedUsers([])
        return
      }

      // 2. Get the Profile details (name, photo) for those IDs
      const blockedIds = blocks.map(b => b.blocked_id)
      
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', blockedIds)

      if (profileError) throw profileError

      // 3. Merge data so we know which ID corresponds to which block record
      const merged = blocks.map(block => {
        const profile = profiles.find(p => p.id === block.blocked_id)
        return { ...block, profile }
      })

      setBlockedUsers(merged)

    } catch (error) {
      console.error("Error fetching blocked users:", error)
    }
  }

  const handleUnblock = async (blockId) => {
    if (!window.confirm("Are you sure you want to unblock this user? They may appear in Discovery again.")) return

    try {
      // Delete the block record
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', blockId)

      if (error) throw error

      // Refresh the list
      fetchBlockedUsers()
      alert("User unblocked.")

    } catch (error) {
      console.error("Error unblocking:", error)
      alert("Could not unblock user.")
    }
  }


  // 4. FETCH MY MATCHES (WITH UNREAD LOGIC - ROBUST VERSION)
  const fetchMyMatches = async () => {
    // Safety check
    if (!session) {
        console.warn("No session in fetchMyMatches. Skipping.")
        // Set defaults to prevent crash
        setMyMatches([])
        setPartnerProfiles([])
        setUnreadCounts({})
        return
    }
    
    try {
    const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('*') 
        .or(`user_a_id.eq.${session.user.id},user_b_id.eq.${session.user.id}`)
        .or('status.eq.mutual,status.eq.pending') // Now it fetches both types

        if (matchError) {
            console.error("Error fetching matches:", matchError)
            // --- SAFETY: If DB fails, reset state to empty arrays to prevent crash in UI
            setMyMatches([])
            setPartnerProfiles([])
            setUnreadCounts({})
            return
        }

        if (!matches || matches.length === 0) {
            setMyMatches(matches)
            setPartnerProfiles([])
            setUnreadCounts({})
            return
        }
        
        // Logic to calculate Partner IDs
        const partnerIds = matches.map((m) => {
            return m.user_a_id === session.user.id ? m.user_b_id : m.user_a_id
        })
        const uniquePartnerIds = [...new Set(partnerIds)]

        // Fetch partner profiles
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', uniquePartnerIds)

        if (profileError) {
            console.error("Error fetching partner profiles:", profileError)
            // --- SAFETY: If DB fails, reset state
            setMyMatches(matches) // Keep the matches we have
            setPartnerProfiles([])
            setUnreadCounts({})
            return
        }

        // Only set state if we have data
        if (profiles) {
            setMyMatches(matches)
            setPartnerProfiles(profiles)
        }

        // UPGRADE: Calculate Unread Counts for each match
        const counts = {}
        
        if (matches && matches.length > 0) {
            // Create an array of promises to run all at once
            const countPromises = matches.map(async (match) => {
                const partnerId = match.user_a_id === session.user.id ? match.user_b_id : match.user_a_id
                
                // Look for messages sent BY partner, not read
                const { count } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('match_id', match.id)
                    .neq('sender_id', session.user.id)
                    .is('read_at', null)

                // Store result in temporary object
                return { partnerId, count }
            })

            // Wait for ALL checks to finish in parallel
            const results = await Promise.all(countPromises)

            // Update state once
            results.forEach(({ partnerId, count }) => {
                if (count > 0 && partnerId !== lastOpenedChatId) {
                    counts[partnerId] = count
                }
            })
        }
        
        setUnreadCounts(counts)
    } catch (error) {
        // Catch-all error handler to prevent ANY crash
        console.error("Critical error in fetchMyMatches:", error)
        // --- SAFETY: Reset to empty state to prevent blank page
        setMyMatches([])
        setPartnerProfiles([])
        setUnreadCounts({})
    }
  }

  useEffect(() => {
    if (view === 'matches' && session) {
        fetchMyMatches()
    }
  }, [view, lastOpenedChatId]) // ADD DEPENDENCY: Refresh matches when we switch tabs (optional but good practice)


  // --- HANDLERS ---
  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    // --- AUTH LOGIC ---
    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        alert("Invalid email or password.")
      }
    } else if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: 'New User' } }
      })
      if (error) {
        alert(error.message)
      } else {
        alert('Check your email for confirmation!')
      }
    }
    setLoading(false)
  }


  // --- ADD THIS EFFECT ---
  // When user enters Setup or Profile page, try to get their location
  useEffect(() => {
    if (view === 'setup' || view === 'profile') {
        getUserLocation()
    }
  }, [view])


  const handlePasswordUpdate = async (e) => {
    e.preventDefault()

    if (!oldPassword) {
        alert("Please enter your current password.")
        return
    }
    if (newPassword.length < 6) {
        alert("New password must be at least 6 characters long.")
        return
    }
    if (newPassword !== confirmPassword) {
        alert("New passwords do not match.")
        return
    }

    setLoading(true)

    try {
      
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      })
      
      if (error) throw error
      
      alert("Password updated successfully!")
      setView('profile') // Go back to profile
      // Clear fields
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
    } catch (error) {
      alert("Error updating password: " + error.message)
    } finally {
      setLoading(false)
    }
  }


  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!session) return
    
    if (!dateOfBirth) {
        alert("Please enter your Date of Birth.")
        return
    }
    
    const age = calculateAge(dateOfBirth)
    if (age < 18) {
        alert("You must be at least 18 years old to create an account on SacredHearts.")
        return
    }

    setLoading(true)
    let finalAvatarUrl = profile?.avatar_url // Default to existing URL

    // 1. CHECK IF WE NEED TO UPLOAD A NEW IMAGE
    if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile)
        if (uploadedUrl) {
            finalAvatarUrl = uploadedUrl
        } else {
            setLoading(false)
            return // Stop if upload failed
        }
    }

    // 2. SAVE PROFILE DATA (INCLUDING NEW IMAGE URL)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName, 
        gender, city, religion, denomination, intent, bio,
        date_of_birth: dateOfBirth,
        avatar_url: finalAvatarUrl, // SAVE THE NEW IMAGE URL
       //ADDED LAT/LONG
        lat: userCoords.lat,
        long: userCoords.long,

        updated_at: new Date(),
      })
      .eq('id', session.user.id)

    if (error) alert(error.message)
    else {
      alert(view === 'setup' ? 'Profile Saved!' : 'Profile Updated!')
      
      // Clear local file states
      setAvatarFile(null)
      setPreviewUrl(null)

      if (view === 'setup') setView('discovery')
      else setView('discovery')
      fetchProfile(session.user.id) // Reload to see the new photo
    }
    setLoading(false)

  }


  const handlePass = () => {
    setCurrentIndex(prev => prev + 1)
  }

  const handleConnect = async () => {
    const targetUser = candidates[currentIndex]
    if (!targetUser) return
    setLoading(true)
    const { data: matchesData, error: checkError } = await supabase
      .from('matches')
      .select('*')
      .eq('user_a_id', targetUser.id)
      .eq('user_b_id', session.user.id)
      .limit(1)
    const existingMatch = matchesData ? matchesData[0] : null
    if (checkError) {
        console.error("Error checking match:", checkError)
        setLoading(false)
        return
    }
    if (existingMatch) {
      await supabase.from('matches').update({ status: 'mutual' }).eq('id', existingMatch.id)
      await supabase.from('matches').insert({
        user_a_id: session.user.id,
        user_b_id: targetUser.id,
        status: 'mutual'
      })
      
      showNotification(
        "🎉 It's a Match!", 
        `You matched with ${targetUser.full_name}. Say hello!`
      )
    } else {
      alert("Connection Requested! 💌")
      const { error } = await supabase.from('matches').insert({
        user_a_id: session.user.id,
        user_b_id: targetUser.id,
        status: 'pending'
      })
      if (error) console.error("Error liking:", error)
      setLoading(false) 
    }
    setCurrentIndex(prev => prev + 1)
    setLoading(false)
  }

  // --- CHAT LOGIC ---

  // --- 1. UNMATCH (Soft Delete: Can meet again) ---
  const handleUnmatch = async (partnerId) => {
    if (!window.confirm("Are you sure you want to unmatch this user? You might see them again in discovery.")) return

    try {
      const match = myMatches.find(m =>
        (m.user_a_id === session.user.id && m.user_b_id === partnerId) ||
        (m.user_b_id === session.user.id && m.user_a_id === partnerId)
      )

      if (!match) return

      // Just delete the match row
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', match.id)

      if (error) throw error

      // Cleanup UI
      setPartnerProfiles(prev => prev.filter(p => p.id !== partnerId))
      setUnreadCounts(prev => {
        const copy = { ...prev }
        delete copy[partnerId]
        return copy
      })
      setMyMatches(prev => prev.filter(m => m.id !== match.id))
      
      alert("Unmatched successfully.")
    } catch (err) {
      console.error("Unmatch error:", err)
      alert("Could not unmatch.")
    }
  }


  // --- ACCEPT REQUEST ---
  const handleAcceptRequest = async (matchId, partnerId) => {
    try {
      // 1. Update the existing request to 'mutual'
      const { error } = await supabase
        .from('matches')
        .update({ status: 'mutual' })
        .eq('id', matchId)

      if (error) throw error

      // 2. Insert the reciprocal row (so we can chat)
      await supabase
        .from('matches')
        .insert({
          user_a_id: session.user.id,
          user_b_id: partnerId,
          status: 'mutual'
        })

      // 3. Refresh the list to move them to 'Mutual'
      fetchMyMatches()

      // 4. Alert user
      alert("🎉 It's a Match!")

    } catch (err) {
      console.error("Error accepting request:", err)
      alert("Could not accept match.")
    }
  }

  // --- REJECT REQUEST ---
  const handleRejectRequest = async (matchId) => {
    if (!window.confirm("Are you sure you want to decline this request?")) return

    try {
      // Just delete the request
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId)

      if (error) throw error

      fetchMyMatches()
    } catch (err) {
      console.error("Error rejecting request:", err)
    }
  }


  // --- REPORT USER ---
  const handleReportUser = async (reportedId) => {
    // 1. Ask for a reason
    const reason = window.prompt("Why are you reporting this user? (Spam, Harassment, Inappropriate, etc.)")
    
    if (!reason) return; // If they click Cancel

    if (!window.confirm("Are you sure you want to report this user? This cannot be undone.")) return

    try {
      // 2. Insert into reports table
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: session.user.id,
          reported_id: reportedId,
          reason: reason,
          message: "User reported via chat interface"
        })

      if (error) throw error

      alert("Report submitted. We will investigate.")

    } catch (err) {
      console.error("Report error:", err)
      alert("Could not submit report.")
    }
  }

  // --- 2. BLOCK (Hard Delete: Can never meet again) ---
  const handleBlock = async (partnerId) => {
    if (!window.confirm("Are you sure you want to block this user? They will never appear in your matches again.")) return

    try {
      const match = myMatches.find(m =>
        (m.user_a_id === session.user.id && m.user_b_id === partnerId) ||
        (m.user_b_id === session.user.id && m.user_a_id === partnerId)
      )

      if (!match) return

      // 1. Delete the match (disconnect chat)
      await supabase
        .from('matches')
        .delete()
        .eq('id', match.id)

      // 2. Add to 'blocks' table (Ban from discovery)
      await supabase
        .from('blocks')
        .insert({
          blocker_id: session.user.id,
          blocked_id: partnerId
        })

      // Cleanup UI
      setPartnerProfiles(prev => prev.filter(p => p.id !== partnerId))
      setUnreadCounts(prev => {
        const copy = { ...prev }
        delete copy[partnerId]
        return copy
      })
      setMyMatches(prev => prev.filter(m => m.id !== match.id))
      
      alert("User blocked successfully.")
    } catch (err) {
      console.error("Block error:", err)
      alert("Could not block user.")
    }
  }

  // 5. SEND TYPING SIGNAL (DEBOUNCED)
  // This ensures we don't spam the server while typing
  const typingTimeout = useRef(null)

  const handleInputChange = (e) => {
    const text = e.target.value
    setInputText(text)

    // --- FIX: Auto-grow Textarea ---
    e.target.style.height = "auto"; // Reset height first
    e.target.style.height = e.target.scrollHeight + "px"; // Grow to fit content
    // -----------------------------

    // --- EXISTING TYPING LOGIC (Preserved) ---
    if (!typingChannelRef.current) return 

    if (text.trim() === "") {
        typingChannelRef.current?.send({
            type: 'broadcast',
            event: 'stop_typing',
            payload: { userId: session.user.id, typing: false }
        })
        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current)
        }
    } else {
        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current)
        }

        typingTimeout.current = setTimeout(() => {
            if (view === 'chat' && activeChatProfile && text.length > 0) {
                 typingChannelRef.current?.send({
                    type: 'broadcast',
                    event: 'typing',
                    payload: { userId: session.user.id, typing: true }
                })
            }
        }, 500)
    }
  }


  // 6. SEND MESSAGE
  // This function must be defined
  const sendMessage = async () => {
    if (!inputText.trim() || !activeChatProfile) return

    const match = myMatches.find(m => 
        (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
        (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
    )
    if (!match) return
    
    // Stop typing indicator
    typingChannelRef.current?.send({
      type: 'broadcast',
      event: 'stop_typing',
      payload: { userId: session.user.id, typing: false }
    })
    if (typingTimeout.current) clearTimeout(typingTimeout.current)

    const { error } = await supabase
      .from('messages')
      .insert({
        match_id: match.id,
        sender_id: session.user.id,
        content: inputText,
        read_at: null 
      })

    if (error) {
      console.error("Error sending message:", error)
    } else {
      setInputText("")
      
      // --- FIX: Reset height to default after sending ---
      if (chatInputRef.current) {
        chatInputRef.current.style.height = 'auto';
      }
    }
  }


  const fetchMessages = async (matchId) => {
    if (!matchId) return

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error("Error fetching messages:", error)
      return
    }

    setChatMessages(prev => [...prev, ...(data || [])])
  }



  // 7. OPEN CHAT (FINAL)
  // Combines everything: Fetch messages, Update DB, Optimistic UI, Setup Channels
  const openChat = async (profile) => {
    // Update UI State immediately to show chat
    setActiveChatProfile(profile)
    setView('chat')
    setPartnerIsTyping(false)

    if (onlineUsers.includes(profile.id)) {
        setIsPartnerOnline(true)
    } else {
        setIsPartnerOnline(false)
    }

    // FIND MATCH
    // We use myMatches.find which relies on myMatches being populated.
    // Since we fetch messages based on Match ID, we need the match object first.
    const match = myMatches.find(m => 
        (m.user_a_id === session.user.id && m.user_b_id === profile.id) ||
        (m.user_b_id === session.user.id && m.user_a_id === profile.id)
    )

    if (!match) {
        console.error("Match record not found for profile:", profile.id)
        return
    }

    const currentMatchId = match.id
    
    // 1. FIX: Mark this chat as "Last Opened" (WhatsApp Behavior)
    // This ensures that when we leave this chat, the unread badge is considered read for next load.
    // It prevents the badge from "coming back" if you visit Matches again.
    setLastOpenedChatId(profile.id)
    setUnreadCounts(prev => {
      const copy = { ...prev }
      delete copy[profile.id]
      return copy
    })

    // 2. Fetch Messages for the specific match
    // This ensures we get the latest messages associated with this Match ID.
    // Note: The variable is `currentMatchId`, not `matchId`.
    await fetchMessages(currentMatchId)


    // --- NEW: SMOOTH SCROLL LOGIC ---
    //  requestAnimationFrame to ensure DOM is ready and scroll happens smoothly.
    requestAnimationFrame(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    })

    // 3. UPGRADE: Mark messages as read in DB
    // We send the update, but we don't wait for it to finish.
    await supabase
        .from('messages')
        .update({ read_at: new Date() })
        .eq('match_id', currentMatchId)
        .neq('sender_id', session.user.id) // Only mark messages sent by partner as read
        .is('read_at', null) // Only update unread messages

    // 4. FIX: Optimistic UI Update (WhatsApp Behavior)
    // We immediately set the count for this match to 0 in the UI.
    // This clears the badge on the "Matches" tab instantly, without waiting for the DB.
    // This prevents the error "Cannot read properties of null" inside the map loop.
    setUnreadCounts(prev => ({ ...prev, [profile.id]: 0 }))

    // Remove existing channels to avoid duplicates
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
    }


    const messageChannel = supabase
      .channel(`messages:${currentMatchId}`)
      // 1. Listen for NEW messages (Insert)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${currentMatchId}`
        },
        payload => {
          setChatMessages(prev => {
            const newPrev = [...prev]
            
            // If I sent it, mark as "Delivered" immediately (Simulated Grey Tick)
            if (payload.new.sender_id === session.user.id) {
                const existingIndex = newPrev.findIndex(m => m.id === payload.new.id)
                if (existingIndex > -1) {
                    newPrev[existingIndex] = { ...payload.new, is_delivered: true }
                } else {
                    // It's a new message from realtime (I am the sender), add it as Delivered
                    newPrev.push({ ...payload.new, is_delivered: true })
                }
            } else {
                // It's a message from partner (I am the receiver)
                // We do NOT set is_delivered yet. We wait for 'Read' state.
                newPrev.push(payload.new)
            }

            return newPrev
          })
          
          // --- NOTIFICATION LOGIC ---
          const isMe = payload.new.sender_id === session.user.id
          
          if (!isMe && !document.hasFocus()) {
             const partnerName = activeChatProfile?.full_name || "Your Match"
             showNotification(`New message from ${partnerName}`, payload.new.content)
          }
        }
      )
      // 2. LISTEN FOR UPDATES (READ RECEIPTS) - ADD THIS
      .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${currentMatchId}`
        },
        payload => {
          // Find the message in the list and update it with the new data
          setChatMessages(prev => prev.map(msg => 
              msg.id === payload.new.id ? payload.new : msg
          ))
        }
      )
      .subscribe()

    messageChannelRef.current = messageChannel    



    const typingChannel = supabase
      .channel(`typing:${currentMatchId}`, { config: { broadcast: { self: false } } })
      
      // 1. Handle 'typing' event
      .on('broadcast', { event: 'typing' }, () => {
        setPartnerIsTyping(true)
        
        // Clear any existing timer (prevents old timers from turning it off prematurely)
        if (partnerTypingTimeout.current) {
          clearTimeout(partnerTypingTimeout.current)
        }

        // Set a new timer: If no 'typing' event comes in for 3 seconds, turn indicator off
        partnerTypingTimeout.current = setTimeout(() => {
          setPartnerIsTyping(false)
        }, 3000) 
      })

      // 2. Handle 'stop_typing' event (immediate stop)
      .on('broadcast', { event: 'stop_typing' }, () => {
        setPartnerIsTyping(false)
        // Clear the timeout so it doesn't conflict
        if (partnerTypingTimeout.current) {
          clearTimeout(partnerTypingTimeout.current)
        }
      })
      .subscribe()

    typingChannelRef.current = typingChannel


    const presenceChannel = supabase
      .channel(`presence:${currentMatchId}`, {
        config: { presence: { key: session.user.id } }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        setIsPartnerOnline(!!state[profile.id])
      })
      .subscribe()

    // messageChannelRef.current = messageChannel
    presenceChannelRef.current = presenceChannel

    // 6. STORE CHANNEL REF
    setRealtimeChannel(typingChannel)
    typingChannelRef.current = typingChannel
  }


  useEffect(() => {
    if (view === 'chat' && chatMessages.length > 0) {
      // Use requestAnimationFrame for better performance and guaranteed DOM update
      requestAnimationFrame(() => {
          if (messagesEndRef.current) {
             messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
          }
      })
    }
  }, [chatMessages])

  


  // Cleanup all channels (including typing, messages, presence)
  useEffect(() => {
    if (view !== 'chat') {
      if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current)
      if (messageChannelRef.current) supabase.removeChannel(messageChannelRef.current)

      typingChannelRef.current = null
      messageChannelRef.current = null
      
    }
  }, [view])



  // --- RENDER ---

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  if (view === 'reset-password') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-white/50">
                
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <Lock size={32} className="text-green-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h2>
                <p className="text-gray-500 mb-6 text-sm">
                    Please enter your new password below to complete the reset.
                </p>

                <form onSubmit={handlePasswordResetSubmit} className="space-y-4 text-left">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
                        <input 
                            type="password"
                            required
                            placeholder="Enter new password" 
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition"
                            value={newResetPass}
                            onChange={(e) => setNewResetPass(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Confirm New Password</label>
                        <input 
                            type="password"
                            required
                            placeholder="Confirm new password" 
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition"
                            value={confirmResetPass}
                            onChange={(e) => setConfirmResetPass(e.target.value)}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>

                <div className="mt-6">
                    <button 
                        onClick={handleBackToLogin} // USE THE NEW FUNCTION HERE
                        className="text-sm text-gray-500 hover:text-gray-800 font-semibold transition"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
      )
  }

  if (isSignupSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/3 translate-y-1/3"></div>
        <div className="relative z-10 w-full max-w-md bg-white p-10 rounded-3xl shadow-2xl text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 shadow-sm animate-bounce-short">
            <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Welcome to <span className="text-rose-600">SacredHearts</span>!</h1>
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">Your email is verified. Your account is ready to start meaningful connections.</p>
          <div className="flex flex-col gap-3">
             <button onClick={() => setIsSignupSuccess(false)} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                <User size={20} /> Continue to App
              </button>
             <button onClick={() => setIsSignupSuccess(false)} className="text-gray-400 hover:text-gray-600 font-medium py-2 transition text-sm">Back to Login</button>
          </div>
        </div>
      </div>
    )
  }

  // VIEW 1: Login (Upgraded)
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative" style={loginWallpaperStyle}>
        
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-white/50">
          
          {/* UPGRADE 2: Custom Sacred Heart Icon (Heart + Subtle Cross) */}
          <div className="flex justify-center mb-6 relative">
             <svg 
                width="80" 
                height="80" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#e11d48"  
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
             >
                {/* Main Heart Shape */}
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                {/* Subtle Cross in Center */}
                <path d="M12 12v-2" /> {/* Vertical */}
                <path d="M11 11h2" />  {/* Horizontal */}
             </svg>
          </div>

          {/* UPGRADE 3: SacredHearts with Up-Level GH & Tiny Beta */}
          <div className="flex flex-col items-center leading-none mb-1">
              <h1 className="text-4xl font-extrabold text-gray-900 font-serif-custom flex items-baseline">
                  SacredHearts
                  {/* GH is now Up-Level (Superscript) */}
                  <sup className="text-lg sm:text-xl text-rose-400 ml-1">GH</sup>
              </h1>
              
              {/* Beta is now very small */}
              <span className="text-[9px] sm:text-xs text-gray-400 font-bold tracking-widest uppercase">
                  (Beta)
              </span>
          </div>

          <p className="text-gray-500 mb-8 text-sm font-medium">Connecting Hearts Under Grace</p>
          {/* --- SPAM WARNING (Only for Signup Mode) --- */}
          {authMode === 'signup' && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 animate-fade-in">
                <p className="text-xs text-blue-800 text-center leading-snug">
                    💡 <strong>Important:</strong> If you don't see the verification email within 1 minute, please check your <strong>Spam</strong> or <strong>Junk</strong> folder.
                </p>
            </div>
          )}          
            <form onSubmit={handleAuth} className="space-y-4 text-left">
            
            {/* Email Input */}
            <input 
                type="email" 
                placeholder="Email" 
                required 
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition" 
                value={email} onChange={e => setEmail(e.target.value)} 
            />
            
            <div className="relative">
                {/* Password Input (Existing) */}
                <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Password" 
                    required 
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition" 
                    value={password} onChange={e => setPassword(e.target.value)} 
                />

                {/* --- NEW: FORGOT PASSWORD LINK --- */}
                <button 
                    type="button"
                    onClick={() => {
                        // Pre-fill with login email for convenience, but allow user to change it
                        setResetEmail(email) 
                        setShowForgotModal(true)
                    }}
                    className="absolute -bottom-6 right-0 text-xs text-rose-600 hover:text-rose-800 font-semibold transition z-10 bg-white/80"
                >
                    Forgot password?
                </button>

                {/* Eye Toggle (Existing) */}
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-3 right-3 text-rose-500 hover:text-rose-600 transition"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>

            {/* --- NEW: REMEMBER ME --- */}
            <div className="flex items-center gap-2 mt-2">
                <input 
                    type="checkbox" 
                    id="remember"
                    className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 border-gray-300 cursor-pointer"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">
                    Remember me
                </label>
            </div>

            <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-rose-200 transition transform active:scale-95"
            >
                {authMode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
            
            {/* --- NEW RESEND BUTTON (Existing) --- */}
            {authMode === 'login' && (
                <button 
                    type="button"
                    onClick={handleResendEmail}
                    className="w-full text-rose-600 font-bold text-sm hover:text-rose-700 border border-rose-200 bg-rose-50 hover:bg-rose-100 py-2 rounded-xl transition"
                >
                    Resend Verification Email
                </button>
            )}              
          </form>

          {/* --- NEW: FORGOT PASSWORD MODAL --- */}
          {showForgotModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                  <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in-up relative">
                      
                      {/* Close Button */}
                      <button 
                          onClick={() => setShowForgotModal(false)}
                          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                      >
                          <X size={20} />
                      </button>

                      <h2 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h2>
                      <p className="text-sm text-gray-500 mb-6">
                          Enter your email address and we'll send you a link to reset your password.
                      </p>

                      <form onSubmit={handleForgotPassword} className="space-y-4">
                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                              <input 
                                  type="email" 
                                  required
                                  value={resetEmail}
                                  onChange={(e) => setResetEmail(e.target.value)}
                                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition"
                                  placeholder="name@example.com"
                              />
                          </div>

                          <button 
                              type="submit" 
                              disabled={loading}
                              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-50"
                          >
                              {loading ? 'Sending...' : 'Send Reset Link'}
                          </button>
                      </form>
                  </div>
              </div>
          )}


          <div className="mt-8 space-y-4">
             <button 
                type="button"
                onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); }}
                className="w-full text-rose-600 font-bold text-sm hover:text-rose-700 transition"
             >
                {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
             </button>
             
             <button 
                type="button"
                onClick={() => { 
                    navigator.clipboard.writeText("🇬🇭 Looking for serious dates in Ghana?\n\n I just found this new app called SacredHearts. — Ghana’s new faith-based dating app. It’s clean, safe, and built for genuine relationships.\n\nCheck it out: " + window.location.href + "\n\n#SacredHearts"); 
                    alert("Message copied! Share it on WhatsApp now.") 
                }} 
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-2 rounded-xl font-bold text-sm transition"
              >
                 📤 Invite Friends
            </button>
          </div>
        </div>
      </div>
    )
  }

  // View: Setup Profile or Edit Profile (Unified)
  if (view === 'setup' || view === 'profile') {
    const isEditMode = view === 'profile'
    const today = new Date()
    const maxDate = new Date(today.setFullYear(today.getFullYear() - 18)).toISOString().split('T')[0]

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-lg mt-10">
          {/* --- UPDATED HEADER WITH BACK BUTTON --- */}
          <div className="flex items-center gap-4 mb-6">
            {/* Only show back button if we are in 'edit' mode, not setup mode */}
            {view === 'profile' && (
              <button 
                onClick={() => setView('discovery')} 
                className="text-gray-600 hover:text-rose-600 transition p-1 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft size={24} />
              </button>
            )}

            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              {isEditMode ? <Edit className="text-rose-600" /> : <User className="text-rose-600" />} 
              {isEditMode ? 'Edit Profile' : 'Complete Profile'}
            </h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">{isEditMode ? 'Update your details below. (Gender cannot be changed)' : 'Tell us about yourself.'}</p>
          <form onSubmit={handleSaveProfile} className="space-y-4">            
            {/* --- NEW IMAGE UPLOAD SECTION --- */}
            <div className="flex flex-col items-center mb-6">
                <div 
                    className="relative w-32 h-32 rounded-full border-4 border-rose-100 shadow-md overflow-hidden cursor-pointer bg-gray-100 hover:bg-gray-200 transition group"
                    onClick={() => document.getElementById('avatar-input').click()}
                >
                    {/* Image Display */}
                    <img 
                        src={previewUrl || profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name || 'User'}&backgroundColor=b6e3f4`} 
                        alt="Avatar Preview" 
                        className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay when uploading */}
                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                            <span className="text-xs animate-pulse">Uploading...</span>
                        </div>
                    )}

                    {/* Camera Icon Overlay */}
                    {!uploading && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <Edit size={24} color="white" />
                        </div>
                    )}
                </div>
                
                <p className="text-xs text-gray-500 mt-2">Tap to change photo</p>
                
                {/* Hidden File Input */}
                <input
                    type="file"
                    id="avatar-input"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            <input type="text" placeholder="Full Name" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-2 border rounded" />
            {isEditMode ? (
                <div className="w-full p-2 border rounded bg-gray-100 text-gray-500 font-medium">
                    {gender === 'male' ? 'Man' : 'Woman'} (Locked)
                </div>
            ) : (
                <select required value={gender} onChange={e => setGender(e.target.value)} className="w-full p-2 border rounded">
                    <option value="">Select Gender</option>
                    <option value="male">Man</option>
                    <option value="female">Woman</option>
                </select>
            )}
            <div>
                <input 
                    type="date" 
                    required 
                    value={dateOfBirth} 
                    onChange={e => setDateOfBirth(e.target.value)} 
                    className="w-full p-2 border rounded"
                    title="Date of Birth (Must be 18+)"
                    max={maxDate} 
                />
                {dateOfBirth && calculateAge(dateOfBirth) < 18 && (
                    <p className="text-red-500 text-xs mt-1 font-bold">You must be at least 18 years old.</p>
                )}
            </div>
            <select required value={city} onChange={e => setCity(e.target.value)} className="w-full p-2 border rounded">
              <option value="">Select City</option>
              <option value="Accra">Accra</option>
              <option value="Kumasi">Kumasi</option>
              <option value="Tema">Tema</option>
              <option value="Tamale">Tamale</option>
              <option value="Cape Coast">Cape Coast</option>
              <option value="Takoradi">Takoradi</option>
              <option value="Sunyani">Sunyani</option>
              <option value="Ho">Ho</option>
              <option value="Wa">Wa</option>
              <option value="Techiman">Techiman</option>
              <option value="Goaso">Goaso</option>
              <option value="Nalerigu">Nalerigu</option>
              <option value="Sefwi Wiaso">Sefwi Wiaso</option>
              <option value="Damango">Damango</option>
              <option value="Dambai">Dambai</option>
              <option value="Bolgatanga">Bolgatanga</option>
            </select>
            <select required value={religion} onChange={e => setReligion(e.target.value)} className="w-full p-2 border rounded"><option value="">Select Religion</option><option value="Christian">Christian</option><option value="Muslim">Muslim</option><option value="Others">Others</option></select>
            <select required value={intent} onChange={e => setIntent(e.target.value)} className="w-full p-2 border rounded"><option value="">Select Goal</option><option value="Serious Dating">Serious Dating</option><option value="Marriage">Marriage</option></select>
            <textarea rows="3" placeholder="About Me..." required value={bio} onChange={e => setBio(e.target.value)} className="w-full p-2 border rounded"></textarea>
            <button type="submit" disabled={loading || (dateOfBirth && calculateAge(dateOfBirth) < 16)} className="w-full bg-rose-600 text-white font-bold py-3 rounded">
                <Save size={18} className="inline mr-2"/>{isEditMode ? 'Update Profile' : 'Save'}
            </button>    
            {/* --- CHANGE PASSWORD BUTTON --- */}
            <button 
                type="button"
                onClick={() => setView('security')} 
                className="w-full bg-gray-800 text-white font-bold py-3 rounded flex justify-center items-center gap-2 hover:bg-gray-900 mt-4"
            >
                <Lock size={18} /> Change Password
            </button>

            {/* --- VIEW BLOCKED USERS BUTTON --- */}
            <button 
                type="button"
                onClick={() => {
                  fetchBlockedUsers() 
                  setView('blocked')   
                }}
                className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded flex justify-center items-center gap-2 hover:bg-gray-200 mt-2"
            >
                <AlertTriangle size={18} /> View Blocked Users ({blockedUsers.length})
            </button>
            {isEditMode && (
                <button 
                    type="button"
                    onClick={() => supabase.auth.signOut()} 
                    className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded flex justify-center items-center gap-2 hover:bg-gray-200 mt-2"
                >
                    <LogOut size={18} /> Logout
                </button>
            )}
          </form>
        </div>
      </div>
    )
  }

  const currentCandidate = candidates[currentIndex]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow p-3 sm:p-4 flex justify-between items-center sticky top-0 z-10 gap-2">
        <div className="flex items-center gap-2 text-rose-600 flex-shrink-0">
          <Heart className="fill-current" size={28} /> 
          <span className="font-serif-custom font-bold text-2xl sm:text-3xl text-gray-800 tracking-wide">SacredHearts</span>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1 flex-grow max-w-[180px] sm:max-w-none mx-2 justify-center">
          <button onClick={() => setView('discovery')} className={`px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold flex-1 ${view === 'discovery' ? 'bg-white text-rose-600 shadow' : 'text-gray-500'}`}>Discover</button>
          <button onClick={() => setView('matches')} className={`px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold flex-1 ${view === 'matches' ? 'bg-white text-rose-600 shadow' : 'text-gray-500'}`}>Matches</button>
          <button onClick={() => { setView('stats'); fetchStats() }} className={`px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold flex-1 ${view === 'stats' ? 'bg-white text-rose-600 shadow' : 'text-gray-500'}`}>Stats</button>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 min-w-0">
            <span className="font-bold text-gray-800 text-xs sm:text-sm truncate max-w-[70px] sm:max-w-[120px]">{profile?.full_name}</span>
            <div onClick={() => setView('profile')} className="cursor-pointer relative group flex-shrink-0">
                <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name || 'User'}&backgroundColor=b6e3f4`} alt="Profile" className="w-8 h-8 sm:w-8 sm:h-8 rounded-full border-2 border-gray-200 hover:border-rose-500 transition"/>
                <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-white hidden group-hover:block"></div>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="text-gray-400 hover:text-gray-600 p-2 -mr-2 sm:mr-0" title="Logout"><LogOut size={24} strokeWidth={2.5} /></button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 relative overflow-hidden bg-gray-50">
        
        {/* --- BEAUTIFUL GRADIENT BLOBS --- */}
        {/* These create a soft, moving background effect */}
        
        {/* Pink/Rose Blob (Top Left) */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
        
        {/* Orange Blob (Top Right) */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" style={{animationDelay: '1s'}}></div>
        
        {/* Purple/Lavender Blob (Bottom Center) */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" style={{animationDelay: '2s'}}></div>

        {/* --- END BLOBS --- */}
        {view === 'discovery' && (
          <div className="w-full flex flex-col lg:flex-row items-start justify-center gap-8 px-4 max-w-6xl mx-auto">

            {/* --- LEFT/CENTER: MAIN CARD --- */}
            <div className="w-full max-w-md lg:max-w-md shrink-0 relative z-10">
                {/* Filter Toolbar */}
                <div className="w-full flex justify-between items-center mb-4 px-2 relative z-20">
                    <h3 className="font-bold text-gray-700">Discover</h3>
                    <button 
                        onClick={() => setShowFilters(true)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition
                            ${(filterCity || filterReligion) ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-white border-gray-300 text-gray-600'}`}
                    >
                        <SlidersHorizontal size={16} />
                        Filters
                        {(filterCity || filterReligion) && <span className="bg-rose-500 text-white text-[10px] px-1.5 rounded-full">!</span>}
                    </button>
                </div>

                {!currentCandidate && (
                <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No More Profiles</h3>
                    <p className="text-gray-600 mb-4">Check back later for new singles in {profile?.city}.</p>
                </div>
                )}

                {currentCandidate && (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-white/50 backdrop-blur-sm">
                    {/* Image */}
                    <div className="h-96 bg-gray-200 flex items-center justify-center overflow-hidden rounded-t-xl relative">
                    <img 
                        src={currentCandidate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentCandidate.full_name}&backgroundColor=b6e3f4`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover object-top"
                    />
                    </div>
                    
                    <div className="p-6">
                    {/* Name & Age */}
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">{currentCandidate.full_name}</h2>
                        <span className="text-gray-500">{calculateAge(currentCandidate.date_of_birth)}</span>
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center gap-2 text-rose-600 font-medium mb-4">
                        <MapPin size={16} /> {currentCandidate.city}
                    </div>

                    {/* Details List */}
                    <div className="space-y-2 mb-6 text-sm text-gray-700">
                        {currentCandidate.distance && (
                            <div className="font-bold text-green-600 flex items-center gap-1">
                            <MapPin size={12} /> {currentCandidate.distance < 1 ? "< 1 km away" : `${currentCandidate.distance.toFixed(1)} km away`}
                            </div>
                        )}                    
                        <div><span className="font-bold text-gray-900">Faith:</span> {currentCandidate.religion}</div>
                        <div><span className="font-bold text-gray-900">Intent:</span> {currentCandidate.intent}</div>
                        
                        {/* Bio */}
                        {currentCandidate.bio && (
                            <div className="mt-3 pt-3 border-t border-gray-100 text-gray-600 italic line-clamp-2 text-sm leading-relaxed">
                                "{currentCandidate.bio}"
                            </div>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4">
                        <button onClick={handlePass} className="flex-1 border border-gray-300 text-gray-500 hover:bg-gray-50 py-3 rounded-lg font-bold flex justify-center items-center gap-2"><X size={20} /> Pass</button>
                        <button onClick={handleConnect} disabled={loading} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-md"><Heart size={20} /> Connect</button>
                    </div>
                    </div>
                </div>
                )}
            </div>

            {/* --- RIGHT: NEW MEMBERS SIDEBAR (Desktop Only) --- */}
            <div className="hidden lg:block w-80 shrink-0">
                <div className="sticky top-24">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        More Profiles
                    </h3>
                    
                    {candidates.length > 0 && (
                        <div className="space-y-4">
                            {candidates.slice(currentIndex + 1, currentIndex + 6).map((nextCandidate, idx) => (
                                <div key={nextCandidate.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition cursor-pointer">
                                    <img 
                                        src={nextCandidate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${nextCandidate.full_name}&backgroundColor=b6e3f4`} 
                                        className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                                        alt="Preview"
                                    />
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-gray-900 truncate">{nextCandidate.full_name}</h4>
                                            <span className="text-xs bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold">{calculateAge(nextCandidate.date_of_birth)}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                                            <MapPin size={10} /> {nextCandidate.city}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* If less than 5 profiles left */}
                    {candidates.length - currentIndex <= 1 && (
                        <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <p className="text-sm text-gray-500">End of the list for today.</p>
                        </div>
                    )}
                </div>
            </div>

          </div>
        )}

        {view === 'matches' && (
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Your Connections</h2>
            {partnerProfiles.length === 0 ? (
               <div className="text-center text-gray-500">No matches yet. Keep connecting!</div>
            ) : (
              <div className="grid gap-4">
                {partnerProfiles.map((matchProfile) => {
                  if (!matchProfile) return null;
                  
                  // --- CHECK IF THIS MATCH IS ONLINE ---
                  const isMatchOnline = onlineUsers.includes(matchProfile.id);

                  // --- FIND THE MATCH OBJECT TO CHECK STATUS ---
                  const match = myMatches.find(m => 
                    (m.user_a_id === session.user.id && m.user_b_id === matchProfile.id) ||
                    (m.user_b_id === session.user.id && m.user_a_id === matchProfile.id)
                  );

                  if (!match) return null;

                  // --- CHECK STATUS ---
                  const isPending = match.status === 'pending';
                  
                  // Determine if it's incoming or outgoing
                  const isIncoming = match.user_a_id !== session.user.id; 

                  return (
                    <div 
                        key={matchProfile.id} 
                        // Add a yellow border if it's a new request!
                        className={`p-4 rounded-xl shadow-lg flex items-center gap-4 hover:bg-gray-50 transition border 
                            ${isPending ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-rose-100'}
                        `}
                    >
                      
                      {/* --- AVATAR SECTION (With Green Dot) --- */}
                      <div className="relative shrink-0">
                        <img 
                           src={matchProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${matchProfile.full_name}&backgroundColor=b6e3f4`} 
                           className="w-16 h-16 rounded-full bg-gray-100 border-2 border-white shadow-sm" 
                           alt="Avatar"
                        />
                        
                        {/* --- ONLINE INDICATOR --- */}
                        {isMatchOnline && (
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="text-left flex-grow min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-gray-900 truncate">{matchProfile.full_name}</h3>
                            
                            {/* --- STATUS BADGES --- */}
                            {/* 1. New Request Badge */}
                            {isPending && <span className="bg-yellow-200 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>}
                            
                            {/* 2. Online Text Badge */}
                            {isMatchOnline && !isPending && (
                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 animate-pulse">
                                    Online
                                </span>
                            )}
                        </div>
                        
                        <p className="text-sm text-rose-600 font-medium flex items-center gap-1"><MapPin size={12} /> {matchProfile.city}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{matchProfile.bio}</p>
                      </div>
                      
                      <div className="relative flex gap-2">
                        
                        {/* --- PENDING VIEW (INCOMING REQUEST) --- */}
                        {isPending && isIncoming && (
                          <>
                            <button 
                                onClick={() => handleAcceptRequest(match.id, matchProfile.id)}
                                className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-md transition"
                                title="Accept Match"
                            >
                                <Check size={20} />
                            </button>
                            <button 
                                onClick={() => handleRejectRequest(match.id)}
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition"
                                title="Decline"
                            >
                                <X size={20} />
                            </button>
                          </>
                        )}

                        {/* --- MUTUAL VIEW (CHAT) --- */}
                        {!isPending && (
                          <div className="flex items-center gap-2">
                            
                            {/* 1. WRAP CHAT BUTTON INDIVIDUALLY FOR BADGE */}
                            <div className="relative">
                                <button 
                                    onClick={() => {
                                    setUnreadCounts(prev => ({ ...prev, [matchProfile.id]: 0 }))
                                    openChat(matchProfile)
                                    }}
                                    className="text-gray-400 hover:text-rose-600 transition p-2 rounded-full hover:bg-rose-50"
                                >
                                    <MessageCircle size={20} /> 
                                </button>
                                
                                {/* Badges */}
                                {unreadCounts[matchProfile.id] > 0 && (
                                    <span className="absolute -top-0 -right-0 bg-rose-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                        {unreadCounts[matchProfile.id] > 9 ? '9+' : unreadCounts[matchProfile.id]}
                                    </span>
                                )}
                            </div>
                            {/* --- END CHAT WRAPPER --- */}

                            {/* 2. OPTIONS (Block/Unmatch) */}
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => handleUnmatch(matchProfile.id)}
                                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition"
                                    title="Unmatch"
                                >
                                    <X size={18} />
                                </button>
                                <button 
                                    onClick={() => handleBlock(matchProfile.id)}
                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                                    title="Block"
                                >
                                    <AlertTriangle size={18} />
                                </button>
                            </div>
                          </div>
                        )}

                        {/* --- OUTGOING REQUEST (WAITING) --- */}
                        {isPending && !isIncoming && (
                            <span className="text-xs text-gray-400 font-medium pr-2">Request Sent</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* --- NEW BLOCKED USERS VIEW --- */}
        {view === 'blocked' && (
          <div className="w-full max-w-md">
            {/* Header with Back Button */}
            <div className="flex items-center gap-2 mb-6">
              <button onClick={() => setView('profile')} className="text-gray-600 hover:text-rose-600">
                 <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-gray-800">Blocked Users</h2>
            </div>

            {blockedUsers.length === 0 ? (
               <div className="text-center text-gray-500 mt-10">
                  <p>You haven't blocked anyone.</p>
                  <p className="text-sm mt-2">People you block won't appear in Discovery.</p>
               </div>
            ) : (
              <div className="grid gap-4">
                {blockedUsers.map((item) => {
                  // Safety check
                  if (!item.profile) return null;

                  return (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <img 
                                src={item.profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.profile.full_name}&backgroundColor=b6e3f4`} 
                                className="w-12 h-12 rounded-full bg-gray-100"
                                alt="Avatar"
                            />
                            <div>
                                <h3 className="font-bold text-gray-900">{item.profile.full_name}</h3>
                                <p className="text-xs text-gray-500">
                                    {item.created_at 
                                        ? `Blocked on ${new Date(item.created_at).toLocaleDateString()}` 
                                        : 'Blocked'}
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleUnblock(item.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition"
                        >
                            Unblock
                        </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* --- NEW: ACCOUNT SECURITY VIEW --- */}
        {view === 'security' && (
          <div className="w-full max-w-md">
            
            {/* --- FIXED HEADER --- */}
            <div className="flex items-center gap-2 mb-6 relative z-20">
              <button 
                onClick={() => setView('profile')} 
                className="text-gray-600 hover:text-rose-600 p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition"
              >
                 <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-gray-800">Change Password</h2>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <p className="text-sm text-gray-500 mb-4">
                        Enter your current password to set a new one.
                    </p>

                    {/* --- OLD PASSWORD (With Eye) --- */}
                    <div className="relative">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Current Password</label>
                        <input 
                            type={showOldPassword ? "text" : "password"}
                            required
                            placeholder="•••••••" 
                            className="w-full p-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                        />
                        {/* Eye Toggle Button */}
                        <button 
                            type="button"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                        >
                            {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {/* --- NEW PASSWORD (With Eye) --- */}
                    <div className="relative">
                        <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
                        <input 
                            type={showNewPassword ? "text" : "password"}
                            required
                            placeholder="New password (min. 6 chars)" 
                            className="w-full p-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        {/* Eye Toggle Button */}
                        <button 
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                        >
                            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {/* --- CONFIRM PASSWORD (Standard) --- */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Confirm New Password</label>
                        <input 
                            type="password"
                            required
                            placeholder="Confirm new password" 
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    {/* Update Button */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
          </div>
        )}
        
        {view === 'chat' && activeChatProfile && (
          <div className="flex flex-col h-[calc(100vh-140px)] max-w-md mx-auto w-full bg-white shadow-2xl rounded-xl overflow-hidden">
            
            {/* --- UPDATED CHAT HEADER --- */}
            <div className="bg-rose-600 text-white p-3 sm:p-4 flex items-center justify-between shadow-md z-10">
              
              {/* LEFT GROUP: Back Button + User Info */}
              <div className="flex items-center gap-3 flex-grow min-w-0">
                <button 
                  onClick={() => { setView('matches'); if(realtimeChannel) supabase.removeChannel(realtimeChannel); if(typingChannelRef.current) supabase.removeChannel(typingChannelRef.current); setActiveChatProfile(null) }} 
                  className="hover:bg-rose-700 p-1 rounded-full transition flex-shrink-0"
                >
                  <ArrowLeft size={24} />
                </button>
                
                <div className="relative flex-shrink-0">
                  <img 
                     src={activeChatProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChatProfile.full_name}&backgroundColor=ffffff`} 
                     className="w-10 h-10 rounded-full border-2 border-white"
                  />
                  {/* Online Status Green Dot */}
                  {isPartnerOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-rose-600 rounded-full"></div>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-lg flex items-center gap-2 truncate">
                      {activeChatProfile.full_name} 
                      {isPartnerOnline && <span className="text-xs font-normal text-green-200">Online</span>}
                  </h3>
                  <p className="text-rose-200 text-xs flex items-center gap-1 truncate"><MapPin size={10} /> {activeChatProfile.city}</p>
                </div>
              </div>

              {/* RIGHT GROUP: Report User Button (Hugging the edge) */}
              <button 
                  onClick={() => handleReportUser(activeChatProfile.id)}
                  className="ml-auto shrink-0 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition shadow-sm flex items-center gap-1.5 border border-white/10"
                  title="Report User"
              >
                  <AlertTriangle size={12} />
                  Report
              </button>

            </div>

            <div className="flex-grow overflow-y-auto overflow-x-hidden p-4 bg-gray-50 space-y-3" id="chat-messages-list">
              {chatMessages.length === 0 && <div className="text-center text-gray-400 mt-10 text-sm">Say hello! Start a godly conversation.</div>}
              {chatMessages.map((msg) => {
                const isMe = msg.sender_id === session.user.id
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-rose-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                        <div className="message-bubble">{msg.content}</div>
                        
                        {/* UPGRADE: Read Receipts UI */}
                        {isMe && (
                            <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                                <span className="text-[10px]">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                
                                {/* Ticks */}
                                {msg.read_at ? (
                                    <CheckCheck size={12} color="#bae6fd"/> 
                                ) : msg.is_delivered ? (
                                    <Check size={12} color="#9ca3af"/> 
                                ) : (
                                    <Check size={12} color="#9ca3af" opacity={0.3}/> 
                                )}
                            </div>
                        )}

                        {/* --- NEW: SEEN TIMESTAMP --- */}
                        {isMe && msg.read_at && (
                            <span className="text-[10px] text-gray-300 flex items-center gap-1">
                                Seen {new Date(msg.read_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex flex-col justify-end p-4 bg-white border-t border-gray-200 z-20">
              {partnerIsTyping && (
                 <div className="flex items-center gap-2 mb-2 animate-pulse self-end"><span className="text-xs text-rose-500 font-medium">User is typing...</span></div>
              )}
            <div className="flex gap-2 w-full items-end">
              <textarea
                ref={chatInputRef} // Connect the Ref
                className="chat-textarea-auto bg-gray-100 focus:ring-1 focus:ring-rose-500 text-gray-800 placeholder:text-gray-400"
                value={inputText}
                onChange={handleInputChange}
                placeholder="Type a message..."
                // Enter sends, Shift+Enter creates new line
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault(); 
                    sendMessage();
                  }
                }}
              />
              
              <button onClick={sendMessage} className="bg-rose-600 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-rose-700 transition shadow-md shrink-0">
                <Heart size={18} fill="white" />
              </button>
            </div>
            </div>
          </div>
        )}

        {view === 'stats' && (
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Platform Growth</h2>
            <div className="grid grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl shadow border border-rose-100 text-center">
                <div className="text-4xl font-bold text-rose-600">{stats.users}</div>
                <div className="text-sm text-gray-500 font-medium">Total Users</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow border border-rose-100 text-center">
                <div className="text-4xl font-bold text-rose-600">{stats.matches}</div>
                <div className="text-sm text-gray-500 font-medium">Matches Made</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow border border-rose-100 col-span-2 text-center">
                <div className="text-4xl font-bold text-rose-600">{stats.messages}</div>
                <div className="text-sm text-gray-500 font-medium">Messages Sent</div>
              </div>
            </div>
            <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
               <p className="text-sm text-blue-800 font-medium text-center">💡 Tip: Refresh "Stats" tab to see real-time growth.</p>
            </div>
          </div>
        )}
      </main>

      {/* --- FILTERS MODAL --- */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
            
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Filter Discovery</h3>
                <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>
            </div>

            <div className="space-y-4">
                {/* City Filter */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                    <select 
                        className="w-full p-2 border rounded-lg"
                        value={filterCity}
                        onChange={(e) => setFilterCity(e.target.value)}
                    >
                        <option value="">All Cities</option>
                        <option value="Accra">Accra</option>
                        <option value="Kumasi">Kumasi</option>
                        <option value="Tema">Tema</option>
                        <option value="Tamale">Tamale</option>
                        <option value="Cape Coast">Cape Coast</option>
                        <option value="Takoradi">Takoradi</option>
                        <option value="Sunyani">Sunyani</option>
                        <option value="Ho">Ho</option>
                        <option value="Wa">Wa</option>
                        <option value="Techiman">Techiman</option>
                        <option value="Goaso">Goaso</option>
                        <option value="Nalerigu">Nalerigu</option>
                        <option value="Sefwi Wiaso">Sefwi Wiaso</option>
                        <option value="Damango">Damango</option>
                        <option value="Dambai">Dambai</option>
                        <option value="Bolgatanga">Bolgatanga</option>
                    </select>
                </div>

                {/* Religion Filter */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Religion</label>
                    <select 
                        className="w-full p-2 border rounded-lg"
                        value={filterReligion}
                        onChange={(e) => setFilterReligion(e.target.value)}
                    >
                        <option value="">All Religions</option>
                        <option value="Christian">Christian</option>
                        <option value="Muslim">Muslim</option>
                        <option value="Others">Others</option>
                    </select>
                </div>

                {/* --- NEW: DISTANCE FILTER --- */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Distance</label>
                    <select 
                        className="w-full p-2 border rounded-lg"
                        value={filterDistance}
                        onChange={(e) => setFilterDistance(e.target.value)}
                    >
                        <option value="">Any Distance</option>
                        <option value="10">Within 10 km</option>
                        <option value="25">Within 25 km</option>
                        <option value="50">Within 50 km</option>
                        <option value="100">Within 100 km</option>
                    </select>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 mt-6">
                    <button 
                        onClick={() => { 
                            setFilterCity(''); 
                            setFilterReligion(''); 
                            setFilterDistance(''); 
                            localStorage.removeItem('sacred_distance_filter');
                            localStorage.removeItem('sacred_city_filter'); 
                            localStorage.removeItem('sacred_religion_filter');
                        }}
                        className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition" 
                    >
                        Reset
                    </button>
                    <button 
                        onClick={() => { 
                            setShowFilters(false); 
                            // Save to Local Storage
                            localStorage.setItem('sacred_city_filter', filterCity); 
                            localStorage.setItem('sacred_religion_filter', filterReligion); 
                            
                            // ---  DISTANCE ---
                            if (filterDistance) {
                                localStorage.setItem('sacred_distance_filter', filterDistance);
                            } else {
                                localStorage.removeItem('sacred_distance_filter');
                            }
                            fetchCandidates(session.user.id, profile.gender, profile) 
                        }}
                        className="flex-1 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 shadow-lg transition" 
                    >
                        Apply
                    </button>
                </div>
            </div>

          </div>
        </div>
      )}         
    </div>
  )
}

function calculateAge(dateString) {
  if (!dateString) return "" 
  const today = new Date()
  const birthDate = new Date(dateString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age-- }
  return age
}

export default App
