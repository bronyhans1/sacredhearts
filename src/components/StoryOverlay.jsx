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
  const [showViewersList, setShowViewersList] = useState(false);
  const [viewersList, setViewersList] = useState([]);

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
    
    // Track views for any story from a matched user (not just own story)
    // Check if the story owner is a matched user by verifying they're in our matches
    const trackView = async () => {
      try {
        // First, verify this is a matched user's story (not a random user)
        // We'll check this by trying to insert - if they're not matched, RLS will block it
        // Insert view record (or use upsert to prevent duplicates)
        const { error: insertError } = await supabase.from('story_views').insert({
          story_id: currentStory.id,
          viewer_id: currentUserId,
          story_owner_id: storyOwnerId
        });
        
        if (insertError) {
          // If it's a duplicate, that's fine - view was already tracked
          if (insertError.code !== '23505') {
            // If it's an RLS error, the user might not be matched - that's okay, don't track
            if (insertError.code === '42501') {
              console.log("Story view not tracked - user not matched or RLS blocked");
              return;
            }
            console.error("Story view tracking error:", insertError);
          }
        }
        
        // Get total viewer count for this story (always fetch, even if insert failed)
        const { count } = await supabase
          .from('story_views')
          .select('*', { count: 'exact', head: true })
          .eq('story_id', currentStory.id);
        
        setViewersCount(count || 0);
      } catch (err) {
        console.error("Error tracking story view:", err);
      }
    };
    
    // Track view for any matched user's story (not own story)
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
                   const { data: viewers, error } = await supabase
                     .from('story_views')
                     .select('viewer_id, viewed_at, profiles(full_name, avatar_url)')
                     .eq('story_id', currentStory.id)
                     .order('viewed_at', { ascending: false });
                   
                   if (error) {
                     console.error("Error fetching viewers:", error);
                     return;
                   }
                   
                   if (viewers && viewers.length > 0) {
                     setViewersList(viewers);
                     setShowViewersList(true);
                   } else {
                     // No viewers - show empty state in modal
                     setViewersList([]);
                     setShowViewersList(true);
                   }
                 } catch (err) {
                   console.error("Error fetching viewers:", err);
                 }
               }}>
            <Eye size={16} />
            <span>{viewersCount} {viewersCount === 1 ? 'viewer' : 'viewers'}</span>
          </div>
        )}
        
        {/* Viewers List Modal */}
        {showViewersList && (
          <div className="absolute inset-0 z-[110] bg-black/95 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-white font-bold text-lg">Story Viewers</h3>
                <button 
                  onClick={() => setShowViewersList(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Viewers List */}
              <div className="flex-1 overflow-y-auto p-4">
                {viewersList.length > 0 ? (
                  <div className="space-y-3">
                    {viewersList.map((viewer, idx) => (
                      <div key={viewer.viewer_id || idx} className="flex items-center gap-3 text-white">
                        <img 
                          src={viewer.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewer.profiles?.full_name || 'User'}`}
                          alt={viewer.profiles?.full_name || 'Anonymous'}
                          className="w-10 h-10 rounded-full bg-gray-700"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{viewer.profiles?.full_name || 'Anonymous'}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(viewer.viewed_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <Eye size={48} className="mx-auto mb-3 opacity-50" />
                    <p>No viewers yet</p>
                  </div>
                )}
              </div>
            </div>
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