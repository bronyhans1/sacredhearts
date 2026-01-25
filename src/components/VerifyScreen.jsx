import React, { useState } from 'react';
import { ArrowLeft, Key, RefreshCw, CheckCircle } from 'lucide-react';
import logo from '../assets/logo.webp';
import loginImg from '../assets/loginimg.webp'; 

const VerifyScreen = ({ onVerify, phone, onBack, loading }) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = (e) => {
    e.preventDefault();
    setIsVerifying(true);
    // Pass code back to App.jsx
    onVerify(code);
  };

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif' }} className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      
      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 -z-10 h-full w-full">
        <img src={loginImg} className="w-full h-full object-cover" alt="Background" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div> 
      </div>

      {/* --- GLASS CARD --- */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 text-center">
        
        {/* --- BACK BUTTON --- */}
        <button 
          onClick={onBack}
          className="absolute -top-12 left-0 text-white hover:text-rose-200 transition flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Back
        </button>

        {/* --- HEADER --- */}
        <div className="mb-8">
          <img src={logo} alt="SacredHearts" className="h-16 w-auto object-contain drop-shadow-2xl mb-4 mx-auto" />
          <h2 className="text-2xl font-bold text-white mb-2">Verify Number</h2>
          <p className="text-sm text-white/80 leading-relaxed">
            We sent a 6-digit code to <br/>
            <span className="font-bold text-rose-300">{phone}</span>
          </p>
        </div>

        {/* --- CODE INPUT --- */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="relative">
            <div className="absolute left-4 top-3.5 text-white/50">
              <Key size={24} strokeWidth={1.5} />
            </div>
            <input 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="6"
              placeholder="000000" 
              required 
              className="w-full p-4 pl-14 pr-4 border border-white/20 bg-white/10 text-white placeholder-white/30 rounded-2xl text-2xl font-bold tracking-widest focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition text-center"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))} // Only allow numbers
            />
          </div>

          {/* --- VERIFY BUTTON --- */}
          <button 
            type="submit" 
            disabled={loading || isVerifying || code.length !== 6}
            className="w-full bg-rose-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-rose-700 active:scale-[0.98] transition-all duration-200"
          >
            {(loading || isVerifying) ? 'Verifying...' : 'Verify & Continue'}
          </button>

          {/* --- RESEND LINK --- */}
          <p className="text-xs text-white/60">
            Didn't receive code?{' '}
            <span className="text-rose-300 font-bold cursor-pointer hover:text-rose-200 underline">
              Resend
            </span>
          </p>
        </form>

        {/* --- FOOTNOTE --- */}
        <div className="mt-8 flex items-start gap-2 bg-white/5 p-3 rounded-lg">
          <CheckCircle size={16} className="text-rose-300 mt-0.5 shrink-0" />
          <p className="text-[10px] text-white/60 text-left leading-tight">
            Please ensure you are entering the correct code sent via SMS. It expires in 5 minutes.
          </p>
        </div>

      </div>
    </div>
  );
};

export default VerifyScreen;