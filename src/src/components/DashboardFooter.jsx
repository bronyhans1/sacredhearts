import { Compass, Heart, Users, Flame, User } from 'lucide-react';

const DashboardFooter = ({ currentView, setView }) => {
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
        >
          <item.icon size={22} />
          <span>{item.label}</span>
        </div>
      ))}
    </footer>
  );
};

export default DashboardFooter;