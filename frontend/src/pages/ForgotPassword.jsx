import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../LanguageContext';
import { authAPI } from '../api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowLeft, FiCheck } from 'react-icons/fi';

export default function ForgotPassword() {
    const { t } = useTranslation();
    const [step, setStep] = useState('email'); // email | code | done
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authAPI.forgotPassword(email);
            toast.success(t('forgot.codeSent'));
            setStep('code');
        } catch {
            toast.error(t('forgot.error'));
        }
        setLoading(false);
    };

    const handleReset = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error(t('signup.passwordMismatch'));
            return;
        }
        if (newPassword.length < 8) {
            toast.error(t('signup.passwordTooShort'));
            return;
        }
        setLoading(true);
        try {
            await authAPI.resetPassword({ email, code, new_password: newPassword });
            toast.success(t('forgot.resetSuccess'));
            setStep('done');
        } catch (err) {
            toast.error(err.response?.data?.detail || t('forgot.error'));
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            <motion.div
                className="auth-card card"
                style={{ width: '100%', maxWidth: 400, margin: '100px auto', padding: 40 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div className="logo" style={{
                            width: 32, height: 32,
                            background: 'var(--text-primary)', color: 'var(--bg-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: 6, fontWeight: 500, fontFamily: 'var(--font-serif)'
                        }}>K</div>
                        <h2 style={{ fontSize: 20, fontFamily: 'var(--font-serif)' }}>Kelebia Classroom</h2>
                    </Link>

                    {step === 'done' ? (
                        <>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--success)', fontSize: 28 }}>
                                <FiCheck />
                            </div>
                            <h1 style={{ fontSize: 24 }}>{t('forgot.doneTitle')}</h1>
                            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>{t('forgot.doneDesc')}</p>
                            <Link to="/login" className="btn btn-primary btn-full btn-lg" style={{ marginTop: 24 }}>
                                {t('forgot.backToLogin')}
                            </Link>
                        </>
                    ) : step === 'code' ? (
                        <>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--brand-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--brand)', fontSize: 28 }}>
                                <FiLock />
                            </div>
                            <h1 style={{ fontSize: 24 }}>{t('forgot.resetTitle')}</h1>
                            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>{t('forgot.resetDesc')} <strong>{email}</strong></p>
                        </>
                    ) : (
                        <>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--brand-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--brand)', fontSize: 28 }}>
                                <FiMail />
                            </div>
                            <h1 style={{ fontSize: 24 }}>{t('forgot.title')}</h1>
                            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>{t('forgot.subtitle')}</p>
                        </>
                    )}
                </div>

                {step === 'email' && (
                    <form onSubmit={handleSendCode}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="forgot-email">{t('login.email')}</label>
                            <input id="forgot-email" type="email" className="form-input" placeholder={t('login.emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
                        </div>
                        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                            {loading ? t('forgot.sending') : t('forgot.sendCode')}
                        </button>
                    </form>
                )}

                {step === 'code' && (
                    <form onSubmit={handleReset}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="forgot-code">{t('forgot.codeLabel')}</label>
                            <input id="forgot-code" type="text" className="form-input" placeholder="000000" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                                style={{ textAlign: 'center', fontSize: 24, letterSpacing: '6px', fontWeight: 700, fontFamily: 'monospace' }} required autoFocus />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="forgot-new-password">{t('forgot.newPassword')}</label>
                            <input id="forgot-new-password" type="password" className="form-input" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="forgot-confirm-password">{t('forgot.confirmPassword')}</label>
                            <input id="forgot-confirm-password" type="password" className="form-input" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                            {loading ? t('forgot.resetting') : t('forgot.resetButton')}
                        </button>
                    </form>
                )}

                {step !== 'done' && (
                    <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }}>
                        <Link to="/login" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <FiArrowLeft /> {t('forgot.backToLogin')}
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
