import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const CrushListItem = ({ like, type, onViewProfile }) => {
  const [profile, setProfile] = useState(null);
  const targetId = type === 'incoming' ? like.liker_id : like.liked_id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetId) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', targetId).single();
      setProfile(data);
    };
    fetchProfile();
  }, [targetId]);

  if (!profile) return <div className="bg-gray-100 h-16 rounded-xl animate-pulse"></div>;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-50 flex items-center gap-4">
      <img 
        src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`} 
        className="w-14 h-14 rounded-full bg-gray-100 object-cover" 
      />
      <div className="flex-grow min-w-0">
        <h3 className="font-bold text-gray-900 truncate">{profile.full_name}</h3>
        <p className="text-xs text-rose-600 truncate">{profile.city}</p>
      </div>
      
      <div className="flex flex-col items-center justify-center gap-1">
        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide ${
          type === 'incoming' ? 'bg-rose-50 text-rose-500' : 'bg-gray-100 text-gray-400'
        }`}>
          {type === 'incoming' ? 'Crushed' : 'Crushing'}
        </span>
      </div>
    </div>
  );
};

export default CrushListItem;