import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, BarChart3, Bell, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const studentTabs = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/explore', icon: Search, label: 'Explore' },
  { path: '/grades', icon: BarChart3, label: 'Grades' },
  { path: '/notifications', icon: Bell, label: 'Alerts' },
  { path: '/settings', icon: User, label: 'Profile' },
];

const teacherTabs = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/explore', icon: Search, label: 'Explore' },
  { path: '/notifications', icon: Bell, label: 'Alerts' },
  { path: '/settings', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const { unreadCount, isTeacher } = useAuth();
  const tabs = isTeacher ? teacherTabs : studentTabs;

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          const showBadge = path === '/notifications' && unreadCount > 0;

          return (
            <NavLink key={path} to={path} className={`nav-tab ${isActive ? 'active' : ''}`}>
              <div className="nav-tab-icon">
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
                {showBadge && (
                  <span className="nav-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="nav-tab-label">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
