import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Check, AlertCircle, Loader2 } from 'lucide-react';
import logo from '../assets/logo.webp';
import signupImg from '../assets/signupimg.webp';
import { supabase } from '../supabaseClient';

const USERNAME_MIN = 3;
const USERNAME_MAX = 30;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

function normalizeUsername(value) {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

function isValidFormat(value) {
  if (!value || value.length < USERNAME_MIN) return false;
  if (value.length > USERNAME_MAX) return false;
  return USERNAME_REGEX.test(value);
}

const UsernameStep = ({ fullName, onSubmit, loading }) => {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid'
  const debounceRef = useRef(null);

  const checkAvailability = useCallback(async (raw) => {
    const normalized = normalizeUsername(raw);
    if (!normalized) {
      setStatus(null);
      return;
    }
    if (!isValidFormat(normalized)) {
      setStatus('invalid');
      return;
    }
    setStatus('checking');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', normalized)
        .maybeSingle();
      if (error) {
        setStatus(null);
        return;
      }
      setStatus(data ? 'taken' : 'available');
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!username.trim()) {
      setStatus(null);
      return;
    }
    debounceRef.current = setTimeout(() => checkAvailability(username), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username, checkAvailability]);

  const handleChange = (e) => {
    const v = e.target.value;
    if (v.length > USERNAME_MAX) return;
    setUsername(v);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const normalized = normalizeUsername(username);
    if (!normalized) return;
    if (!isValidFormat(normalized)) return;
    if (status !== 'available') return;
    onSubmit(normalized);
  };

  const canSubmit = status === 'available' && !loading;

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif' }} className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 -z-10 h-full w-full">
        <img src={signupImg} className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="SacredHearts" className="h-14 w-auto object-contain drop-shadow-2xl mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
            Choose your username
          </h2>
          {fullName && (
            <p className="text-white/80 text-center">
              Hi, <span className="font-semibold text-rose-200">{fullName}</span>! Pick a unique username to sign in with.
            </p>
          )}
          <p className="text-xs text-white/60 mt-2 text-center">
            3–30 characters, letters, numbers, and underscores only.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute left-3 top-3.5 text-white/60">
              <User size={18} strokeWidth={1.5} />
            </div>
            <input
              type="text"
              placeholder="e.g. john_doe_42"
              autoComplete="username"
              className="w-full p-3 pl-10 pr-12 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition"
              value={username}
              onChange={handleChange}
              disabled={loading}
            />
            <div className="absolute right-3 top-3.5 flex items-center justify-center w-6">
              {status === 'checking' && (
                <Loader2 size={20} className="text-white/60 animate-spin" />
              )}
              {status === 'available' && (
                <Check size={22} className="text-emerald-400" strokeWidth={2.5} />
              )}
              {status === 'taken' && (
                <AlertCircle size={20} className="text-rose-400" />
              )}
              {status === 'invalid' && username.length >= USERNAME_MIN && (
                <AlertCircle size={20} className="text-amber-400" />
              )}
            </div>
          </div>

          {status === 'taken' && (
            <p className="text-sm text-rose-300 font-medium flex items-center gap-2">
              <AlertCircle size={16} />
              Username taken. Try another.
            </p>
          )}
          {status === 'invalid' && username.length >= USERNAME_MIN && (
            <p className="text-sm text-amber-300 font-medium flex items-center gap-2">
              <AlertCircle size={16} />
              Use 3–30 letters, numbers, and underscores only.
            </p>
          )}
          {status === 'available' && (
            <p className="text-sm text-emerald-300 font-medium flex items-center gap-2">
              <Check size={16} />
              Username available.
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-rose-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-rose-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-600"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UsernameStep;
