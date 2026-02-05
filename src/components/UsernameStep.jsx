import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Check, AlertCircle, Loader2, MapPin, MapPinned } from 'lucide-react';
import logo from '../assets/logo.webp';
import signupImg from '../assets/signupimg.webp';
import { supabase } from '../supabaseClient';

const USERNAME_MIN = 3;
const USERNAME_MAX = 30;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

const GHANA_CITIES = [
  'Accra', 'Kumasi', 'Tema', 'Tamale', 'Cape Coast', 'Takoradi', 'Sunyani',
  'Ho', 'Wa', 'Techiman', 'Goaso', 'Nalerigu', 'Sefwi Wiaso', 'Damango', 'Dambai', 'Bolgatanga'
];

async function reverseGeocodeNominatim(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'SacredHeartsApp/1.0 (https://sacredhearts.app)'
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const address = data?.address;
    if (!address) return null;
    const city = address.city || address.town || address.village || address.municipality || address.county || address.state || '';
    return city ? city.trim() : null;
  } catch {
    return null;
  }
}

function normalizeUsername(value) {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

function isValidFormat(value) {
  if (!value || value.length < USERNAME_MIN) return false;
  if (value.length > USERNAME_MAX) return false;
  return USERNAME_REGEX.test(value);
}

const UsernameStep = ({ fullName, onSubmit, loading, currentUserId, initialCity = '', initialRegion = '' }) => {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid'
  const [locationType, setLocationType] = useState(initialRegion === 'diaspora' ? 'diaspora' : 'ghana');
  const [city, setCity] = useState(initialCity || '');
  const [locationDetecting, setLocationDetecting] = useState(false);
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
      let query = supabase
        .from('profiles')
        .select('id')
        .eq('username', normalized);
      if (currentUserId) query = query.neq('id', currentUserId);
      const { data, error } = await query.maybeSingle();
      if (error) {
        setStatus(null);
        return;
      }
      setStatus(data ? 'taken' : 'available');
    } catch {
      setStatus(null);
    }
  }, [currentUserId]);

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

  const handleUsernameChange = (e) => {
    const v = e.target.value;
    if (v.length > USERNAME_MAX) return;
    setUsername(v);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocationDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationStr = await reverseGeocodeNominatim(latitude, longitude);
        if (locationStr) setCity(locationStr);
        setLocationDetecting(false);
      },
      () => setLocationDetecting(false),
      { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const normalized = normalizeUsername(username);
    if (!normalized || !isValidFormat(normalized)) return;
    if (status !== 'available') return;
    const trimmedCity = city?.trim() || '';
    if (!trimmedCity) return;
    const region = locationType === 'ghana' || locationType === 'diaspora' ? locationType : 'ghana';
    onSubmit({ username: normalized, city: trimmedCity, region });
  };

  const canSubmit = status === 'available' && !loading && (city?.trim() || '').length > 0;

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif' }} className="relative min-h-screen w-full overflow-hidden flex items-center justify-center py-8">
      <div className="absolute inset-0 -z-10 h-full w-full">
        <img src={signupImg} className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8">
        <div className="flex flex-col items-center mb-5">
          <img src={logo} alt="SacredHearts" className="h-12 w-auto object-contain drop-shadow-2xl mb-3" />
          <h2 className="text-xl font-bold text-white text-center mb-1">
            Username & location
          </h2>
          {fullName && (
            <p className="text-white/80 text-sm text-center">
              Hi, <span className="font-semibold text-rose-200">{fullName}</span>! Set your username and where you’re based.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-white/80 mb-1.5">Username</label>
            <div className="relative">
              <div className="absolute left-3 top-3.5 text-white/60">
                <User size={18} strokeWidth={1.5} />
              </div>
              <input
                type="text"
                placeholder="e.g. john_doe_42"
                autoComplete="username"
                className="w-full p-3 pl-10 pr-12 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition text-sm"
                value={username}
                onChange={handleUsernameChange}
                disabled={loading}
              />
              <div className="absolute right-3 top-3.5 flex items-center justify-center w-6">
                {status === 'checking' && <Loader2 size={20} className="text-white/60 animate-spin" />}
                {status === 'available' && <Check size={22} className="text-emerald-400" strokeWidth={2.5} />}
                {status === 'taken' && <AlertCircle size={20} className="text-rose-400" />}
                {status === 'invalid' && username.length >= USERNAME_MIN && <AlertCircle size={20} className="text-amber-400" />}
              </div>
            </div>
            {status === 'taken' && <p className="text-xs text-rose-300 mt-1 flex items-center gap-1"><AlertCircle size={14} /> Username taken.</p>}
            {status === 'invalid' && username.length >= USERNAME_MIN && <p className="text-xs text-amber-300 mt-1 flex items-center gap-1"><AlertCircle size={14} /> 3–30 letters, numbers, underscores only.</p>}
            {status === 'available' && <p className="text-xs text-emerald-300 mt-1 flex items-center gap-1"><Check size={14} /> Available.</p>}
          </div>

          {/* Location: Ghana vs Diaspora */}
          <div>
            <label className="block text-xs font-medium text-white/80 mb-2">Location</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="locationType"
                  value="ghana"
                  checked={locationType === 'ghana'}
                  onChange={() => { setLocationType('ghana'); setCity(''); }}
                  className="accent-rose-500 w-4 h-4"
                />
                <span className="text-sm text-white">Ghana</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="locationType"
                  value="diaspora"
                  checked={locationType === 'diaspora'}
                  onChange={() => { setLocationType('diaspora'); setCity(''); }}
                  className="accent-rose-500 w-4 h-4"
                />
                <span className="text-sm text-white">Diaspora</span>
              </label>
            </div>

            {locationType === 'ghana' && (
              <div className="relative">
                <div className="absolute left-2.5 top-3 text-white/60"><MapPin size={16} strokeWidth={1.5} /></div>
                <select
                  required
                  className="w-full p-2.5 pl-9 border border-white/20 bg-white/10 text-white rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none [&>option]:text-gray-800"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  <option value="" className="text-gray-800">Select city</option>
                  {GHANA_CITIES.map((c) => (
                    <option key={c} value={c} className="text-gray-800">{c}</option>
                  ))}
                </select>
              </div>
            )}

            {locationType === 'diaspora' && (
              <div className="space-y-1.5">
                <div className="relative">
                  <div className="absolute left-2.5 top-3 text-white/60"><MapPin size={16} strokeWidth={1.5} /></div>
                  <input
                    type="text"
                    required
                    placeholder="City (e.g. London)"
                    className="w-full p-2.5 pl-9 border border-white/20 bg-white/10 text-white placeholder-white/50 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={locationDetecting}
                  className="flex items-center gap-2 text-xs text-white/80 hover:text-white transition disabled:opacity-60"
                >
                  <MapPinned size={14} />
                  {locationDetecting ? 'Detecting…' : 'Use my location'}
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-rose-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-rose-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UsernameStep;
