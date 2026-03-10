import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Bell, User, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, type TranslationKey } from '../contexts/LanguageContext';

interface Tab { path: string; icon: any; labelKey: TranslationKey }

const LEFT_TABS: Tab[] = [
  { path: '/home', icon: Home, labelKey: 'home' },
  { path: '/grades', icon: BarChart3, labelKey: 'grades' },
];
const LEFT_TABS_TEACHER: Tab[] = [
  { path: '/home', icon: Home, labelKey: 'home' },
  { path: '/grades', icon: BarChart3, labelKey: 'grades' },
];
const RIGHT_TABS: Tab[] = [
  { path: '/notifications', icon: Bell, labelKey: 'notifications' },
  { path: '/settings', icon: User, labelKey: 'profile' },
];
const RIGHT_TABS_TEACHER: Tab[] = [
  { path: '/notifications', icon: Bell, labelKey: 'notifications' },
  { path: '/settings', icon: User, labelKey: 'profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount, isTeacher } = useAuth();
  const { t } = useLanguage();

  const leftTabs = isTeacher ? LEFT_TABS_TEACHER : LEFT_TABS;
  const rightTabs = isTeacher ? RIGHT_TABS_TEACHER : RIGHT_TABS;

  const handleFab = () => {
    navigate(isTeacher ? '/room/create' : '/explore');
  };

  const renderTab = ({ path, icon: Icon, labelKey }: Tab) => {
    const isActive = location.pathname === path;
    const showBadge = path === '/notifications' && unreadCount > 0;
    return (
      <NavLink key={path} to={path} className={`nav-tab ${isActive ? 'active' : ''}`}>
        <div className="nav-tab-icon">
          <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
          {showBadge && (
            <span className="nav-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <span className="nav-tab-label">{t(labelKey)}</span>
      </NavLink>
    );
  };

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {leftTabs.map(renderTab)}

        {/* Center FAB — raised "+" button */}
        <div className="nav-fab-spacer">
          <button className="nav-fab" onClick={handleFab} aria-label={isTeacher ? 'Create Room' : 'Join Room'}>
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>

        {rightTabs.map(renderTab)}
      </div>
    </nav>
  );
}
