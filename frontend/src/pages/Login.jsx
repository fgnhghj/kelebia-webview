import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from '../LanguageContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiShield } from 'react-icons/fi';

export default function Login() {
    const { login } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [needs2FA, setNeeds2FA] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await login(email, password, needs2FA ? totpCode : undefined);
            if (result?.requires_2fa) {
                setNeeds2FA(true);
                return;  // finally handles setLoading(false)
            }
            toast.success(t('login.success'));
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || t('login.error'));
        } finally {
            setLoading(false);
        }
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
                    <h1 style={{ fontSize: 28 }}>{needs2FA ? t('login.2faTitle') : t('login.welcome')}</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                        {needs2FA ? t('login.2faSubtitle') : t('login.subtitle')}
                    </p>
                </div>

                {error && <div className="badge badge-danger" style={{ display: 'block', textAlign: 'center', padding: '10px', marginBottom: 24, borderRadius: 'var(--radius-sm)' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    {!needs2FA ? (
                        <>
                            <div className="form-group">
                                <label className="form-label" htmlFor="login-email">{t('login.email')}</label>
                                <input id="login-email" type="email" className="form-input" placeholder={t('login.emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="login-password">{t('login.password')}</label>
                                <input id="login-password" type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                            </div>
                        </>
                    ) : (
                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, color: 'var(--brand)' }}>
                                <FiShield size={40} />
                            </div>
                            <label className="form-label" htmlFor="login-totp">{t('login.2faCode')}</label>
                            <input id="login-totp" type="text" className="form-input" placeholder="000000" maxLength={6} value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))} style={{ textAlign: 'center', fontSize: 24, letterSpacing: '6px', fontWeight: 700, fontFamily: 'monospace' }} required autoFocus />
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: 12 }} disabled={loading}>
                        {loading ? t('login.connecting') : needs2FA ? t('login.verify') : t('login.connect')}
                    </button>
                </form>

                {needs2FA && (
                    <button className="btn btn-ghost" style={{ marginTop: 16, width: '100%' }} onClick={() => { setNeeds2FA(false); setTotpCode(''); setError(''); }}>
                        {t('login.back')}
                    </button>
                )}

                <div className="auth-footer" style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: 'var(--text-secondary)' }}>
                    {t('login.noAccount')} <Link to="/signup" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{t('login.signup')}</Link>
                    <br />
                    <Link to="/forgot-password" style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8, display: 'inline-block' }}>{t('login.forgotPassword')}</Link>
                </div>
            </motion.div>
        </div>
    );
}
