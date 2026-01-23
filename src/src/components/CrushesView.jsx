import { useState } from 'react'; 
import { Flame } from 'lucide-react';
import CrushListItem from './CrushListItem'; 

const CrushesView = ({ myCrushes, incomingCrushes, onViewProfile }) => {
  
  // 1. State for UI tabs (Local State)
  const [activeTab, setActiveTab] = useState('incoming');

  // 2. Logic to switch tabs
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Logic to decide which data to show
  const listToShow = activeTab === 'incoming' ? incomingCrushes : myCrushes;

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center flex items-center justify-center gap-2">
        <Flame className="text-rose-500" /> Crushes
      </h2>
      
      {/* Tab Switcher */}
      <div className="flex bg-white/10 backdrop-blur-md border border-white/20 p-1 rounded-lg mb-6">
        <button 
          onClick={() => handleTabClick('incoming')} 
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'incoming' ? 'bg-rose-600/90 text-white shadow-sm' : 'text-white/70 hover:text-white'
          }`}
        >
          Crushing on You
        </button>
        <button 
          onClick={() => handleTabClick('outgoing')} 
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'outgoing' ? 'bg-rose-600/90 text-white shadow-sm' : 'text-white/70 hover:text-white'
          }`}
        >
          Your Crushes
        </button>
      </div>

      {/* The List */}
      <div className="space-y-3 pb-20">
        {listToShow.length === 0 ? (
          <div className="text-center text-gray-400 mt-10 bg-white p-6 rounded-xl border border-dashed border-gray-200">
            <div className="flex flex-col items-center justify-center">
                 {/* Using a standard icon from props or an SVG element */}
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mb-2 opacity-50">
                  <Flame size={20} className="text-gray-400" />
                </div>
                <p className="text-sm">
                    {activeTab === 'incoming' ? "No one is crushing on you yet." : "You haven't crushed on anyone."}
                </p>
            </div>
          </div>
        ) : (
          listToShow.map((like, index) => {
            return <CrushListItem key={like.id || `crush-${activeTab}-${index}`} like={like} type={activeTab} onViewProfile={onViewProfile} />;
          })
        )}
      </div>
    </div>
  );
};

export default CrushesView;