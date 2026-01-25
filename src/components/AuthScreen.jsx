import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Phone, Mail, Lock, User, MapPin, Calendar } from 'lucide-react';
import logo from '../assets/logo.webp';
import loginImg from '../assets/loginimg.webp'; 
import signupImg from '../assets/signupimg.webp'; 

const AuthScreen = ({ mode: initialMode, onSubmit, onBack, onForgotClick, loading }) => {
  // --- LOCAL STATE FOR UI ---
  const [activeTab, setActiveTab] = useState(initialMode); // 'login' or 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Signup Method Toggle
  const [signupMethod, setSignupMethod] = useState('email'); // 'email' or 'phone'

  // --- FORM FIELDS STATE ---
  // Login Fields (email or username; phone when OTP is enabled)
  const [loginEmailOrUsername, setLoginEmailOrUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup Fields
  const [signupName, setSignupName] = useState('');
  const [signupGender, setSignupGender] = useState('');
  const [signupDOB, setSignupDOB] = useState('');
  const [signupCity, setSignupCity] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // --- LOGIN LOGIC ---
    if (activeTab === 'login') {
      onSubmit({
        type: 'login',
        emailOrUsername: loginEmailOrUsername,
        password: loginPassword,
        rememberMe: rememberMe
      });
    } 
    // --- SIGNUP LOGIC ---
    else {
      onSubmit({
        type: 'signup',
        method: signupMethod, // 'email' or 'phone'
        signupName,
        signupGender,
        signupDOB,
        signupCity,
        signupEmail,
        signupPhone,
        password: signupPassword
      });
    }
  };

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif' }} className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      
      {/* --- 1. DYNAMIC BACKGROUND IMAGE --- */}
      <div className="absolute inset-0 -z-10 h-full w-full transition-all duration-700 ease-in-out">
        <img 
          src={activeTab === 'login' ? loginImg : signupImg} 
          className="w-full h-full object-cover" 
          alt="SacredHearts Background"
        />
        {/* Darker overlay to make white text readable on top of background */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-ms"></div> 
      </div>

      {/* --- 2. PURE GLASS CARD --- */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8">
        
        {/* --- A. BACK BUTTON --- */}
        <button 
          onClick={onBack}
          className="absolute -top-12 left-0 text-white hover:text-rose-200 transition flex items-center gap-2"
          aria-label="Back to Welcome"
        >
          <ArrowLeft size={20} /> Back
        </button>

        {/* --- B. LOGO --- */}
        <div className="flex flex-col items-center mb-6">
          <img 
            src={logo} 
            alt="SacredHearts Logo" 
            className="h-16 w-auto object-contain drop-shadow-2xl mb-2"
          />
        </div>

        {/* --- C. HEADERS (Dynamic) --- */}
        {activeTab === 'login' ? (
            <h2 className="text-xl sm:text-2xl font-extrabold text-white text-center mb-8 leading-tight drop-shadow-md">
                Connecting Hearts <br />
                <span className="text-rose-300">Under Grace</span>
            </h2>
        ) : (
            <p className="text-sm sm:text-base text-white/90 text-center font-light italic mb-6 leading-relaxed drop-shadow-md">
                "A sacred space to meet genuine hearts, build real connections, and find love with purpose."
            </p>
        )}

        {/* --- D. TABS --- */}
        <div className="flex bg-white/10 border border-white/10 p-1 rounded-xl mb-6 backdrop-blur-sm">
          <button 
            onClick={() => setActiveTab('login')} 
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all duration-300 ${
              activeTab === 'login' ? 'bg-rose-600/90 text-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Login
          </button>
          <button 
            onClick={() => setActiveTab('signup')} 
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all duration-300 ${
              activeTab === 'signup' ? 'bg-rose-600/90 text-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* --- E. FORMS --- */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* --- 1. LOGIN FORM --- */}
          {activeTab === 'login' && (
            <div className="space-y-4 animate-fade-in-up">
              
              {/* Email, Username, or Phone Input */}
              <div className="relative">
                <div className="absolute left-3 top-3.5 text-white/60">
                  <Mail size={18} strokeWidth={1.5} />
                </div>
                <input 
                  type="text" 
                  placeholder="Email, username, or phone" 
                  required 
                  autoComplete="username"
                  className="w-full p-3 pl-10 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition" 
                  value={loginEmailOrUsername} 
                  onChange={e => setLoginEmailOrUsername(e.target.value)} 
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute left-3 top-3.5 text-white/60">
                  <Lock size={18} strokeWidth={1.5} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  required 
                  className="w-full p-3 pl-10 pr-10 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition" 
                  value={loginPassword} 
                  onChange={e => setLoginPassword(e.target.value)} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-3.5 text-white/60 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex justify-between items-center text-xs sm:text-sm text-white/90">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="accent-rose-600 w-4 h-4 rounded border-gray-300"
                  />
                  Remember me
                </label>
                {/* --- UPDATED: Now wired to onBack prop --- */}
                <button 
                  type="button" 
                  onClick={onForgotClick} 
                  className="text-rose-200 hover:text-white font-bold transition"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-rose-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-rose-700 active:scale-[0.98] transition-all duration-300 ease-in-out mt-2 hover:shadow-xl hover:scale-[1.02]"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </div>
          )}

          {/* --- 2. SIGNUP FORM --- */}
          {activeTab === 'signup' && (
            <div className="space-y-3 animate-fade-in-up">
              
              {/* Method Toggle (Email vs Phone) */}
              <div className="flex bg-white/10 border border-white/10 p-1 rounded-lg mb-4 backdrop-blur-sm">
                <button 
                  type="button"
                  onClick={() => setSignupMethod('email')} 
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
                    signupMethod === 'email' ? 'bg-rose-600/90 text-white shadow-sm' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Email
                </button>
                <button 
                  type="button"
                  onClick={() => setSignupMethod('phone')} 
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
                    signupMethod === 'phone' ? 'bg-rose-600/90 text-white shadow-sm' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Phone (SMS)
                </button>
              </div>

              {/* Common Signup Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <div className="absolute left-2.5 top-3 text-white/60"><User size={16} strokeWidth={1.5}/></div>
                  <input type="text" placeholder="Full Name" required className="w-full p-2.5 pl-9 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition" value={signupName} onChange={e => setSignupName(e.target.value)} />
                </div>
                <select required className="w-full p-2.5 border border-white/20 bg-white/10 text-white rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition [&>option]:text-gray-800" value={signupGender} onChange={e => setSignupGender(e.target.value)}>
                  <option value="" className="text-gray-800">Gender</option>
                  <option value="male">Man</option>
                  <option value="female">Woman</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <div className="absolute left-2.5 top-3 text-white/60"><Calendar size={16} strokeWidth={1.5}/></div>
                  {/* Added Label for Date of Birth */}
                  <span className="text-[10px] text-white/60 absolute -top-2 left-2 px-1 bg-black/20 backdrop-blur-sm rounded">Date of Birth</span>
                  <input 
                    type="text" 
                    required 
                    placeholder="YYYY-MM-DD (e.g., 1990-12-25)"
                    className="w-full p-2.5 pl-9 border border-white/20 bg-white/10 text-white rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition placeholder-white/40" 
                    value={signupDOB} 
                    onChange={e => {
                      // Allow manual entry in YYYY-MM-DD format (matches database)
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
                      setSignupDOB(value);
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
                          setSignupDOB(fixed);
                        }
                      }
                    }}
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-2.5 top-3 text-white/60"><MapPin size={16} strokeWidth={1.5}/></div>
                  <select required className="w-full p-2.5 pl-9 border border-white/20 bg-white/10 text-white rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition [&>option]:text-gray-800" value={signupCity} onChange={e => setSignupCity(e.target.value)}>
                    <option value="" className="text-gray-800">City</option>
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
              </div>

              {/* --- EMAIL OR PHONE INPUT (Dynamic) --- */}
              {signupMethod === 'email' ? (
                <div className="relative">
                  <div className="absolute left-2.5 top-3 text-white/60"><Mail size={16} strokeWidth={1.5}/></div>
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    required 
                    className="w-full p-2.5 pl-9 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition" 
                    value={signupEmail} 
                    onChange={e => setSignupEmail(e.target.value)} 
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-2.5 top-3 text-white/60"><Phone size={16} strokeWidth={1.5}/></div>
                  <input 
                    type="tel" 
                    placeholder="Phone Number (+233...)" 
                    required 
                    className="w-full p-2.5 pl-9 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition" 
                    value={signupPhone} 
                    onChange={e => setSignupPhone(e.target.value)} 
                  />
                  <p className="text-[10px] text-white/50 mt-1 ml-1">* A verification code will be sent to this number.</p>
                </div>
              )}

              {/* Password Input */}
              <div className="relative">
                <div className="absolute left-2.5 top-3 text-white/60"><Lock size={16} strokeWidth={1.5}/></div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Create Password" 
                  required 
                  className="w-full p-2.5 pl-9 pr-9 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition" 
                  value={signupPassword} 
                  onChange={e => setSignupPassword(e.target.value)} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-3 text-white/60 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Signup Button */}
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-rose-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-rose-700 active:scale-[0.98] transition-all duration-300 ease-in-out mt-2 hover:shadow-xl hover:scale-[1.02]"
              >
                {loading ? 'Processing...' : 'Create Account'}
              </button>
            </div>
          )}
        </form>

        {/* --- FOOTNOTE --- */}
        <p className="text-[10px] text-white/40 text-center mt-6 leading-tight">
          By continuing, you agree to our <br/> 
          <Link to="/terms" className="text-white/60">Terms of Service</Link> & <Link to="/privacy" className="text-white/60">Privacy Policy</Link>.
        </p>

      </div>
    </div>
  );
};

export default AuthScreen;