import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from '../LanguageContext';
import Sidebar from '../components/Sidebar';
import { roomsAPI } from '../api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiLink, FiUsers, FiBookOpen, FiTrash2, FiLogOut, FiShield, FiX, FiSearch } from 'react-icons/fi';

const COLORS = [
    '#3A4B54', '#5C504A', '#485E5A', '#605068',
    '#4A5468', '#684A4A', '#52584C', '#4A5F68',
    '#68554A', '#2D2D2D'
];

export default function Dashboard() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', subject: '', description: '', color_theme: '#3A4B54' });
    const [joinCode, setJoinCode] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [show2faReminder, setShow2faReminder] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadRooms();
    }, []);

    // Show 2FA reminder popup with 20% chance if user hasn't enabled it,
    // max 2 times per day (tracked in localStorage)
    useEffect(() => {
        if (!user || user.is_2fa_enabled) return;
        const STORAGE_KEY = '2fa_reminder_log';
        const today = new Date().toDateString();
        let log = [];
        try { log = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { log = []; }
        // Count how many times shown today
        const todayCount = log.filter(d => d === today).length;
        if (todayCount >= 2) return;
        // 20% chance each visit
        if (Math.random() < 0.20) {
            const timer = setTimeout(() => {
                setShow2faReminder(true);
                log.push(today);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(log.slice(-10)));
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const dismiss2faReminder = (goToProfile) => {
        setShow2faReminder(false);
        if (goToProfile) navigate('/profile');
    };

    const loadRooms = async () => {
        try {
            const { data } = await roomsAPI.list();
            setRooms(data.results || data);
        } catch { toast.error(t('dashboard.loadError')); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const fd = new FormData();
            Object.entries(createForm).forEach(([k, v]) => { if (v) fd.append(k, v); });
            const { data } = await roomsAPI.create(fd);
            toast.success(t('dashboard.roomCreated'));
            setShowCreate(false);
            setCreateForm({ name: '', subject: '', description: '', color_theme: '#3A4B54' });
            navigate(`/rooms/${data.id}`);
        } catch (err) {
            toast.error(err.response?.data?.name?.[0] || t('dashboard.createError'));
        }
        setSubmitting(false);
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { data } = await roomsAPI.join(joinCode);
            toast.success(data.message);
            setShowJoin(false);
            setJoinCode('');
            navigate(`/rooms/${data.room.id}`);
        } catch (err) {
            toast.error(err.response?.data?.error || t('dashboard.invalidCode'));
        }
        setSubmitting(false);
    };

    const handleDelete = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm(t('dashboard.confirmDelete'))) {
            try {
                await roomsAPI.delete(id);
                toast.success(t('dashboard.roomDeleted'));
                loadRooms();
            } catch { toast.error(t('dashboard.deleteError')); }
        }
    };

    const handleLeave = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm(t('dashboard.confirmLeave'))) {
            try {
                await roomsAPI.leave(id);
                toast.success(t('dashboard.leftRoom'));
                loadRooms();
            } catch { toast.error(t('dashboard.leaveError')); }
        }
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <h1>{t('dashboard.welcome')} {user?.first_name || ''}</h1>
                    <p>{user?.role === 'teacher' ? t('dashboard.teacherSubtitle') : t('dashboard.studentSubtitle')}</p>
                    <div className="page-header-actions">
                        {user?.role === 'teacher' && (
                            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                                <FiPlus style={{ marginRight: 6 }} /> {t('dashboard.createRoom')}
                            </button>
                        )}
                        <button className="btn btn-secondary" onClick={() => setShowJoin(true)}>
                            <FiLink style={{ marginRight: 6 }} /> {t('dashboard.joinRoom')}
                        </button>
                    </div>
                </div>

                {/* Search bar */}
                {rooms.length > 0 && (
                    <div style={{ marginBottom: 20, position: 'relative', maxWidth: 400 }}>
                        <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            className="form-input"
                            placeholder={t('dashboard.searchPlaceholder')}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: 36 }}
                        />
                    </div>
                )}

                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{rooms.length}</div>
                        <div className="stat-label">{user?.role === 'teacher' ? t('dashboard.yourRooms') : t('dashboard.enrolledRooms')}</div>
                    </div>
                </div>

                {/* Room Grid */}
                {(() => {
                    const q = searchQuery.toLowerCase().trim();
                    const filteredRooms = q ? rooms.filter(r =>
                        r.name.toLowerCase().includes(q) ||
                        (r.subject || '').toLowerCase().includes(q) ||
                        (r.description || '').toLowerCase().includes(q)
                    ) : rooms;
                    return loading ? (
                    <div className="room-grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="card"><div className="skeleton" style={{ height: 100, marginBottom: 12 }} /><div className="skeleton" style={{ height: 20, width: '60%' }} /></div>
                        ))}
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon" style={{ fontSize: 40, color: 'var(--brand)', marginBottom: 16 }}>
                            <FiBookOpen />
                        </div>
                        <h3>{user?.role === 'teacher' ? t('dashboard.noRoomsTeacher') : t('dashboard.noRoomsStudent')}</h3>
                        <p>{user?.role === 'teacher' ? t('dashboard.noRoomsTeacherDesc') : t('dashboard.noRoomsStudentDesc')}</p>
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon" style={{ fontSize: 40, color: 'var(--text-muted)', marginBottom: 16 }}>
                            <FiSearch />
                        </div>
                        <h3>{t('dashboard.noSearchResults')}</h3>
                    </div>
                ) : (
                    <div className="room-grid">
                        {filteredRooms.map((room, i) => (
                            <motion.div
                                key={room.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Link to={`/rooms/${room.id}`} className="room-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="room-card-banner" style={{ background: `linear-gradient(135deg, ${room.color_theme}, ${room.color_theme}88)`, position: 'relative' }}>
                                        <h3>{room.name}</h3>
                                        {user?.role === 'teacher' ? (
                                            <button onClick={(e) => handleDelete(e, room.id)} className="btn btn-ghost btn-icon btn-sm" style={{ position: 'absolute', top: 12, right: 12, color: 'white' }} title={t('dashboard.deleteRoom')}>
                                                <FiTrash2 />
                                            </button>
                                        ) : (
                                            <button onClick={(e) => handleLeave(e, room.id)} className="btn btn-ghost btn-icon btn-sm" style={{ position: 'absolute', top: 12, right: 12, color: 'white' }} title={t('dashboard.leaveRoom')}>
                                                <FiLogOut />
                                            </button>
                                        )}
                                    </div>
                                    <div className="room-card-body">
                                        <p>{room.subject || room.description || t('dashboard.noDescription')}</p>
                                        <div className="room-card-meta">
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <FiUsers /> {room.student_count} {t('dashboard.students')}
                                            </span>
                                            {user?.role === 'teacher' && <span className="badge badge-brand">{t('dashboard.teacher')}</span>}
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )
                })()}

                {/* Create Room Modal */}
                {showCreate && (
                    <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                        <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            <div className="modal-header">
                                <h2>{t('createRoom.title')}</h2>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}>✕</button>
                            </div>
                            <form onSubmit={handleCreate}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">{t('createRoom.name')} *</label>
                                        <input className="form-input" placeholder={t('createRoom.namePlaceholder')} value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} required autoFocus />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('createRoom.subject')}</label>
                                        <input className="form-input" placeholder={t('createRoom.subjectPlaceholder')} value={createForm.subject} onChange={e => setCreateForm(p => ({ ...p, subject: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('createRoom.description')}</label>
                                        <textarea className="form-input" rows="2" placeholder={t('createRoom.descPlaceholder')} value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('createRoom.colorTheme')}</label>
                                        <div className="color-options">
                                            {COLORS.map(c => (
                                                <div key={c} className={`color-swatch ${createForm.color_theme === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setCreateForm(p => ({ ...p, color_theme: c }))} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? t('createRoom.creating') : t('createRoom.create')}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Join Room Modal */}
                {showJoin && (
                    <div className="modal-overlay" onClick={() => setShowJoin(false)}>
                        <motion.div className="modal" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            <div className="modal-header">
                                <h2>{t('joinRoom.title')}</h2>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowJoin(false)}>✕</button>
                            </div>
                            <form onSubmit={handleJoin}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">{t('joinRoom.codeLabel')}</label>
                                        <input className="form-input" placeholder={t('joinRoom.codePlaceholder')} value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={8} required autoFocus style={{ letterSpacing: '2px', fontWeight: 600, textAlign: 'center', fontSize: 18 }} />
                                    </div>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('joinRoom.codeHint')}</p>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowJoin(false)}>{t('common.cancel')}</button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? t('joinRoom.joining') : t('joinRoom.join')}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* 2FA Reminder Popup */}
                <AnimatePresence>
                    {show2faReminder && (
                        <div className="modal-overlay" onClick={() => dismiss2faReminder(false)} style={{ zIndex: 1100 }}>
                            <motion.div
                                className="modal"
                                onClick={e => e.stopPropagation()}
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                style={{ maxWidth: 440, textAlign: 'center' }}
                            >
                                <button className="btn btn-ghost btn-icon" onClick={() => dismiss2faReminder(false)} style={{ position: 'absolute', top: 12, right: 12 }}><FiX /></button>
                                <div style={{ padding: '32px 24px 24px' }}>
                                    <div style={{
                                        width: 64, height: 64, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #f59e0b22, #f59e0b44)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 20px', color: '#f59e0b'
                                    }}>
                                        <FiShield size={32} />
                                    </div>
                                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{t('2fa.reminderTitle')}</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                                        {t('2fa.reminderDesc')}
                                    </p>
                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                                        <button className="btn btn-secondary" onClick={() => dismiss2faReminder(false)}>
                                            {t('2fa.reminderLater')}
                                        </button>
                                        <button className="btn btn-primary" onClick={() => dismiss2faReminder(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <FiShield size={16} /> {t('2fa.reminderActivate')}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
