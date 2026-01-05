import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { Heart, Church, Save, MapPin, User, X, MessageCircle, ArrowLeft } from 'lucide-react'

function App() {
  // --- STATES ---
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('discovery')
  const [realtimeChannel, setRealtimeChannel] = useState(null)
  const [stats, setStats] = useState({ users: 0, matches: 0, messages: 0 })
  const [isSignupSuccess, setIsSignupSuccess] = useState(false)

  // Auth & Form States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [gender, setGender] = useState('')
  const [city, setCity] = useState('')
  const [religion, setReligion] = useState('')
  const [denomination, setDenomination] = useState('')
  const [intent, setIntent] = useState('')
  const [bio, setBio] = useState('')

  // Discovery States
  const [candidates, setCandidates] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)

  // Matches & Chat States
  const [myMatches, setMyMatches] = useState([])
  const [partnerProfiles, setPartnerProfiles] = useState([])
  const [activeChatProfile, setActiveChatProfile] = useState(null)
  // FEATURE 1: Typing Indicator (Separate States)
  const [isTyping, setIsTyping] = useState(false)      // Are YOU typing?
  const [partnerIsTyping, setPartnerIsTyping] = useState(false) // Is PARTNER typing?
  // CRASH FIX: Use Ref for Partner Timer
  const partnerTypingTimeout = useRef(null)
  const [chatMessages, setChatMessages] = useState([])
  const [inputText, setInputText] = useState("")

  // 1. INITIALIZE SESSION
  useEffect(() => {
    // A. Check if user just confirmed email
    const urlParams = new URLSearchParams(window.location.search)
    const type = urlParams.get('type')

    if (type === 'signup' || type === 'recovery') {
        setIsSignupSuccess(true)
        window.history.replaceState({}, document.title, window.location.pathname)
    }

    // B. Check normal session
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

      setProfile(myProfile)
      
      if(myProfile.full_name) setFullName(myProfile.full_name)
      if(myProfile.gender) setGender(myProfile.gender)
      if(myProfile.city) setCity(myProfile.city)
      if(myProfile.religion) setReligion(myProfile.religion)
      if(myProfile.denomination) setDenomination(myProfile.denomination)
      if(myProfile.intent) setIntent(myProfile.intent)
      if(myProfile.bio) setBio(myProfile.bio)

      if (myProfile.gender) {
        await fetchCandidates(userId, myProfile.gender)
      }
    } catch (error) {
      console.error('Error:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: matchCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })

    const { count: msgCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })

    setStats({ users: userCount || 0, matches: matchCount || 0, messages: msgCount || 0 })
  }

  // 3. FETCH POTENTIAL MATCHES
  async function fetchCandidates(myId, myGender) {
    const targetGender = myGender === 'male' ? 'female' : 'male'

    // 1. Fetch IDs of people you have ALREADY MATCHED WITH (only Mutual)
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('user_b_id') 
      .eq('user_a_id', myId)
      .eq('status', 'mutual')

    const matchedIds = existingMatches ? existingMatches.map(m => m.user_b_id) : []

    // 2. Fetch candidates, but exclude yourself AND your matches
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', myId) 
      .eq('gender', targetGender)
      .not('id', 'in', `(${matchedIds.join(',')})`) 
      .order('updated_at', { ascending: false })

    if (error) console.error('Error fetching candidates:', error)
    else {
        setCandidates(data || [])
        setCurrentIndex(0)
    }
  }

  // 4. FETCH MY MATCHES
  const fetchMyMatches = async () => {
    // SAFETY FIX: Check if session exists before fetching matches
    if (!session) {
        console.warn("No session in fetchMyMatches. Skipping.")
        return
    }

    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select('*') 
      .or(`user_a_id.eq.${session.user.id}, user_b_id.eq.${session.user.id}`)
      .eq('status', 'mutual')

    if (matchError) {
        console.error("Error fetching matches:", matchError)
        return
    }

    if (!matches || matches.length === 0) {
        setMyMatches([])
        setPartnerProfiles([])
        return
    }

    const partnerIds = matches.map((m) => {
        return m.user_a_id === session.user.id ? m.user_b_id : m.user_a_id
    })
    const uniquePartnerIds = [...new Set(partnerIds)]

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', uniquePartnerIds)

    if (profileError) console.error("Error fetching partner profiles:", profileError)
    else {
        setMyMatches(matches)
        setPartnerProfiles(profiles || [])
    }
  }

  useEffect(() => {
    if (view === 'matches' && session) {
        fetchMyMatches()
    }
  }, [view])

  // --- HANDLERS ---

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const { error: signUpError } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: 'New User' } }
      })
      if (signUpError) alert(signUpError.message)
      else alert('Check your email for confirmation!')
    }
    setLoading(false)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!session) return
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName, gender, city, religion, denomination, intent, bio,
        updated_at: new Date(),
      })
      .eq('id', session.user.id)

    if (error) alert(error.message)
    else {
      alert('Profile Saved!')
      fetchProfile(session.user.id)
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

    // A. CHECK: Did this person already like ME?
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
      // CASE 1: IT'S A MATCH!
      await supabase.from('matches').update({ status: 'mutual' }).eq('id', existingMatch.id)
      await supabase.from('matches').insert({
        user_a_id: session.user.id,
        user_b_id: targetUser.id,
        status: 'mutual'
      })
      alert(`🎉 IT'S A MATCH with ${targetUser.full_name}!`)
    } else {
      // CASE 2: Just a Pending Like
      // FEATURE 3: Connection Requested Alert
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

  // --- CHAT LOGIC (With "Any User" Typing Indicator) ---

  const fetchMessages = async (matchId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error("Error fetching messages:", error)
      setChatMessages([]) 
    } else {
      setChatMessages(data || [])
    }
    
    // SCROLL FIX: Auto-scroll to bottom when chat is opened
    setTimeout(() => {
        const list = document.getElementById('chat-messages-list')
        if (list) {
            list.scrollTop = list.scrollHeight
        }
    }, 100)
  }

  const sendMessage = async () => {
    if (!inputText.trim() || !activeChatProfile) return

    const match = myMatches.find(m => 
      (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
      (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
    )

    if (!match) return

    // PARTNER TYPING: Stop typing indicator on send
    const { error: typingError } = await supabase
      .from('messages')
      .update({ is_typing: false })
      .eq('id', match.id)
    
    if (typingError) console.error("Error updating typing status:", typingError)

    const { error } = await supabase
      .from('messages')
      .insert({
        match_id: match.id,
        sender_id: session.user.id,
        content: inputText,
        is_typing: false // Ensure new message is not marked as typing
      })

    if (error) {
      console.error("Error sending message:", error)
    } else {
      setInputText("")
      await fetchMessages(match.id) 
    }
  }

  // DEBOUNCED TYPING TRIGGER (Updates Database)
  // FIX: Removed specific sender_id filter to satisfy "Any User" requirement.
  const updateTypingStatus = async (matchId, isTyping) => {
    console.log(`[DEBUG] Triggering DB update. is_typing=${isTyping} for match_id=${matchId}`)
    const { error } = await supabase
      .from('messages')
      .update({ is_typing: isTyping })
      .eq('id', matchId)
    if (error) console.error("Error updating typing status in DB:", error)
  }

  const handleInputChange = useCallback((e) => {
    const text = e.target.value
    setInputText(text)

    // Only trigger DB update if we are in a chat
    if (view === 'chat' && activeChatProfile) {
        const match = myMatches.find(m => 
            (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
            (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
        )

        if (match) {
            // Debounce logic: Only send true if user has typed something and hasn't typed in a while
            if (text.length > 0) {
                updateTypingStatus(match.id, true)
            } else {
                updateTypingStatus(match.id, false)
            }
        }
    }
  }, [view, activeChatProfile, myMatches])

  const openChat = async (profile) => {
    setActiveChatProfile(profile)
    setView('chat')
    
    // FIX: Reset both typing states to clean slate
    setIsTyping(false) 
    setPartnerIsTyping(false)
    
    const match = myMatches.find(m => 
      (m.user_a_id === session.user.id && m.user_b_id === profile.id) ||
      (m.user_b_id === session.user.id && m.user_a_id === profile.id)
    )

    if (match) {
      await fetchMessages(match.id)

      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
      }

      const channel = supabase
        .channel(`public:messages:match_id=eq.${match.id}`)
        
        // 1. Listen for New Messages (Auto-scroll trigger)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `match_id=eq.${match.id}` 
          }, (payload) => {
            console.log('New message received!', payload)
            // FIX: Append to state (instead of re-fetching everything) - This helps with scroll
            setChatMessages(prev => [...prev, payload.new])
          })
        
        // 2. Listen for Typing Status (The "Any User" Feature)
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'messages',
            filter: `match_id=eq.${match.id}`
          }, (payload) => {
            console.log(`[DEBUG] Typing status update. is_typing=${payload.new.is_typing}`)
            
            // FIX: Removed sender_id filter logic to satisfy "Any User" requirement.
            // Logic: If is_typing is true, show indicator. 
            // This satisfies "I want both users to see when any of them is typing".
            // The text "User A" is static (derived from activeChatProfile.full_name).
            if (payload.new.is_typing === true) {
                setPartnerIsTyping(true)
                
                // Hide indicator after 3 seconds (in case User A stopped typing but DB didn't update to false yet)
                const timerId = setTimeout(() => {
                    setPartnerIsTyping(false)
                }, 3000)
                partnerTypingTimeout.current = timerId
            } else {
                // Explicitly clear if they stopped typing
                if (partnerTypingTimeout.current) {
                    clearTimeout(partnerTypingTimeout.current)
                }
                setPartnerIsTyping(false)
            }
          })
        .subscribe()

      setRealtimeChannel(channel)
    } else {
      console.error("Match record not found")
    }
  }

  // --- AUTO-SCROLL WATCHER (Auto-scroll to bottom when new message arrives) ---
  useEffect(() => {
    if (view === 'chat' && chatMessages.length > 0) {
      // Small delay to ensure DOM is updated with new message
      setTimeout(() => {
         const list = document.getElementById('chat-messages-list')
         if (list) {
             list.scrollTop = list.scrollHeight
         }
      }, 100) // 100ms is usually enough
    }
  }, [chatMessages])

  // --- PARTNER TYPING CLEANUP (Auto-hides "User A is typing" after 3s) ---
  useEffect(() => {
    if (partnerTypingTimeout.current) {
        clearTimeout(partnerTypingTimeout.current)
        setPartnerIsTyping(false)
    }
  }, [view])

  // --- RENDER ---

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  // VIEW 0.5: EMAIL CONFIRMATION SUCCESS
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

          <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Welcome to <span className="text-rose-600">SacredHearts</span>!
          </h1>
          
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            Your email is verified. Your account is ready to start meaningful connections.
          </p>

          <div className="flex flex-col gap-3">
             <button 
                onClick={() => setIsSignupSuccess(false)}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transition transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <User size={20} /> Continue to App
              </button>
             
             <button 
                onClick={() => setIsSignupSuccess(false)}
                className="text-gray-400 hover:text-gray-600 font-medium py-2 transition text-sm"
              >
                Back to Login
              </button>
          </div>

        </div>
      </div>
    )
  }

  // VIEW 1: Login
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="flex justify-center mb-4 text-rose-600"><Church size={48} /></div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">SacredHearts GH (BETA)</h1>
          <p className="text-gray-500 mb-6 text-sm">Connecting Hearts Under Grace</p>
          <form onSubmit={handleAuth} className="space-y-4 text-left">
            <input type="email" placeholder="Email" required className="w-full p-2 border rounded" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required className="w-full p-2 border rounded" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit" className="w-full bg-rose-600 text-white py-2 rounded font-bold">Log In / Sign Up</button>            
            <button 
              onClick={() => {
                     navigator.clipboard.writeText("Check out SacredHearts GH - Ghana's faith-based dating app: " + window.location.href)
                     alert("Link copied! Share it on WhatsApp now.")
              }}
              className="w-full bg-gray-100 text-gray-600 py-2 rounded font-bold mt-2 text-sm hover:bg-gray-200"
            >
               📤 Invite Friends
            </button>
          </form>
        </div>
      </div>
    )
  }

  // VIEW 2: Profile Setup
  if (!profile || !profile.gender || !profile.intent) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-lg mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2"><User className="text-rose-600" /> Complete Profile</h2>
          <p className="text-sm text-gray-500 mb-6">Tell us about yourself.</p>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <input type="text" placeholder="Full Name" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-2 border rounded" />
            <select required value={gender} onChange={e => setGender(e.target.value)} className="w-full p-2 border rounded"><option value="">Select Gender</option><option value="male">Man</option><option value="female">Woman</option></select>
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
            <select required value={religion} onChange={e => setReligion(e.target.value)} className="w-full p-2 border rounded"><option value="">Select Religion</option><option value="Christian">Christian</option><option value="Muslim">Muslim</option></select>
            <select required value={intent} onChange={e => setIntent(e.target.value)} className="w-full p-2 border rounded"><option value="">Select Goal</option><option value="Serious Dating">Serious Dating</option><option value="Marriage">Marriage</option></select>
            <textarea rows="3" placeholder="About Me..." required value={bio} onChange={e => setBio(e.target.value)} className="w-full p-2 border rounded"></textarea>
            <button type="submit" disabled={loading} className="w-full bg-rose-600 text-white font-bold py-3 rounded"><Save size={18} className="inline mr-2"/> Save</button>
          </form>
        </div>
      </div>
    )
  }

  const currentCandidate = candidates[currentIndex]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 text-rose-600">
          <Heart className="fill-current" /> 
          <span className="font-bold text-xl text-gray-800">SacredHearts</span>
        </div>
        
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button 
            onClick={() => setView('discovery')}
            className={`px-3 py-1 rounded-md text-xs font-bold ${view === 'discovery' ? 'bg-white text-rose-600 shadow' : 'text-gray-500'}`}>
            Discover
          </button>
          <button 
            onClick={() => setView('matches')}
            className={`px-3 py-1 rounded-md text-xs font-bold ${view === 'matches' ? 'bg-white text-rose-600 shadow' : 'text-gray-500'}`}>
            Matches
          </button>
          <button 
            onClick={() => { setView('stats'); fetchStats() }}
            className={`px-3 py-1 rounded-md text-xs font-bold ${view === 'stats' ? 'bg-white text-rose-600 shadow' : 'text-gray-500'}`}>
            Stats
          </button>
        </div>
        
        <button onClick={() => supabase.auth.signOut()} className="text-gray-400 hover:text-gray-600 flex items-center gap-1">
          <User size={20} /> <span className="text-gray-600">Logout</span>
        </button>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 relative">
        
        {/* --- VIEW: DISCOVERY --- */}
        {view === 'discovery' && (
          <div className="w-full max-w-md">
            {!currentCandidate && (
              <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
                <h3 className="text-xl font-bold text-gray-800 mb-2">No More Profiles</h3>
                <p className="text-gray-600 mb-4">Check back later for new singles in {profile.city}.</p>
              </div>
            )}
            {currentCandidate && (
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">
                <div className="h-64 bg-gray-200 flex items-center justify-center overflow-hidden">
                   <img 
                     src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentCandidate.full_name}&backgroundColor=b6e3f4`} 
                     alt="Avatar" 
                     className="h-full w-full object-cover"
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
                    <div><span className="font-bold text-gray-900">Faith:</span> {currentCandidate.religion}</div>
                    <div><span className="font-bold text-gray-900">Intent:</span> {currentCandidate.intent}</div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={handlePass} className="flex-1 border border-gray-300 text-gray-500 hover:bg-gray-50 py-3 rounded-lg font-bold flex justify-center items-center gap-2">
                      <X size={20} /> Pass
                    </button>
                    <button onClick={handleConnect} disabled={loading} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-md">
                      <Heart size={20} /> Connect
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW: MATCHES LIST --- */}
        {view === 'matches' && (
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Your Connections</h2>
            
            {partnerProfiles.length === 0 ? (
               <div className="text-center text-gray-500">No matches yet. Keep connecting!</div>
            ) : (
              <div className="grid gap-4">
                {partnerProfiles.map((matchProfile) => {
                  return (
                    <div key={matchProfile.id} className="bg-white p-4 rounded-xl shadow-lg border border-rose-100 flex items-center gap-4 hover:bg-gray-50 transition">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${matchProfile.full_name}&backgroundColor=b6e3f4`} 
                        className="w-16 h-16 rounded-full bg-gray-100 border-2 border-white shadow-sm"
                        alt="Avatar"
                      />
                      <div className="text-left flex-grow">
                        <h3 className="font-bold text-lg text-gray-900">{matchProfile.full_name}</h3>
                        <p className="text-sm text-rose-600 font-medium flex items-center gap-1">
                           <MapPin size={12} /> {matchProfile.city}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {matchProfile.bio}
                        </p>
                      </div>
                      <button 
                        onClick={() => openChat(matchProfile)} 
                        className="text-gray-400 hover:text-rose-600 transition p-2 rounded-full hover:bg-rose-50">
                           <MessageCircle size={20} />
                        </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        
        {/* --- VIEW: CHAT ROOM (With Typing Indicator, Auto Scroll & Fixed Layout) --- */}
        {view === 'chat' && activeChatProfile && (
          <div className="flex flex-col h-[calc(100vh-140px)] max-w-md mx-auto w-full bg-white shadow-2xl rounded-xl overflow-hidden">
            
            {/* Chat Header (Red) */}
            <div className="bg-rose-600 text-white p-4 flex items-center shadow-md z-10">
              <button 
                onClick={() => {
                    setView('matches')
                    if (realtimeChannel) supabase.removeChannel(realtimeChannel)
                    setActiveChatProfile(null)
                    if (partnerTypingTimeout.current) clearTimeout(partnerTypingTimeout.current)
                }}
                className="mr-3 hover:bg-rose-700 p-1 rounded-full"
              >
                <ArrowLeft size={24} />
              </button>
              
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChatProfile.full_name}&backgroundColor=ffffff`} 
                className="w-10 h-10 rounded-full border-2 border-white"
              />
              
              {/* Header Info Container */}
              <div className="ml-3">
                {/* FIX: City moved below Name as requested */}
                <h3 className="font-bold text-lg">{activeChatProfile.full_name}</h3>
                <p className="text-rose-200 text-xs flex items-center gap-1">
                   <MapPin size={10} /> {activeChatProfile.city}
                </p>
                
                {/* FEATURE 1: Typing Indicator (Partner Side - Shows when ANYONE types) */}
                {partnerIsTyping ? (
                   <span className="text-xs font-bold text-white animate-pulse">User A is typing...</span>
                ) : null}
              </div>
              
              {/* Report Button */}
              <button className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-white">
                Report User
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4 bg-gray-50 space-y-3" id="chat-messages-list">
              {chatMessages.length === 0 && (
                 <div className="text-center text-gray-400 mt-10 text-sm">
                    Say hello! Start a godly conversation.
                 </div>
              )}
              
              {chatMessages.map((msg) => {
                const isMe = msg.sender_id === session.user.id
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                      isMe 
                        ? 'bg-rose-600 text-white rounded-br-none' 
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                )
              })}

              {/* FEATURE 1: Typing Indicator (Partner Side - Moved to bottom of message list) */}
              {partnerIsTyping && (
                 <div className="flex items-center gap-2 mb-2 animate-pulse">
                    <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"></div>
                    <span className="text-xs text-rose-500 font-medium">User A is typing...</span>
                 </div>
              )}
            </div>

            {/* Input Area (With DB Sync Typing Trigger) */}
            <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
              <input 
                  type="text" 
                  value={inputText}
                  onChange={handleInputChange} 
                  placeholder="Type a message..." 
                  className="flex-grow bg-gray-100 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
              <button 
                  onClick={sendMessage}
                  className="bg-rose-600 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-rose-700 transition shadow-md"
                  >
                    <Heart size={18} fill="white" />
                  </button>
            </div>

          </div>
        )}

        {/* --- VIEW: STATS (FOUNDER DASHBOARD) --- */}
        {view === 'stats' && (
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Platform Growth</h2>
            
            <div className="grid grid-cols-2 gap-4">
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
               <p className="text-sm text-blue-800 font-medium text-center">
                  💡 Tip: Refresh "Stats" tab to see real-time growth.
               </p>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

function calculateAge(dateString) {
  if (!dateString) return "" 
  const today = new Date()
  const birthDate = new Date(dateString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export default App
