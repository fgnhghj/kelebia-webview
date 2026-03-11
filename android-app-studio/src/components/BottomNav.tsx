import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, Bell, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, type TranslationKey } from '../contexts/LanguageContext';

interface Tab {
  path: string;
  icon: any;
  labelKey: TranslationKey;
  index: number;
}

const TABS: Tab[] = [
  { path: '/home', icon: Home, labelKey: 'home', index: 0 },
  { path: '/grades', icon: BookOpen, labelKey: 'grades', index: 1 },
  { path: '/notifications', icon: Bell, labelKey: 'notifications', index: 2 },
  { path: '/settings', icon: SettingsIcon, labelKey: 'profile', index: 3 },
];

export default function BottomNav() {
  const location = useLocation();
  const { unreadCount } = useAuth();
  const { t } = useLanguage();
  const navRef = useRef<HTMLElement>(null);
  const [bubbleTx, setBubbleTx] = useState(0);
  const [animateBubble, setAnimateBubble] = useState(false);

  useEffect(() => {
    // Wait briefly for DOM/layout to paint the nav items
    const timeout = setTimeout(() => {
      const activeLink = navRef.current?.querySelector('.nav-item.active') as HTMLElement;
      if (activeLink && navRef.current) {
        const navRect = navRef.current.getBoundingClientRect();
        const itemRect = activeLink.getBoundingClientRect();
        // Calculate center of tapped icon, subtract half pill width (64/2=32)
        const tx = itemRect.left - navRect.left + (itemRect.width / 2) - 32;
        setBubbleTx(tx);
        setAnimateBubble(true);
      }
    }, 50);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <div className="bottom-nav-wrapper">
      <nav className="floating-nav" ref={navRef}>
        <div
          className="nav-bubble"
          style={{
            transform: `translateX(${bubbleTx}px)`,
            transition: animateBubble ? 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
          }}
        />

        {TABS.map((tab) => {
          const isActive = location.pathname === tab.path;
          const showBadge = tab.path === '/notifications' && unreadCount > 0;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <tab.icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
              {showBadge && (
                <span className="nav-badge">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              <span>{t(tab.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
