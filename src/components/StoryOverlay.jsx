import React, { useState, useEffect } from 'react';
import { X, Play, Eye } from 'lucide-react';
import { supabase } from '../supabaseClient';

const StoryOverlay = ({ story, onClose, currentUserId, matchedUserId }) => {
  if (!story) return null;

  // --- NEW: TIMER STATE ---
  const [progress, setProgress] = useState(0);
  const [viewersCount, setViewersCount] = useState(0);

  // --- TRACK STORY VIEW (Instagram-style) ---
  useEffect(() => {
    if (!currentUserId || !story) return;
    
    const storyOwnerId = story.user_id;
    const isOwnStory = currentUserId === storyOwnerId;
    
    // If viewing own story, just fetch viewers count (don't track view)
    if (isOwnStory) {
      const fetchViewers = async () => {
        try {
          const { count } = await supabase
            .from('story_views')
            .select('*', { count: 'exact', head: true })
            .eq('story_id', story.id);
          
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
          story_id: story.id,
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
          .eq('story_id', story.id);
        
        setViewersCount(count || 0);
      } catch (err) {
        console.error("Error tracking story view:", err);
      }
    };
    
    trackView();
  }, [story, currentUserId, matchedUserId]);

  // --- LOGIC: 5 SECOND TIMER ---
  useEffect(() => {
    // Reset progress when story changes
    setProgress(0);

    const duration = 5000; // 5 seconds for images
    const intervalTime = 50; // Update every 50ms
    const increment = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          onClose(); // Auto-close when done
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    // Clean up if user closes early
    return () => clearInterval(timer);
  }, [story, onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
      
      {/* --- TOP: TIMER BAR --- */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-20">
        <div className="h-1 flex-1 bg-gray-600 rounded-full overflow-hidden">
          <div 
            className="h-full bg-rose-500 transition-all duration-[50ms] ease-linear" 
            style={{ width: `${progress}%` }}
          />
        </div>
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
        {currentUserId === story.user_id && (
          <div className="absolute bottom-4 left-4 z-20 bg-black/60 text-white px-3 py-2 rounded-full flex items-center gap-2 text-sm cursor-pointer hover:bg-black/80 transition"
               onClick={async () => {
                 // Fetch and show viewers list
                 try {
                   const { data: viewers } = await supabase
                     .from('story_views')
                     .select('viewer_id, viewed_at, profiles(full_name, avatar_url)')
                     .eq('story_id', story.id)
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

        {/* Content */}
        <div className="flex-grow flex items-center justify-center bg-gray-900 relative">
          {/* If Video */}
          {story.media_url.includes('video') || story.media_url.endsWith('mp4') ? (
            <video 
              src={story.media_url} 
              className="w-full h-full object-contain" 
              controls 
              autoPlay 
              loop
            />
          ) : (
            // If Image (Fullscreen, clean)
            <img 
              src={story.media_url} 
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