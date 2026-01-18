import { X, Heart, MapPin, Eye, User, Star, Shield, BadgeCheck } from 'lucide-react';

const DiscoverCard = ({ candidate, onPass, onConnect, onViewProfile, onLike, onSuperLike, loading, isLiked, isSuperLiked, isVerified, lastPassed, handleUndo }) => {
  if (!candidate) return null;
  
  // Check verified status from both prop and candidate data
  const isUserVerified = isVerified || candidate?.is_verified === true;

  // FIX: We simply check if lastPassed exists. 
  // When we pass, the index changes, so comparing IDs doesn't work.
  // This ensures the button turns to "Undo" as soon as we have a lastPassed state.
  const isUndo = !!lastPassed;

  // --- BEAUTIFUL LIKE ANIMATION: Heart Burst Effect ---
  const spawnBubbles = (e) => {
    const rect = e.target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Create multiple layers of hearts with different sizes and animations
    const heartEmojis = ['❤️', '💖', '💕', '💗', '💓', '💝', '💘', '💞'];
    
    // Layer 1: Large hearts (5) - circular burst
    for (let i = 0; i < 5; i++) {
      const bubble = document.createElement('div');
      const emoji = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
      bubble.innerHTML = emoji;
      
      const size = Math.random() * 25 + 30; 
      const angle = (Math.PI * 2 * i) / 5; // Distribute in circle
      const distance = 40 + Math.random() * 30;
      const xOffset = Math.cos(angle) * distance;
      const yOffset = Math.sin(angle) * distance;
      
      bubble.style.position = 'fixed';
      bubble.style.left = `${centerX - size/2}px`;
      bubble.style.top = `${centerY - size/2}px`;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.fontSize = `${size}px`;
      bubble.style.pointerEvents = 'none';
      bubble.style.zIndex = '9999';
      bubble.style.transition = 'all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
      bubble.style.opacity = '1';
      bubble.style.filter = 'drop-shadow(0 0 8px rgba(251, 113, 133, 0.8))';

      document.body.appendChild(bubble);

      requestAnimationFrame(() => {
        bubble.style.transform = `translate(${xOffset * 1.5}px, ${yOffset * 1.5 - 100}px) scale(0.3) rotate(${Math.random() * 360}deg)`;
        bubble.style.opacity = '0';
      });

      setTimeout(() => bubble.remove(), 1200);
    }
    
    // Layer 2: Medium hearts (10) - scattered
    for (let i = 0; i < 10; i++) {
      const bubble = document.createElement('div');
      const emoji = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
      bubble.innerHTML = emoji;
      
      const size = Math.random() * 15 + 20; 
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 50;
      const xOffset = Math.cos(angle) * distance;
      const yOffset = Math.sin(angle) * distance;
      
      bubble.style.position = 'fixed';
      bubble.style.left = `${centerX - size/2}px`;
      bubble.style.top = `${centerY - size/2}px`;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.fontSize = `${size}px`;
      bubble.style.pointerEvents = 'none';
      bubble.style.zIndex = '9999';
      bubble.style.transition = `all ${0.8 + Math.random() * 0.4}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
      bubble.style.opacity = '1';
      bubble.style.filter = 'drop-shadow(0 0 6px rgba(251, 113, 133, 0.6))';

      document.body.appendChild(bubble);

      requestAnimationFrame(() => {
        bubble.style.transform = `translate(${xOffset * 2}px, ${yOffset * 2 - 120}px) scale(0.2) rotate(${Math.random() * 720}deg)`;
        bubble.style.opacity = '0';
      });

      setTimeout(() => bubble.remove(), 1200);
    }
    
    // Layer 3: Sparkles/particles (15)
    for (let i = 0; i < 15; i++) {
      const sparkle = document.createElement('div');
      sparkle.innerHTML = '✨';
      
      const size = Math.random() * 10 + 12;
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 40;
      const xOffset = Math.cos(angle) * distance;
      const yOffset = Math.sin(angle) * distance;
      
      sparkle.style.position = 'fixed';
      sparkle.style.left = `${centerX - size/2}px`;
      sparkle.style.top = `${centerY - size/2}px`;
      sparkle.style.width = `${size}px`;
      sparkle.style.height = `${size}px`;
      sparkle.style.fontSize = `${size}px`;
      sparkle.style.pointerEvents = 'none';
      sparkle.style.zIndex = '9998';
      sparkle.style.transition = `all ${0.6 + Math.random() * 0.3}s ease-out`;
      sparkle.style.opacity = '0.8';

      document.body.appendChild(sparkle);

      requestAnimationFrame(() => {
        sparkle.style.transform = `translate(${xOffset * 1.8}px, ${yOffset * 1.8 - 80}px) scale(0)`;
        sparkle.style.opacity = '0';
      });

      setTimeout(() => sparkle.remove(), 900);
    }
  };

  const handleLikeClick = (e) => {
    onLike(candidate.id);
    if (!isLiked) {
      spawnBubbles(e);
    }
  };

  return (
    <div className="discover-card-static">
      <div className="card-image-container relative w-full h-full rounded-2xl overflow-hidden bg-gray-200">
        
        <img 
          src={candidate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.full_name}&backgroundColor=b6e3f4`} 
          alt={candidate.full_name} 
          className="card-image w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>

        {/* --- LIKE BUTTON (Bottom Left) --- */}
        <button 
          onClick={handleLikeClick}
          disabled={loading}
          className="
            absolute bottom-4 left-4
            transition-all duration-200 active:scale-90 z-20
          "
          title="Like"
        >
          <Heart 
            size={32} 
            className={`
              drop-shadow-md
              ${isLiked ? 'text-rose-600' : 'text-rose-500'}
            `} 
            fill={isLiked ? "currentColor" : "none"} 
          />
        </button>

        {/* --- VIEW PROFILE BUTTON (Bottom Right) --- */}
        <button 
          onClick={() => onViewProfile(candidate)}
          className="
            absolute bottom-4 right-4
            px-5 py-2 rounded-full 
            flex items-center gap-2 
            backdrop-blur-md bg-white/15 border border-white/30 
            text-white font-medium text-sm shadow-lg
            hover:bg-white/25 active:scale-95 transition-all duration-200 z-20
          "
          title="View Full Profile"
        >
          View Profile
        </button>

      </div>
      
      <div className="card-details mt-4">
        <div className="card-name-row">
          <div className="flex items-center gap-2">
            <h2 className="card-name">{candidate.full_name}</h2>
            {isUserVerified && (
              <div className="bg-blue-500 rounded-full p-1.5 flex items-center justify-center border border-white/30 shadow-lg" title="Verified Account">
                <span className="text-white font-bold text-xs">✓</span>
              </div>
            )}
          </div>
          <span className="card-age">{candidate.date_of_birth ? new Date().getFullYear() - new Date(candidate.date_of_birth).getFullYear() : ''}</span>
        </div>

        <div className="card-info-row">
          <MapPin size={14} />
          {candidate.city}
          {candidate.distance && (
            <span className="text-xs font-normal text-green-500 dark:text-green-400 ml-1">
              ({candidate.distance < 1 ? "< 1 km away" : `${candidate.distance.toFixed(1)} km away`})
            </span>
          )}
        </div>

        <div className="card-meta">
          <div className="card-meta-item">
            <span className="card-meta-label">Faith</span>
            <span className="font-medium text-gray-200 dark:text-gray-200">{candidate.religion}</span>
          </div>
          <div className="card-meta-item">
            <span className="card-meta-label">Intent</span>
            <span className="font-medium text-gray-200 dark:text-gray-200">{candidate.intent}</span>
          </div>
        </div>

        {candidate.bio && (
          <p className="text-sm text-gray-400 dark:text-gray-400 italic mb-4 line-clamp-2">
            "{candidate.bio}"
          </p>
        )}


        {/* --- UPDATED ACTION BUTTONS (Better Spacing) --- */}
        <div className="card-actions grid grid-cols-[0.7fr_2fr] gap-2">
          
          {/* Button 1: Pass / Undo - Smaller size */}
          <button 
            onClick={() => isUndo ? handleUndo() : onPass()}
            disabled={loading}
            className={`
              w-full
              py-2.5
              px-1.5
              rounded-xl
              font-bold
              text-xs
              transition
              active:scale-95
              flex
              items-center
              justify-center
              gap-1
              border-2
              /* --- STYLING - More Visible Gray --- */
              ${isUndo 
                ? 'bg-green-900/30 text-green-400 border-green-700/50 hover:bg-green-900/40' 
                : 'bg-gray-700/40 text-gray-300 border-gray-500/60 hover:bg-gray-700/60 hover:border-gray-400/80'
              }
            `}
          >
            {isUndo ? (
              <span className="text-xs">Undo</span>
            ) : (
              <>
                <X size={16} />
                <span className="text-xs">Pass</span>
              </>
            )}
          </button>
          
          {/* Button 2: Super Like / Connect - More space for Connect */}
          <div className="flex gap-2">
            {onSuperLike && (
              <button 
                onClick={onSuperLike}
                disabled={loading}
                className={`
                  flex-shrink-0
                  w-11
                  font-bold
                  py-2.5
                  rounded-xl
                  shadow-lg
                  active:scale-95
                  transition
                  flex
                  items-center
                  justify-center
                  ${isSuperLiked 
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30'
                  }
                `}
                title="Super Like"
              >
                <Star size={16} fill={isSuperLiked ? "currentColor" : "none"} />
              </button>
            )}
            <button 
              onClick={onConnect}
              disabled={loading}
              className="
                flex-1
                min-w-0
                bg-rose-600
                text-white
                font-bold
                py-2.5
                px-4
                rounded-xl
                shadow-lg
                hover:bg-rose-700
                active:scale-95
                transition
                flex
                items-center
                justify-center
                gap-2
                text-sm
                sm:text-base
              "
            >
              <Heart size={18} fill="white" className="flex-shrink-0" /> 
              <span className="whitespace-nowrap">Connect</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoverCard;
