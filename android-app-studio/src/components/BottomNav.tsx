import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, BarChart3, Bell, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, type TranslationKey } from '../contexts/LanguageContext';

const studentTabs: { path: string; icon: any; labelKey: TranslationKey }[] = [
  { path: '/home', icon: Home, labelKey: 'home' },
  { path: '/explore', icon: Search, labelKey: 'explore' },
  { path: '/grades', icon: BarChart3, labelKey: 'grades' },
  { path: '/notifications', icon: Bell, labelKey: 'notifications' },
  { path: '/settings', icon: User, labelKey: 'profile' },
];

const teacherTabs: { path: string; icon: any; labelKey: TranslationKey }[] = [
  { path: '/home', icon: Home, labelKey: 'home' },
  { path: '/explore', icon: Search, labelKey: 'explore' },
  { path: '/notifications', icon: Bell, labelKey: 'notifications' },
  { path: '/settings', icon: User, labelKey: 'profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const { unreadCount, isTeacher } = useAuth();
  const { t } = useLanguage();
  const tabs = isTeacher ? teacherTabs : studentTabs;

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {tabs.map(({ path, icon: Icon, labelKey }) => {
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
              <span className="nav-tab-label">{t(labelKey)}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
