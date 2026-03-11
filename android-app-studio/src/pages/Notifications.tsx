import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { notificationsAPI } from '../api/client';
import PullToRefresh from '../components/PullToRefresh';
import {
  Bell, BellOff, Check, CheckCheck, Trash2, Loader2,
  FileText, ClipboardList, Megaphone, MessageSquare,
  Award, Clock, Users, BookOpen,
} from 'lucide-react';

interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

const typeIcons: Record<string, any> = {
  content: FileText,
  assignment: ClipboardList,
  submission: ClipboardList,
  grade: Award,
  announcement: Megaphone,
  comment: MessageSquare,
  deadline: Clock,
  room: Users,
};

const typeColors: Record<string, string> = {
  content: 'var(--info)',
  assignment: 'var(--accent)',
  submission: 'var(--success)',
  grade: 'var(--gold)',
  announcement: 'var(--warning)',
  comment: 'var(--info)',
  deadline: 'var(--error)',
  room: 'var(--accent)',
};

export default function Notifications() {
  const navigate = useNavigate();
  const { refreshNotifications } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationsAPI.list();
      setNotifications(data);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Auto-refresh notifications every 5s
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markRead = async (id: number) => {
    try {
      await notificationsAPI.read(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      refreshNotifications();
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.readAll();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      refreshNotifications();
    } catch { /* ignore */ }
  };

  const deleteNotification = async (id: number) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      refreshNotifications();
    } catch { /* ignore */ }
  };

  const deleteAll = async () => {
    if (!confirm('Delete all notifications?')) return;
    try {
      await notificationsAPI.deleteAll();
      setNotifications([]);
      refreshNotifications();
    } catch { /* ignore */ }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handlePullRefresh = async () => {
    await fetchNotifications();
  };

  return (
    <PullToRefresh onRefresh={handlePullRefresh}>
      <div className="page-container">
        <header className="page-header">
          <div>
            <h1 className="page-title">{t('notifications')}</h1>
            {unreadCount > 0 && (
              <p className="page-subtitle">{unreadCount} {t('unread')}</p>
            )}
          </div>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button className="icon-btn-ghost" onClick={markAllRead} title="Mark all read">
                <CheckCheck size={20} />
              </button>
            )}
            {notifications.length > 0 && (
              <button className="icon-btn-ghost" onClick={deleteAll} title="Delete all">
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </header>

        {loading ? (
          <div className="notification-list">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-notification">
                <div className="skeleton skeleton-notification-icon" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="skeleton skeleton-line w-60" />
                  <div className="skeleton skeleton-line w-80 h-10" />
                  <div className="skeleton skeleton-line w-30 h-10" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <BellOff size={48} strokeWidth={1} className="text-tertiary" />
            <h3>{t('all_caught_up')}</h3>
            <p>{t('no_notif_desc')}</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((notif) => {
              const Icon = typeIcons[notif.notification_type] || Bell;
              const color = typeColors[notif.notification_type] || 'var(--text-secondary)';

              return (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                >
                  <div className="notification-icon" style={{ color, backgroundColor: color + '18' }}>
                    <Icon size={18} />
                  </div>
                  <div className="notification-body" onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!notif.is_read) markRead(notif.id);
                    if (notif.link) navigate(notif.link);
                  }}>
                    <h4 className="notification-title">{notif.title}</h4>
                    <p className="notification-message">{notif.message}</p>
                    <span className="notification-time">{formatTime(notif.created_at)}</span>
                  </div>
                  <button
                    className="notification-delete"
                    onClick={() => deleteNotification(notif.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
