import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Heart, Church, Save, MapPin, User, X, MessageCircle, ArrowLeft } from 'lucide-react'

function App() {
  // --- STATES ---
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('discovery') // 'discovery', 'matches', 'chat'
  const [realtimeChannel, setRealtimeChannel] = useState(null)
  const [stats, setStats] = useState({ users: 0, matches: 0, messages: 0 })

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
  const [chatMessages, setChatMessages] = useState([])
  const [inputText, setInputText] = useState("")

  // 1. INITIALIZE SESSION
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) { 
        fetchProfile(session.user.id)
        fetchStats()
      }
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

  if (!supabase) return <div className="p-10 text-center">Loading configuration...</div>

    return () => subscription.unsubscribe()
  }, [])

  // 2. FETCH PROFILE & CANDIDATES
  async function fetchProfile(userId) {
    try {
      const { data: myProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError
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
    // 1. Count Users
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // 2. Count Matches
    const { count: matchCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })

    // 3. Count Messages
    const { count: msgCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })

    setStats({ users: userCount || 0, matches: matchCount || 0, messages: msgCount || 0 })
  }

  // 3. FETCH POTENTIAL MATCHES (Upgraded to Filter out Matches)
  async function fetchCandidates(myId, myGender) {
    const targetGender = myGender === 'male' ? 'female' : 'male'

    // 1. Fetch IDs of people you have already matched with (pending or mutual)
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('user_b_id') 
      .eq('user_a_id', myId)

    const matchedIds = existingMatches ? existingMatches.map(m => m.user_b_id) : []

    // 2. Fetch candidates, but exclude yourself AND your matches
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', myId) // Don't show me
      .eq('gender', targetGender) // Show opposite gender
      .not('id', 'in', `(${matchedIds.join(',')})`) // Don't show matches (Wrap list in parens for Supabase syntax)
      .order('updated_at', { ascending: false })

    if (error) console.error('Error fetching candidates:', error)
    else {
        setCandidates(data || [])
        setCurrentIndex(0) // Reset to first card every time
    }
  }

  // 4. FETCH MY MATCHES
  const fetchMyMatches = async () => {
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select('*') 
      .or(`user_a_id.eq.${session.user.id},user_b_id.eq.${session.user.id}`)
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

  // FIXED: RE-ASSEMBLED HANDLECONNECT
  const handleConnect = async () => {
    const targetUser = candidates[currentIndex]
    if (!targetUser) return
    setLoading(true)

    // A. CHECK: Did this person already like ME?
    // We use .limit(1) so it doesn't crash if there are 7 duplicates
    const { data: matchesData, error: checkError } = await supabase
      .from('matches')
      .select('*')
      .eq('user_a_id', targetUser.id)
      .eq('user_b_id', session.user.id)
      .limit(1) // Takes the first one it finds and ignores the rest

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
      const { error } = await supabase.from('matches').insert({
        user_a_id: session.user.id,
        user_b_id: targetUser.id,
        status: 'pending'
      })
      if (error) console.error("Error liking:", error)
      else console.log("Liked successfully")
      setLoading(false) 
    }

    setCurrentIndex(prev => prev + 1)
    setLoading(false)
  }

  // --- CHAT LOGIC (Correct Order) ---
  // 1. fetchMessages (Must be first)
  const fetchMessages = async (matchId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    if (error) console.error("Error fetching messages:", error)
    else setChatMessages(data || [])
  }

  // 2. sendMessage (Uses fetchMessages)
  const sendMessage = async () => {
    if (!inputText.trim() || !activeChatProfile) return

    const match = myMatches.find(m => 
      (m.user_a_id === session.user.id && m.user_b_id === activeChatProfile.id) ||
      (m.user_b_id === session.user.id && m.user_a_id === activeChatProfile.id)
    )

    if (!match) return

    const { error } = await supabase
      .from('messages')
      .insert({
        match_id: match.id,
        sender_id: session.user.id,
        content: inputText
      })

    if (error) {
      console.error("Error sending message:", error)
    } else {
      setInputText("")
      await fetchMessages(match.id) // Now it knows what fetchMessages is!
    }
  }

  // 3. openChat (Uses both fetchMessages and sendMessage logic)
  const openChat = async (profile) => {
    setActiveChatProfile(profile)
    setView('chat')
    
    const match = myMatches.find(m => 
      (m.user_a_id === session.user.id && m.user_b_id === profile.id) ||
      (m.user_b_id === session.user.id && m.user_a_id === profile.id)
    )

    if (match) {
      // Load existing messages
      await fetchMessages(match.id)

      // Cleanup previous listener
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
      }

      // Start Realtime Listener
      const channel = supabase
        .channel(`public:messages:match_id=eq.${match.id}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `match_id=eq.${match.id}` 
          }, (payload) => {
            console.log('New message received!', payload)
            setChatMessages(prev => [...prev, payload.new])
          })
        .subscribe()

      setRealtimeChannel(channel)
    } else {
      console.error("Match record not found")
    }
  }

  // --- RENDER ---

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

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
            {/* SHARE BUTTON */}
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
            <select required value={city} onChange={e => setCity(e.target.value)} className="w-full p-2 border rounded"><option value="">Select City</option><option value="Accra">Accra</option><option value="Kumasi">Kumasi</option><option value="Tema">Tema</option></select>
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
      {/* Navbar */}
      <header className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 text-rose-600">
          <Heart className="fill-current" /> 
          <span className="font-bold text-xl text-gray-800">SacredHearts</span>
        </div>
        
                <div className="flex bg-gray-100 rounded-lg p-1">
          <button 
            onClick={() => setView('discovery')}
            className={`px-3 py-1 rounded-md text-xs font-bold ${view === 'discovery' ? 'bg-white text-rose-600 shadow' : 'text-gray-500'}`}
          >
            Discover
          </button>
          <button 
            onClick={() => setView('matches')}
            className={`px-3 py-1 rounded-md text-xs font-bold ${view === 'matches' ? 'bg-white text-rose-600 shadow' : 'text-gray-500'}`}
          >
            Matches
          </button>
          <button 
            onClick={() => { setView('stats'); fetchStats() }} // Refresh stats when clicked
            className={`px-3 py-1 rounded-md text-xs font-bold ${view === 'stats' ? 'bg-white text-rose-600 shadow' : 'text-gray-500'}`}
          >
            Stats
          </button>
        </div>
        
        <button onClick={() => supabase.auth.signOut()} className="text-gray-400 hover:text-gray-600">
          <User size={20} />
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
                        className="text-gray-400 hover:text-rose-600 transition p-2 rounded-full hover:bg-rose-50"
                      >
                         <MessageCircle size={20} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        
        {/* --- VIEW: CHAT ROOM --- */}
        {view === 'chat' && activeChatProfile && (
          <div className="flex flex-col h-[calc(100vh-140px)] max-w-md mx-auto w-full bg-white shadow-2xl rounded-xl overflow-hidden">
            
            <div className="bg-rose-600 text-white p-4 flex items-center shadow-md z-10">
              <button 
                onClick={() => {
                  setView('matches')
                  // Stop listening to save resources
                  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
                  setActiveChatProfile(null)
                }}
                className="mr-3 hover:bg-rose-700 p-1 rounded-full"
              >
                <ArrowLeft size={24} />
              </button>
              
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChatProfile.full_name}&backgroundColor=ffffff`} 
                className="w-10 h-10 rounded-full border-2 border-white"
              />
              <div className="ml-3">
                <h3 className="font-bold text-lg">{activeChatProfile.full_name}</h3>
                <p className="text-rose-200 text-xs flex items-center gap-1">
                   <MapPin size={10} /> {activeChatProfile.city}
                </p>

              {/* Add this Report Button */}
              <button className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-white">
                Report User
              </button>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 bg-gray-50 space-y-3">
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
            </div>

            <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
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
