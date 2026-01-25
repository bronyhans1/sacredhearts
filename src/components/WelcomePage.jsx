import React from 'react';
import { Link } from 'react-router-dom'; 
import { Heart, LogIn, UserPlus, Sparkles } from 'lucide-react';
import logo from '../assets/logo.webp';
import Image from '../assets/Image.webp'; // The main background

const WelcomePage = ({ onLoginClick, onSignupClick }) => {
  return (
    // --- MAIN WRAPPER ---
    <div style={{ fontFamily: 'Montserrat, sans-serif' }} className="relative min-h-screen w-full overflow-hidden">
      
      {/* --- 1. CUSTOM BACKGROUND --- */}
      <div className="absolute inset-0 -z-10 h-full w-full">
        <div className="w-full h-full bg-cover bg-center bg-no-repeat" 
             style={{ backgroundImage: `url(${Image})` }}>
          
          {/* Minimal overlay (15%) to keep image sharp but text readable */}
          <div className="w-full h-full bg-black/20"></div>
        </div>
      </div>

      {/* --- 2. CONTENT WRAPPER --- */}
      <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-between py-10 px-6">
        
        {/* --- TOP SECTION (Logo) --- */}
        <div className="flex flex-col items-center mt-4 w-full text-center">
          <div className="relative mb-6">
            <div className="absolute -inset-2 bg-white/10 rounded-3xl -z-10"></div>
            <img 
              src={logo} 
              alt="SacredHearts Logo" 
              className="relative h-32 sm:h-40 w-auto object-contain drop-shadow-2xl"
            />
          </div>
          
          <h1 className="font-extrabold text-white text-3xl sm:text-5xl leading-tight tracking-wide uppercase mb-3 drop-shadow-lg"
              style={{ 
                WebkitTextStroke: '0.5px white',
                textShadow: '0px 4px 8px rgba(0,0,0,0.9), 0px 0px 4px rgba(0,0,0,0.9)' 
              }}>
            Faith Centered
            <br />
            <span className="text-rose-300">Love Focused</span>
          </h1>
        </div>

        {/* --- BOTTOM SECTION (Buttons) --- */}
        <div className="flex flex-col items-center gap-4 sm:gap-6 mb-20 w-full max-w-md">
          
          {/* --- 1. LOGIN BUTTON (GLASS) --- */}
          <button 
            onClick={onLoginClick} 
            className="group w-full bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold py-4 sm:py-5 text-lg sm:text-xl rounded-3xl shadow-xl hover:bg-white/20 hover:border-white/50 hover:scale-105 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3"
            style={{ textShadow: '0px 2px 6px rgba(0,0,0,0.5)' }}
          >
            <LogIn size={24} className="text-white" />
            <span className="group-hover:text-white transition-colors">Log In</span>
          </button>

          {/* --- 2. SIGNUP BUTTON (PINKY RED) --- */}
          <button 
            onClick={onSignupClick} 
            className="group w-full bg-rose-600 text-white font-bold py-4 sm:py-5 text-lg sm:text-xl rounded-3xl shadow-rose-500/40 shadow-xl hover:bg-rose-700 hover:shadow-rose-500/60 hover:scale-105 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3"
            style={{ textShadow: '0px 2px 6px rgba(0,0,0,0.3)' }}
          >
            <UserPlus size={24} className="text-white" />
            <span className="group-hover:text-white transition-colors">Create Account</span>
          </button>

          {/* --- FOOTNOTE --- */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl mt-2">
             <div className="flex items-start gap-3 text-white/90">
                <Sparkles size={20} className="text-rose-300 mt-1 shrink-0" />
                <p className="text-xs sm:text-sm font-light leading-relaxed text-left">
                   Welcome to a sacred space. We help you find genuine hearts, build real connections, and discover love with purpose.
                </p>
             </div>
          </div>
          
          <p className="font-medium text-[10px] sm:text-xs text-gray-300 tracking-wide text-center mt-4"
             style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.9)' }}>
             By continuing you agree to{' '}
             <Link to="/terms" className="text-white/90 hover:text-rose-200 hover:underline transition-colors cursor-pointer">Terms of Service</Link>,{' '}
             <Link to="/privacy"  className="text-white/90 hover:text-rose-200 hover:underline transition-colors cursor-pointer">Privacy Policy</Link>{' '}
             and{' '}
             <Link to="/guidelines" className="text-white/90 hover:text-rose-200 hover:underline transition-colors cursor-pointer">Community Guidelines</Link>.
          </p>
          <p className="font-medium text-[10px] sm:text-xs text-gray-300 tracking-wide text-center mt-10 drop-shadow-sm"
              style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.9)' }}>
            &copy; 2026 SacredHearts. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
};

export default WelcomePage;


