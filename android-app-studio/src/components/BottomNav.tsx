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

  return (
    <div className="bottom-nav-wrapper">
      <nav className="floating-nav">
        {TABS.map((tab) => {
          const isActive = location.pathname === tab.path;
          const showBadge = tab.path === '/notifications' && unreadCount > 0;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="nav-icon-container">
                <tab.icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
                {showBadge && (
                  <span className="nav-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="nav-label">{t(tab.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
