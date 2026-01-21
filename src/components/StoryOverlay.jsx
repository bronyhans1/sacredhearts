import React, { useState, useEffect } from 'react';
import { X, Play, Eye } from 'lucide-react';
import { supabase } from '../supabaseClient';

const StoryOverlay = ({ story, stories = [], onClose, currentUserId, matchedUserId }) => {
  // If stories array is provided, use it; otherwise fall back to single story
  const storyList = stories.length > 0 ? stories : (story ? [story] : []);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const currentStory = storyList[currentStoryIndex];
  
  if (!currentStory) return null;

  // --- NEW: TIMER STATE ---
  const [progress, setProgress] = useState(0);
  const [viewersCount, setViewersCount] = useState(0);

  // --- NAVIGATE TO NEXT STORY ---
  const goToNextStory = () => {
    if (currentStoryIndex < storyList.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0); // Reset progress
    } else {
      onClose(); // Close if last story
    }
  };

  // --- NAVIGATE TO PREVIOUS STORY ---
  const goToPreviousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0); // Reset progress
    } else {
      onClose(); // Close if first story
    }
  };

  // --- TRACK STORY VIEW (Instagram-style) ---
  useEffect(() => {
    if (!currentUserId || !currentStory) return;
    
    const storyOwnerId = currentStory.user_id;
    const isOwnStory = currentUserId === storyOwnerId;
    
    // If viewing own story, just fetch viewers count (don't track view)
    if (isOwnStory) {
      const fetchViewers = async () => {
        try {
          const { count } = await supabase
            .from('story_views')
            .select('*', { count: 'exact', head: true })
            .eq('story_id', currentStory.id);
          
          setViewersCount(count || 0);
        } catch (err) {
          console.error("Error fetching viewers:", err);
        }
      };
      fetchViewers();
      return; // Don't track own view
    }
    
    // Only track views if viewing someone else's story (matched user)
    if (!matchedUserId || matchedUserId !== storyOwnerId) return;
    
    // Record that this matched user viewed the story
    const trackView = async () => {
      try {
        // Insert view record (or use upsert to prevent duplicates)
        await supabase.from('story_views').insert({
          story_id: currentStory.id,
          viewer_id: currentUserId,
          story_owner_id: storyOwnerId
        }).catch(err => {
          // Ignore duplicate errors
          if (err.code !== '23505') console.error("Story view tracking error:", err);
        });
        
        // Get total viewer count for this story
        const { count } = await supabase
          .from('story_views')
          .select('*', { count: 'exact', head: true })
          .eq('story_id', currentStory.id);
        
        setViewersCount(count || 0);
      } catch (err) {
        console.error("Error tracking story view:", err);
      }
    };
    
    trackView();
  }, [currentStory, currentUserId, matchedUserId]);

  // --- LOGIC: TIMER BASED ON MEDIA TYPE ---
  useEffect(() => {
    // Reset progress when story changes
    setProgress(0);

    // Determine duration: 10 seconds for images, 15 seconds for videos
    const isVideo = currentStory.media_type === 'video' || 
                    currentStory.media_url.includes('video') || 
                    currentStory.media_url.match(/\.(mp4|mov|webm|avi)(\?|$)/i);
    const duration = isVideo ? 15000 : 10000; // 15s for videos, 10s for images
    const intervalTime = 50; // Update every 50ms
    const increment = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          // Go to next story or close
          if (currentStoryIndex < storyList.length - 1) {
            setCurrentStoryIndex(prevIdx => prevIdx + 1);
            setProgress(0);
          } else {
            onClose();
          }
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    // Clean up if user closes early
    return () => clearInterval(timer);
  }, [currentStory, currentStoryIndex, storyList.length, onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
      
      {/* --- TOP: TIMER BARS (Multiple stories) --- */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-20">
        {storyList.map((s, idx) => (
          <div key={s.id || idx} className="h-1 flex-1 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-[50ms] ease-linear ${
                idx < currentStoryIndex ? 'bg-white' : 
                idx === currentStoryIndex ? 'bg-rose-500' : 'bg-gray-600'
              }`}
              style={{ width: idx === currentStoryIndex ? `${progress}%` : idx < currentStoryIndex ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-md bg-black rounded-xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Close Button (Top Right) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-white hover:text-gray-300 transition bg-black/20 rounded-full p-2"
        >
          <X size={24} />
        </button>
        
        {/* Viewers Indicator (Instagram-style) - Only show if you're the story owner */}
        {currentUserId === currentStory.user_id && (
          <div className="absolute bottom-4 left-4 z-20 bg-black/60 text-white px-3 py-2 rounded-full flex items-center gap-2 text-sm cursor-pointer hover:bg-black/80 transition"
               onClick={async () => {
                 // Fetch and show viewers list
                 try {
                   const { data: viewers } = await supabase
                     .from('story_views')
                     .select('viewer_id, viewed_at, profiles(full_name, avatar_url)')
                     .eq('story_id', currentStory.id)
                     .order('viewed_at', { ascending: false });
                   
                   if (viewers && viewers.length > 0) {
                     const viewersList = viewers.map(v => v.profiles?.full_name || 'Anonymous').join(', ');
                     alert(`Viewers:\n${viewersList}`);
                   } else {
                     alert('No viewers yet.');
                   }
                 } catch (err) {
                   console.error("Error fetching viewers:", err);
                 }
               }}>
            <Eye size={16} />
            <span>{viewersCount} {viewersCount === 1 ? 'viewer' : 'viewers'}</span>
          </div>
        )}

        {/* Content with Navigation Areas */}
        <div className="flex-grow flex items-center justify-center bg-gray-900 relative">
          {/* Left click area - Previous story */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
            onClick={goToPreviousStory}
          />
          
          {/* Right click area - Next story */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
            onClick={goToNextStory}
          />
          
          {/* If Video */}
          {currentStory.media_type === 'video' || 
           currentStory.media_url.includes('video') || 
           currentStory.media_url.match(/\.(mp4|mov|webm|avi)(\?|$)/i) ? (
            <video 
              key={currentStory.id} // Force re-render on story change
              src={currentStory.media_url} 
              className="w-full h-full object-contain" 
              autoPlay 
              playsInline
              muted={false}
              onEnded={goToNextStory}
            />
          ) : (
            // If Image (Fullscreen, clean)
            <img 
              key={currentStory.id} // Force re-render on story change
              src={currentStory.media_url} 
              alt="Story" 
              className="w-full h-full object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryOverlay;