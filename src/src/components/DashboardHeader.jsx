import { Heart, User, Users, LogOut, SlidersHorizontal, Eye, Search, PlayCircle } from 'lucide-react';
import logo from '../assets/logo.png'; 

const DashboardHeader = ({ profile, stats, setView, onLogout, onFilterClick, theme, toggleTheme }) => {
  return (
    <header className="fixed-header bg-gray-900 border-gray-800">
      
      {/* 1. LEFT: FILTER, SEARCH & STORIES - At edge with small gaps */}
      <div className="flex items-center gap-1.5" style={{ marginRight: 'auto' }}>
        {/* Filter Icon - At edge */}
        <button 
          onClick={onFilterClick} 
          className="p-1.5 transition rounded-lg text-gray-400 hover:text-rose-300" 
          aria-label="Open Filters"
        >
          <SlidersHorizontal size={18} strokeWidth={2} />
        </button>

        {/* Search Icon Button */}
        <button 
          onClick={() => setView('search')} 
          className="p-1.5 transition rounded-lg text-gray-400 hover:text-rose-300" 
          aria-label="Global Search"
        >
          <Search size={18} strokeWidth={2} />
        </button>

        {/* Stories Icon Button - More visible */}
        <button 
          onClick={() => setView('stories')} 
          className="p-1.5 transition rounded-lg text-rose-500 hover:text-rose-400" 
          aria-label="View Stories"
        >
          <PlayCircle size={20} strokeWidth={2.5} className="drop-shadow-lg" />
        </button>
      </div>

      {/* 2. CENTER: LOGO */}
      <div className="header-logo flex-shrink-0 absolute left-1/2 transform -translate-x-1/2">
        <img 
          src={logo} 
          alt="SacredHearts Logo" 
          className="h-16 w-auto object-contain drop-shadow-md"
        />
      </div>

      {/* 3. RIGHT: EYE -> PROFILE -> LOGOUT - At edge with small gaps, logout at end */}
      <div className="flex items-center gap-1.5" style={{ marginLeft: 'auto' }}>
        
        {/* A. Visitors Button (Eye) */}
        <button 
          onClick={() => setView('visitors')} 
          className="p-1 transition rounded-lg text-gray-400 hover:text-rose-300" 
          aria-label="View Profile Visitors"
        >
          <Eye size={18} strokeWidth={2} />
        </button>

        {/* B. User Profile Picture (Clicks to Profile) */}
        <button 
          onClick={() => setView('profile')} 
          className="relative transition hover:opacity-80 rounded-full"
          aria-label="View Profile"
        >
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt="Profile" 
              className="w-8 h-8 rounded-full object-cover border-2 shadow-sm border-gray-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-gray-700 border border-gray-600">
              <User size={16} className="text-gray-400" />
            </div>
          )}
        </button>

        {/* C. Logout Button - At the end */}
        <button 
          onClick={onLogout} 
          className="p-1 transition rounded-lg text-gray-400 hover:text-gray-200"
          aria-label="Logout"
        >
          <LogOut size={18} strokeWidth={2.5} />
        </button>
      </div>

    </header>
  );
};

export default DashboardHeader;