import { Compass, Heart, Users, Flame, User } from 'lucide-react';

const DashboardFooter = ({ currentView, setView, unreadMessageCount = 0 }) => {
  const navItems = [
    { id: 'discovery', icon: Compass, label: 'Discover' },
    { id: 'interests', icon: Heart, label: 'Interests' }, // RESTORED
    { id: 'matches', icon: Users, label: 'Matches' },
    { id: 'crushes', icon: Flame, label: 'Crushes' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <footer className="fixed-footer">
      {navItems.map((item) => (
        <div
          key={item.id}
          className={`nav-item ${currentView === item.id ? 'active' : ''}`}
          onClick={() => setView(item.id)}
          style={{ position: 'relative' }}
        >
          <item.icon size={22} />
          <span>{item.label}</span>
          {/* Unread message badge on matches tab */}
          {item.id === 'matches' && unreadMessageCount > 0 && (
            <span 
              className="absolute top-0 right-0 bg-rose-600 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5 transform translate-x-1 -translate-y-1"
              style={{ fontSize: '10px', lineHeight: '1' }}
            >
              {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
            </span>
          )}
        </div>
      ))}
    </footer>
  );
};

export default DashboardFooter;