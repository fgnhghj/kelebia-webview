import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useTranslation } from '../LanguageContext';
import { gradesAPI } from '../api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiAward, FiBookOpen, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';

export default function Grades() {
    const { t } = useTranslation();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await gradesAPI.overview();
                setRooms(data);
            } catch { toast.error(t('grades.loadError')); }
            finally { setLoading(false); }
        };
        load();
    }, [t]);

    const totalScore = rooms.reduce((s, r) => s + r.total_score, 0);
    const totalMax = rooms.reduce((s, r) => s + r.total_max, 0);
    const overallAvg = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(1) : 0;
    const totalAssignments = rooms.reduce((s, r) => s + (r.total_assignments || 0), 0);
    const totalSubmitted = rooms.reduce((s, r) => s + (r.submitted_count || 0), 0);
    const overallCompletion = totalAssignments > 0 ? ((totalSubmitted / totalAssignments) * 100).toFixed(0) : 0;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <h1>{t('grades.title')}</h1>
                    <p>{t('grades.subtitle')}</p>
                </div>

                {loading ? (
                    <div className="card"><div className="skeleton" style={{ height: 200 }} /></div>
                ) : rooms.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon" style={{ fontSize: 40, color: 'var(--brand)', marginBottom: 16 }}>
                            <FiAward />
                        </div>
                        <h3>{t('grades.noGrades')}</h3>
                        <p>{t('grades.noGradesDesc')}</p>
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="stats-grid" style={{ marginBottom: 24 }}>
                            <div className="stat-card">
                                <div className="stat-value">{rooms.length}</div>
                                <div className="stat-label">{t('grades.gradedRooms')}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value">{rooms.reduce((s, r) => s + r.grades.length, 0)}</div>
                                <div className="stat-label">{t('grades.totalGrades')}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FiTrendingUp size={18} /> {overallAvg}%
                                </div>
                                <div className="stat-label">{t('grades.overallAverage')}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FiCheckCircle size={18} /> {overallCompletion}%
                                </div>
                                <div className="stat-label">Completion ({totalSubmitted}/{totalAssignments})</div>
                            </div>
                        </div>

                        {/* Room grades */}
                        {rooms.map((room, idx) => (
                            <motion.div
                                key={room.room_id}
                                className="card"
                                style={{ marginBottom: 16, overflow: 'hidden' }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <Link to={`/rooms/${room.room_id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 8,
                                            background: `linear-gradient(135deg, ${room.room_color}, ${room.room_color}88)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontSize: 16
                                        }}>
                                            <FiBookOpen />
                                        </div>
                                        <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{room.room_name}</h3>
                                    </Link>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            background: room.average >= 70 ? 'var(--success-bg, #dcfce7)' : room.average >= 50 ? 'var(--warning-bg, #fef3c7)' : 'var(--danger-bg, #fee2e2)',
                                            color: room.average >= 70 ? 'var(--success, #16a34a)' : room.average >= 50 ? 'var(--warning, #d97706)' : 'var(--danger, #dc2626)',
                                            padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: 14
                                        }}>
                                            {room.average}%
                                        </div>
                                    </div>
                                </div>

                                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                        <thead>
                                            <tr style={{ background: 'var(--bg-secondary)' }}>
                                                <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: 'var(--text-muted)' }}>{t('grades.assignment')}</th>
                                                <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 600, color: 'var(--text-muted)' }}>{t('grades.score')}</th>
                                                <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 600, color: 'var(--text-muted)' }}>{t('grades.percentage')}</th>
                                                <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: 'var(--text-muted)' }}>{t('grades.feedback')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {room.grades.map((g, i) => {
                                                const pct = g.max_grade > 0 ? ((g.score / g.max_grade) * 100).toFixed(0) : 0;
                                                return (
                                                    <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                                                        <td style={{ padding: '10px 12px', fontWeight: 500 }}>{g.assignment_title}</td>
                                                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>
                                                            {g.score}/{g.max_grade}
                                                        </td>
                                                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                            <span style={{
                                                                padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                                                                background: pct >= 70 ? '#dcfce7' : pct >= 50 ? '#fef3c7' : '#fee2e2',
                                                                color: pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626',
                                                            }}>
                                                                {pct}%
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 12 }}>
                                                            {g.feedback || '—'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', fontSize: 13, color: 'var(--text-muted)' }}>
                                    {t('grades.roomTotal')}: <strong style={{ marginLeft: 4, color: 'var(--text-primary)' }}>{room.total_score}/{room.total_max}</strong>
                                </div>

                                {/* Completion progress bar */}
                                {(room.total_assignments || 0) > 0 && (
                                    <div style={{ marginTop: 10 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                                            <span>Completion</span>
                                            <span>{room.submitted_count}/{room.total_assignments} submitted ({room.completion_pct || 0}%)</span>
                                        </div>
                                        <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', borderRadius: 3,
                                                width: `${room.completion_pct || 0}%`,
                                                background: (room.completion_pct || 0) >= 70 ? 'var(--success, #16a34a)' : (room.completion_pct || 0) >= 50 ? 'var(--warning, #d97706)' : 'var(--brand, #6366f1)',
                                                transition: 'width 0.5s ease',
                                            }} />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </>
                )}
            </main>
        </div>
    );
}
