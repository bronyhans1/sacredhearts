import React, { useState } from 'react';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/logo.webp';
import loginImg from '../assets/loginimg.webp'; 

const SetNewPasswordScreen = ({ onUpdatePassword, onBack, loading }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      // You can show an error toast here if needed
      return;
    }
    onUpdatePassword(newPassword);
  };

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif' }} className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      
      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 -z-10 h-full w-full">
        <img src={loginImg} className="w-full h-full object-cover" alt="Background" />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div> 
      </div>

      {/* --- GLASS CARD --- */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8">
        
        {/* --- BACK BUTTON --- */}
        <button 
          onClick={onBack}
          className="absolute -top-12 left-0 text-white hover:text-rose-200 transition flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Back
        </button>

        {/* --- HEADER --- */}
        <div className="flex flex-col items-center mb-6">
          <img 
            src={logo} 
            alt="SacredHearts Logo" 
            className="h-16 w-auto object-contain drop-shadow-2xl mb-4"
          />
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center leading-tight">
            Set New Password
          </h2>
          <p className="text-sm text-white/70 text-center mt-2">
            Enter your new password below
          </p>
        </div>

        {/* --- FORM --- */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* New Password Input */}
          <div className="relative">
            <div className="absolute left-3 top-3.5 text-white/60">
              <Lock size={18} strokeWidth={1.5} />
            </div>
            <input 
              type={showNewPassword ? "text" : "password"} 
              placeholder="New Password" 
              required 
              className="w-full p-3 pl-10 pr-10 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
            />
            <button 
              type="button" 
              onClick={() => setShowNewPassword(!showNewPassword)} 
              className="absolute right-3 top-3.5 text-white/60 hover:text-white transition"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm Password Input */}
          <div className="relative">
            <div className="absolute left-3 top-3.5 text-white/60">
              <Lock size={18} strokeWidth={1.5} />
            </div>
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="Confirm Password" 
              required 
              className="w-full p-3 pl-10 pr-10 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
            />
            <button 
              type="button" 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
              className="absolute right-3 top-3.5 text-white/60 hover:text-white transition"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Update Button */}
          <button 
            type="submit" 
            disabled={loading || newPassword !== confirmPassword}
            className="w-full bg-rose-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-rose-700 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lock size={18} /> {loading ? 'Updating...' : 'Update Password'}
          </button>

          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-300 text-center">Passwords do not match</p>
          )}
        </form>

      </div>
    </div>
  );
};

export default SetNewPasswordScreen;
