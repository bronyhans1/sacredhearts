import React, { useState } from 'react';
import { MapPin, MapPinned } from 'lucide-react';
import logo from '../assets/logo.webp';
import signupImg from '../assets/signupimg.webp';

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

const OnboardingLocationStep = ({ onSubmit, onBack, loading }) => {
  const [locationType, setLocationType] = useState('ghana');
  const [city, setCity] = useState('');
  const [locationDetecting, setLocationDetecting] = useState(false);

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
    const trimmedCity = city?.trim() || '';
    if (!trimmedCity) return;
    onSubmit({
      city: trimmedCity,
      region: locationType
    });
  };

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif' }} className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 -z-10 h-full w-full">
        <img src={signupImg} className="w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8">
        <button
          type="button"
          onClick={onBack}
          className="absolute -top-12 left-0 text-white hover:text-rose-200 transition flex items-center gap-2"
        >
          ← Back
        </button>

        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="SacredHearts" className="h-14 w-auto object-contain drop-shadow-2xl mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
            Where are you located?
          </h2>
          <p className="text-sm text-white/80 text-center">
            This helps others find you. You can change it later in profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-white/80">Ghana or abroad?</p>
            <div className="flex gap-4">
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
          </div>

          {locationType === 'ghana' && (
            <div className="relative">
              <div className="absolute left-2.5 top-3 text-white/60"><MapPin size={16} strokeWidth={1.5} /></div>
              <select
                required
                className="w-full p-2.5 pl-9 border border-white/20 bg-white/10 text-white rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white/20 outline-none transition [&>option]:text-gray-800"
                value={city}
                onChange={e => setCity(e.target.value)}
              >
                <option value="" className="text-gray-800">City</option>
                {GHANA_CITIES.map(c => (
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
                  onChange={e => setCity(e.target.value)}
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

          <button
            type="submit"
            disabled={loading || !city?.trim()}
            className="w-full bg-rose-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-rose-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingLocationStep;
