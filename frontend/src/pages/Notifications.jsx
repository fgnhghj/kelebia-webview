import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useTranslation } from '../LanguageContext';
import { notificationsAPI } from '../api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiEdit3, FiFileText, FiAward, FiMessageSquare, FiMessageCircle, FiClock, FiHome, FiBell, FiCheck, FiTrash2, FiX } from 'react-icons/fi';

const TYPE_ICONS = {
    assignment: <FiEdit3 />,
    submission: <FiFileText />,
    grade: <FiAward />,
    announcement: <FiMessageSquare />,
    comment: <FiMessageCircle />,
    deadline: <FiClock />,
    room: <FiHome />,
};

function timeAgo(d, t) {
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return t('common.justNow');
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
}

export default function Notifications() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const { data } = await notificationsAPI.list();
            setNotifs(data.results || data);
        } catch { toast.error(t('notifs.loadError')); }
        finally { setLoading(false); }
    };

    const markRead = async (id, link) => {
        await notificationsAPI.read(id);
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        if (link) navigate(link);
    };

    const markAll = async () => {
        await notificationsAPI.readAll();
        setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
        toast.success(t('notifs.allRead'));
    };

    const deleteOne = async (e, id) => {
        e.stopPropagation();
        try {
            await notificationsAPI.delete(id);
            setNotifs(prev => prev.filter(n => n.id !== id));
        } catch { toast.error(t('room.actionFailed')); }
    };

    const deleteAllNotifs = async () => {
        if (!window.confirm(t('notifs.confirmDeleteAll'))) return;
        try {
            await notificationsAPI.deleteAll();
            setNotifs([]);
            toast.success(t('notifs.allDeleted'));
        } catch { toast.error(t('room.actionFailed')); }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <h1>{t('notifs.title')}</h1>
                        <p>{t('notifs.subtitle')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {notifs.some(n => !n.is_read) && (
                            <button className="btn btn-secondary btn-sm" onClick={markAll}>
                                <FiCheck style={{ marginRight: 6 }} /> {t('notifs.markAllRead')}
                            </button>
                        )}
                        {notifs.length > 0 && (
                            <button className="btn btn-secondary btn-sm" onClick={deleteAllNotifs} style={{ color: 'var(--danger)' }}>
                                <FiTrash2 style={{ marginRight: 6 }} /> {t('notifs.deleteAll')}
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="card"><div className="skeleton" style={{ height: 200 }} /></div>
                ) : notifs.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon" style={{ fontSize: 40, color: 'var(--brand)', marginBottom: 16 }}>
                            <FiBell />
                        </div>
                        <h3>{t('notifs.none')}</h3>
                        <p>{t('notifs.upToDate')}</p>
                    </div>
                ) : (
                    <div className="card card-flat" style={{ padding: 0, overflow: 'hidden' }}>
                        {notifs.map((n, i) => (
                            <motion.div
                                key={n.id}
                                className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                                onClick={() => !n.is_read ? markRead(n.id, n.link) : n.link && navigate(n.link)}
                                style={{ cursor: 'pointer' }}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                <div className="notif-icon" style={{ color: !n.is_read ? 'var(--brand)' : 'var(--text-muted)' }}>
                                    {TYPE_ICONS[n.notification_type] || <FiBell />}
                                </div>
                                <div className="notif-body">
                                    <div className="title" style={{ fontFamily: 'var(--font-serif)', fontSize: 16 }}>{n.title}</div>
                                    <div className="message">{n.message}</div>
                                    <div className="time">{timeAgo(n.created_at, t)}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)' }} />}
                                    <button
                                        className="btn btn-ghost btn-icon btn-sm"
                                        onClick={(e) => deleteOne(e, n.id)}
                                        title={t('common.delete')}
                                        style={{ color: 'var(--text-muted)', padding: 4 }}
                                    >
                                        <FiX size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
