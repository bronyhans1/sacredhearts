import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import { Heart, LogIn, UserPlus, Sparkles, Share, X } from 'lucide-react';
import logo from '../assets/logo.webp';
import Image from '../assets/Image.webp'; // The main background

const STORAGE_KEY = 'sacred_install_tip_dismissed';

const WelcomePage = ({ onLoginClick, onSignupClick }) => {
  const [showInstallTip, setShowInstallTip] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator.standalone === true);
    if (isStandalone) return;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) setShowInstallTip(true);
  }, []);

  const dismissInstallTip = () => {
    setShowInstallTip(false);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (_) {}
  };

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

        {/* --- iOS "Add to Home Screen" tip (no install prompt on iPhone) --- */}
        {showInstallTip && (
          <div className="absolute top-4 left-4 right-4 z-20 flex items-start gap-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/20 p-3 shadow-lg">
            <Share size={18} className="text-rose-300 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">Install Sacred Hearts</p>
              <p className="text-white/80 text-xs mt-0.5">
                Tap <span className="inline-flex items-center rounded bg-white/20 px-1.5 py-0.5">
                  <Share size={10} className="inline mr-1" /> Share
                </span> at the bottom, then <strong>Add to Home Screen</strong>.
              </p>
            </div>
            <button
              onClick={dismissInstallTip}
              className="shrink-0 p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
        )}

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


