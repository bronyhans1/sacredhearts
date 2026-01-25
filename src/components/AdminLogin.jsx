import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Shield } from 'lucide-react';
import logo from '../assets/logo.webp';
import loginImg from '../assets/loginimg.webp';

const AdminLogin = ({ onLogin, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    onLogin(email, password);
  };

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif' }} className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      
      {/* Background */}
      <div className="absolute inset-0 -z-10 h-full w-full">
        <img src={loginImg} className="w-full h-full object-cover" alt="Background" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div> 
      </div>

      {/* Glass Card */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4 p-3 bg-rose-600/20 rounded-full">
            <Shield size={32} className="text-rose-400" />
          </div>
          <img 
            src={logo} 
            alt="SacredHearts Logo" 
            className="h-12 w-auto object-contain drop-shadow-2xl mb-2"
          />
          <h2 className="text-2xl font-bold text-white text-center">
            Admin Portal
          </h2>
          <p className="text-sm text-white/70 text-center mt-2">
            Secure Administrator Access
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Input */}
          <div className="relative">
            <div className="absolute left-3 top-3.5 text-white/60">
              <Mail size={18} strokeWidth={1.5} />
            </div>
            <input 
              type="email" 
              placeholder="Admin Email" 
              required 
              className="w-full p-3 pl-10 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition" 
              value={email} 
              onChange={e => {
                setEmail(e.target.value);
                setError('');
              }}
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
              value={password} 
              onChange={e => {
                setPassword(e.target.value);
                setError('');
              }}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-3 top-3.5 text-white/60 hover:text-white transition"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Login Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-rose-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-rose-700 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Shield size={18} /> {loading ? 'Authenticating...' : 'Login to Admin Panel'}
          </button>
        </form>

        {/* Security Notice */}
        <p className="text-xs text-white/40 text-center mt-6">
          ⚠️ Authorized Personnel Only
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
