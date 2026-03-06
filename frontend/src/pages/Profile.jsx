import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useTranslation } from '../LanguageContext';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import { authAPI } from '../api';
import { motion } from 'framer-motion';
import { FiShield, FiCheckCircle, FiGlobe } from 'react-icons/fi';

export default function Profile() {
    const { user, refreshUser } = useAuth();
    const { t, language, changeLanguage } = useTranslation();
    const [form, setForm] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        bio: user?.bio || '',
        institution: user?.institution || '',
    });
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    // 2FA state
    const [twoFaStep, setTwoFaStep] = useState(null);
    const [qrData, setQrData] = useState(null);
    const [totpCode, setTotpCode] = useState('');
    const [twoFaLoading, setTwoFaLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));
            await authAPI.updateProfile(fd);
            await refreshUser();
            toast.success(t('profile.updateSuccess'));
        } catch {
            toast.error(t('profile.updateError'));
        }
        setLoading(false);
    };

    const handleEnable2FA = async () => {
        setTwoFaLoading(true);
        try {
            const { data } = await authAPI.enable2FA();
            setQrData(data);
            setTwoFaStep('setup');
        } catch (err) {
            toast.error(err.response?.data?.detail || t('2fa.error'));
        }
        setTwoFaLoading(false);
    };

    const handleConfirm2FA = async () => {
        setTwoFaLoading(true);
        try {
            await authAPI.confirm2FA(totpCode);
            toast.success(t('2fa.activated'));
            setTwoFaStep(null);
            setQrData(null);
            setTotpCode('');
            await refreshUser();
        } catch (err) {
            toast.error(err.response?.data?.detail || t('2fa.invalidCode'));
        }
        setTwoFaLoading(false);
    };

    const handleDisable2FA = async () => {
        if (!window.confirm(t('2fa.confirmDisable'))) return;
        setTwoFaLoading(true);
        try {
            await authAPI.disable2FA();
            toast.success(t('2fa.deactivated'));
            await refreshUser();
        } catch {
            toast.error(t('2fa.error'));
        }
        setTwoFaLoading(false);
    };

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <h1>{t('profile.title')}</h1>
                    <p>{t('profile.subtitle')}</p>
                </div>

                <motion.div className="card" style={{ maxWidth: 560 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                        <div className="avatar xl">
                            {(user?.first_name?.[0] || 'U').toUpperCase()}
                        </div>
                        <div>
                            <h2 style={{ fontWeight: 700, fontSize: 20 }}>{user?.full_name || user?.username}</h2>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</p>
                            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                                <span className="badge badge-brand">{user?.role === 'teacher' ? t('profile.teacher') : t('profile.student')}</span>
                                <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiCheckCircle /> {t('profile.emailVerified')}</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">{t('profile.firstName')}</label>
                                <input className="form-input" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('profile.lastName')}</label>
                                <input className="form-input" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('profile.bio')}</label>
                            <textarea className="form-input" rows="3" placeholder={t('profile.bioPlaceholder')} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('profile.institution')}</label>
                            <input className="form-input" placeholder={t('profile.institutionPlaceholder')} value={form.institution} onChange={e => setForm(p => ({ ...p, institution: e.target.value }))} />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? t('profile.saving') : t('profile.saveChanges')}
                        </button>
                    </form>
                </motion.div>

                {/* 2FA Section */}
                <motion.div className="card" style={{ maxWidth: 560, marginTop: 24 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <FiShield size={22} />
                        <div>
                            <h3 style={{ fontWeight: 700, fontSize: 16 }}>{t('2fa.title')}</h3>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                {user?.is_2fa_enabled ? t('2fa.enabledDesc') : t('2fa.disabledDesc')}
                            </p>
                        </div>
                    </div>

                    {user?.is_2fa_enabled ? (
                        <div>
                            <div className="badge badge-success" style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <FiCheckCircle /> {t('2fa.enabled')}
                            </div>
                            <br />
                            <button className="btn btn-secondary btn-sm" onClick={handleDisable2FA} disabled={twoFaLoading}>
                                {twoFaLoading ? t('2fa.disabling') : t('2fa.disable')}
                            </button>
                        </div>
                    ) : twoFaStep === 'setup' ? (
                        <div>
                            <p style={{ fontSize: 14, marginBottom: 16 }}>
                                {t('2fa.scanQR')}
                            </p>
                            {qrData?.qr_code && (
                                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                    <img src={qrData.qr_code} alt="2FA QR Code" style={{ width: 200, height: 200, borderRadius: 8, border: '1px solid var(--border)' }} />
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">{t('2fa.verificationCode')}</label>
                                <input
                                    type="text" className="form-input" placeholder="000000" maxLength={6}
                                    value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                                    style={{ textAlign: 'center', fontSize: 20, letterSpacing: '6px', fontWeight: 700, fontFamily: 'monospace' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-primary btn-sm" onClick={handleConfirm2FA} disabled={twoFaLoading || totpCode.length !== 6}>
                                    {twoFaLoading ? t('2fa.verifying') : t('2fa.confirm')}
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => { setTwoFaStep(null); setTotpCode(''); }}>{t('common.cancel')}</button>
                            </div>
                        </div>
                    ) : (
                        <button className="btn btn-primary btn-sm" onClick={handleEnable2FA} disabled={twoFaLoading}>
                            {twoFaLoading ? t('2fa.enabling') : t('2fa.enable')}
                        </button>
                    )}
                </motion.div>

                {/* Language Selector Section */}
                <motion.div className="card" style={{ maxWidth: 560, marginTop: 24 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <FiGlobe size={22} />
                        <div>
                            <h3 style={{ fontWeight: 700, fontSize: 16 }}>{t('profile.language')}</h3>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            className={`btn ${language === 'fr' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            onClick={() => changeLanguage('fr')}
                            style={{ minWidth: 120 }}
                        >
                            🇫🇷 Français
                        </button>
                        <button
                            className={`btn ${language === 'en' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            onClick={() => changeLanguage('en')}
                            style={{ minWidth: 120 }}
                        >
                            🇬🇧 English
                        </button>
                    </div>
                </motion.div>

            </main>
        </div>
    );
}
