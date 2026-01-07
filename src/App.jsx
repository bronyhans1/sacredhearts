import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { Heart, Church, Save, MapPin, User, X, MessageCircle, ArrowLeft, LogOut, Edit, Check, CheckCheck, EllipsisVertical, Trash2, AlertTriangle, Eye, EyeOff,  SlidersHorizontal } from 'lucide-react'

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

  const [blockedUsers, setBlockedUsers] = useState([])

  
  const [chatMessages, setChatMessages] = useState([])
  const [inputText, setInputText] = useState("")
  
  // UPGRADE: Online Status State
  const [isPartnerOnline, setIsPartnerOnline] = useState(false)

  // UPGRADE: Password Visibility State
  const [showPassword, setShowPassword] = useState(false)

  // UPGRADE: Unread Counts State
  const [unreadCounts, setUnreadCounts] = useState({})

  // 1. ADD THIS STATE (TOP OF App COMPONENT)
  // Tracks which chat was last opened (prevents unread badge coming back)
  const [lastOpenedChatId, setLastOpenedChatId] = useState(null)

  // 1. INITIALIZE SESSION
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const type = urlParams.get('type')

    if (type === 'signup' || type === 'recovery') {
        setIsSignupSuccess(true)
        window.history.replaceState({}, document.title, window.location.pathname)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
        fetchStats()
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])


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


    // --- NEW: APPLY FILTERS ---
    if (filterCity) {
        query = query.eq('city', filterCity)
    } else if (!hasLocation) {
        // Only apply the "My City" fallback if NO filter is selected AND we have no GPS
        query = query.eq('city', myCurrentProfile?.city)
    }

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

            setCandidates(candidatesWithDistance || [])
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


    // --- UPGRADE: Handle Password Visibility Toggle ---
    // Check current visibility state. If true (password is visible), alert.
    if (showPassword) {
        alert("Password visible! (Simulated Verification)")
        // In a real app, you would verify password visibility here.
    }

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
    const text = e.target.value // 1. Save value immediately (Fixes mobile event issues)
    setInputText(text)

    // 2. FIX: Check the REF instead of the STATE for instant connection
    // State is async, Ref is sync. This prevents signal loss on mobile.
    if (!typingChannelRef.current) return 

    // Stop typing if empty
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
        // Debounce: Wait 500ms after user stops typing
        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current)
        }

        typingTimeout.current = setTimeout(() => {
            // Use the saved 'text' variable, not e.target.value
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

    // Find the current match object based on active chat profile
    const match = myMatches.find(m => 
        (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
        (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
    )
    if (!match) return
    
    // Stop typing indicator immediately (local)
    typingChannelRef.current?.send({
      type: 'broadcast',
      event: 'stop_typing',
      payload: { userId: session.user.id, typing: false }
    })

    if (typingTimeout.current) {
        clearTimeout(typingTimeout.current)
    }

    // Insert the message into the database
    const { error } = await supabase
      .from('messages')
      .insert({
        match_id: match.id,
        sender_id: session.user.id,
        content: inputText,
        read_at: null // Initial null for sent status
      })

    if (error) {
      console.error("Error sending message:", error)
    } else {
      // Clear input box
      setInputText("")
      // Optimistically clear unread count for the sender
      // (We will set the count to 0 properly in the UI update below)
      // await fetchMessages(match.id) 
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

    setChatMessages(data || [])
  }



  // 7. OPEN CHAT (FINAL)
  // Combines everything: Fetch messages, Update DB, Optimistic UI, Setup Channels
  const openChat = async (profile) => {
    // Update UI State immediately to show chat
    setActiveChatProfile(profile)
    setView('chat')
    setPartnerIsTyping(false)
    setIsPartnerOnline(false)

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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${currentMatchId}`
        },
        payload => {
          setChatMessages(prev => [...prev, payload.new])
          
          // --- FIX: ADD NOTIFICATION LOGIC ---
          const isMe = payload.new.sender_id === session.user.id
          
          // Only notify if:
          // 1. The message is NOT from me (it's from partner)
          // 2. The document/tab is NOT focused (user is away or minimized)
          if (!isMe && !document.hasFocus()) {
             // Find partner name to show in notification
             const partnerName = activeChatProfile?.full_name || "Your Match"
             showNotification(`New message from ${partnerName}`, payload.new.content)
          }
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
      setTimeout(() => {
         const list = document.getElementById('chat-messages-list')
         if (list) {
             list.scrollTop = list.scrollHeight
         }
      }, 100)
    }
  }, [chatMessages])

  


  // Cleanup all channels (including typing, messages, presence)
  useEffect(() => {
    if (view !== 'chat') {
      if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current)
      if (messageChannelRef.current) supabase.removeChannel(messageChannelRef.current)
      if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current)

      typingChannelRef.current = null
      messageChannelRef.current = null
      presenceChannelRef.current = null
    }
  }, [view])



  // --- RENDER ---

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

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
          
          <form onSubmit={handleAuth} className="space-y-4 text-left">
            <input 
                type="email" 
                placeholder="Email" 
                required 
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition" 
                value={email} onChange={e => setEmail(e.target.value)} 
            />
            
            <div className="relative">
                <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Password" 
                    required 
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition" 
                    value={password} onChange={e => setPassword(e.target.value)} 
                />

                {/* UPGRADE: Password Visibility Toggle Button */}
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-3 right-3 text-rose-500 hover:text-rose-600 transition"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>

            <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-rose-200 transition transform active:scale-95"
            >
                {authMode === 'login' ? 'Log In' : 'Sign Up'}
            </button>            
          </form>

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
                    title="Date of Birth (Must be 16+)"
                    max={maxDate} 
                />
                {dateOfBirth && calculateAge(dateOfBirth) < 16 && (
                    <p className="text-red-500 text-xs mt-1 font-bold">You must be at least 16 years old.</p>
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
            {/* ---  VIEW BLOCKED USERS BUTTON --- */}
            <button 
                type="button"
                onClick={() => {
                  fetchBlockedUsers() // Load the list
                  setView('blocked')   // Switch to the new view
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
          <div className="w-full max-w-md">

            {/* --- NEW: FILTER TOOLBAR --- */}
            <div className="w-full flex justify-between items-center mb-4 px-2">
                <h3 className="font-bold text-gray-700">Discover</h3>
                <button 
                    onClick={() => setShowFilters(true)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition
                        ${(filterCity || filterReligion) ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-white border-gray-300 text-gray-600'}`}
                >
                    <SlidersHorizontal size={16} /> {/* Or Funnel icon */}
                    Filters
                    {(filterCity || filterReligion) && <span className="bg-rose-500 text-white text-[10px] px-1.5 rounded-full">!</span>}
                </button>
            </div>

            {!currentCandidate && (
              <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
                <h3 className="text-xl font-bold text-gray-800 mb-2">No More Profiles</h3>
                <p className="text-gray-600 mb-4">Check back later for new singles in {profile?.city}.</p>
              </div>
            )}
            {currentCandidate && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-white/50 backdrop-blur-sm relative z-10">
                <div className="h-96 bg-gray-200 flex items-center justify-center overflow-hidden rounded-t-xl relative">
                   <img 
                      src={currentCandidate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentCandidate.full_name}&backgroundColor=b6e3f4`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover object-top"
                   />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{currentCandidate.full_name}</h2>
                    <span className="text-gray-500">{calculateAge(currentCandidate.date_of_birth)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-rose-600 font-medium mb-4">
                    <MapPin size={16} /> {currentCandidate.city}
                  </div>
                  <div className="space-y-2 mb-6 text-sm text-gray-700">
                    {/* --- SHOW DISTANCE --- */}
                    {currentCandidate.distance && (
                        <div className="font-bold text-green-600 flex items-center gap-1">
                           <MapPin size={12} /> {currentCandidate.distance < 1 ? "< 1 km away" : `${currentCandidate.distance.toFixed(1)} km away`}
                        </div>
                    )}                    
                    <div><span className="font-bold text-gray-900">Faith:</span> {currentCandidate.religion}</div>
                    <div><span className="font-bold text-gray-900">Intent:</span> {currentCandidate.intent}</div>
                    <div><span className="font-bold text-gray-900">Location:</span> {currentCandidate.city}</div>
                  </div>


                  <div className="flex gap-4">
                    <button onClick={handlePass} className="flex-1 border border-gray-300 text-gray-500 hover:bg-gray-50 py-3 rounded-lg font-bold flex justify-center items-center gap-2"><X size={20} /> Pass</button>
                    <button onClick={handleConnect} disabled={loading} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-md"><Heart size={20} /> Connect</button>
                  </div>
                </div>
              </div>
            )}
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
                      <img 
                         src={matchProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${matchProfile.full_name}&backgroundColor=b6e3f4`} 
                         className="w-16 h-16 rounded-full bg-gray-100 border-2 border-white shadow-sm" 
                         alt="Avatar"
                      />
                      
                      <div className="text-left flex-grow">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-gray-900">{matchProfile.full_name}</h3>
                            {isPending && <span className="bg-yellow-200 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>}
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

        
        {view === 'chat' && activeChatProfile && (
          <div className="flex flex-col h-[calc(100vh-140px)] max-w-md mx-auto w-full bg-white shadow-2xl rounded-xl overflow-hidden">
            <div className="bg-rose-600 text-white p-4 flex items-center shadow-md z-10">
              <button onClick={() => { setView('matches'); if(realtimeChannel) supabase.removeChannel(realtimeChannel); if(typingChannelRef.current) supabase.removeChannel(typingChannelRef.current); setActiveChatProfile(null) }} className="mr-3 hover:bg-rose-700 p-1 rounded-full"><ArrowLeft size={24} /></button>
              
                  <div className="relative">
                      <img 
                         src={activeChatProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChatProfile.full_name}&backgroundColor=ffffff`} 
                         className="w-10 h-10 rounded-full border-2 border-white"
                      />
                      {/* Online Status Green Dot */}
                      {isPartnerOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                      )}
                  </div>              

              <div className="ml-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    {activeChatProfile.full_name} 
                    {isPartnerOnline && <span className="text-xs font-normal text-green-200">Online</span>}
                </h3>
                <p className="text-rose-200 text-xs flex items-center gap-1"><MapPin size={10} /> {activeChatProfile.city}</p>
              </div>
              <button 
                  onClick={() => handleReportUser(activeChatProfile.id)}
                  className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-white"
              >
                  Report User
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-4 bg-gray-50 space-y-3" id="chat-messages-list">
              {chatMessages.length === 0 && <div className="text-center text-gray-400 mt-10 text-sm">Say hello! Start a godly conversation.</div>}
              {chatMessages.map((msg) => {
                const isMe = msg.sender_id === session.user.id
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-rose-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                        <div>{msg.content}</div>
                        {/* UPGRADE: Read Receipts UI */}
                        {isMe && (
                            <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                                <span className="text-[10px]">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                {msg.read_at ? <CheckCheck size={12} color="#bae6fd"/> : <Check size={12} color="#e5e7eb"/>}
                            </div>
                        )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex-grow flex flex-col justify-end p-4 bg-white border-t border-gray-200">
              {partnerIsTyping && (
                 <div className="flex items-center gap-2 mb-2 animate-pulse self-end"><span className="text-xs text-rose-500 font-medium">User is typing...</span></div>
              )}
              <div className="flex gap-2 w-full">
                
                

                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="flex-grow bg-gray-100 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />


                <button onClick={sendMessage} className="bg-rose-600 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-rose-700 transition shadow-md"><Heart size={18} fill="white" /></button>
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

                {/* Buttons */}
                <div className="flex gap-2 mt-6">
                    <button 
                        onClick={() => { setFilterCity(''); setFilterReligion(''); }}
                        className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50"
                    >
                        Reset
                    </button>
                    <button 
                        onClick={() => { setShowFilters(false); fetchCandidates(session.user.id, profile.gender, profile) }}
                        className="flex-1 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 shadow-lg"
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
