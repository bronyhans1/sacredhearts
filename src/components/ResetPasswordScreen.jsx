import React, { useState } from 'react';
import { ArrowLeft, Mail, CheckCircle, KeyRound } from 'lucide-react';
import logo from '../assets/logo.webp';
import loginImg from '../assets/loginimg.webp'; 

const ResetPasswordScreen = ({ onResetRequest, onBack, loading }) => {
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSuccess(true);
    // Pass email back to App.jsx
    onResetRequest(email);
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
            {isSuccess ? "Check Your Email" : "Forgot Password?"}
          </h2>
        </div>

        {/* --- FORM --- */}
        {isSuccess ? (
            // --- SUCCESS STATE ---
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/40">
                     <CheckCircle size={42} className="text-green-400 drop-shadow-lg" />
                </div>
                <p className="text-sm text-white/90 leading-relaxed">
                    If an account exists for <span className="font-bold text-rose-300">{email}</span>,<br/>
                    you will receive a reset link shortly.
                </p>
                <button 
                    onClick={onBack}
                    className="w-full bg-white text-rose-600 font-bold py-3.5 rounded-xl shadow-lg hover:bg-gray-100 active:scale-[0.98] transition-all duration-200"
                >
                    Back to Login
                </button>
            </div>
        ) : (
            // --- INPUT STATE ---
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Email Input */}
                <div className="relative">
                    <div className="absolute left-3 top-3.5 text-white/60">
                        <Mail size={18} strokeWidth={1.5} />
                    </div>
                    <input 
                    type="email" 
                    placeholder="Enter your Email" 
                    required 
                    className="w-full p-3 pl-10 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                    />
                </div>

                {/* Send Button */}
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-rose-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-rose-700 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <KeyRound size={18} /> {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </form>
        )}

      </div>
    </div>
  );
};

export default ResetPasswordScreen;