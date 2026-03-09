import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from '../LanguageContext';
import { useEffect, useState } from 'react';
import { notificationsAPI } from '../api';
import { FiPieChart, FiBell, FiUser, FiMoon, FiSun, FiLogOut, FiMenu, FiX, FiAward } from 'react-icons/fi';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const location = useLocation();
    const [unread, setUnread] = useState(0);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const fetchUnread = () => notificationsAPI.unreadCount().then(r => setUnread(r.data.count)).catch(() => { });
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const [isDark, setIsDark] = useState(
        () => document.documentElement.getAttribute('data-theme') === 'dark' ||
            (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );

    const toggleTheme = () => {
        const next = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        setIsDark(!isDark);
    };

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <>
            {/* Mobile hamburger button */}
            <button className="mobile-hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <FiX /> : <FiMenu />}
            </button>

            {/* Mobile overlay */}
            <div className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`} onClick={() => setMobileOpen(false)} />

            <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/dashboard" className="sidebar-brand">
                        <div className="logo">K</div>
                        <h1>Kelebia<small>par Aymen HM</small></h1>
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <div className="nav-section-title">{t('sidebar.menu')}</div>
                        <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
                            <span className="icon"><FiPieChart /></span> {t('sidebar.dashboard')}
                        </Link>
                        <Link to="/notifications" className={`nav-item ${isActive('/notifications') ? 'active' : ''}`}>
                            <span className="icon"><FiBell /></span> {t('sidebar.notifications')}
                            {unread > 0 && <span className="badge">{unread}</span>}
                        </Link>
                        {user?.role === 'student' && (
                            <Link to="/grades" className={`nav-item ${isActive('/grades') ? 'active' : ''}`}>
                                <span className="icon"><FiAward /></span> {t('sidebar.grades')}
                            </Link>
                        )}
                        <Link to="/profile" className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>
                            <span className="icon"><FiUser /></span> {t('sidebar.profile')}
                        </Link>
                    </div>

                    <div className="nav-section">
                        <div className="nav-section-title">{t('sidebar.settings')}</div>
                        <button className="nav-item" onClick={toggleTheme}>
                            <span className="icon">{isDark ? <FiSun /> : <FiMoon />}</span> {t('sidebar.toggleTheme')}
                        </button>
                        <button className="nav-item" onClick={logout} style={{ color: 'var(--danger)' }}>
                            <span className="icon"><FiLogOut /></span> {t('sidebar.logout')}
                        </button>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <Link to="/profile" className="user-card" style={{ textDecoration: 'none' }}>
                        <div className="avatar">
                            {(user?.first_name?.[0] || 'U').toUpperCase()}
                        </div>
                        <div className="user-info">
                            <div className="name">{user?.full_name || user?.username}</div>
                            <div className="role">{user?.role === 'teacher' ? t('sidebar.teacher') : t('sidebar.student')}</div>
                        </div>
                    </Link>
                </div>
            </aside>
        </>
    );
}
