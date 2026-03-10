import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from '../LanguageContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiMonitor, FiBookOpen } from 'react-icons/fi';

function getPasswordStrength(pw, t) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 'weak', pct: 25, color: 'strength-weak', label: t('signup.weak') };
    if (score <= 2) return { level: 'fair', pct: 50, color: 'strength-fair', label: t('signup.fair') };
    if (score <= 3) return { level: 'good', pct: 75, color: 'strength-good', label: t('signup.good') };
    return { level: 'strong', pct: 100, color: 'strength-strong', label: t('signup.strong') };
}

export default function Signup() {
    const { signup } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialRole = searchParams.get('role') === 'teacher' ? 'teacher' : 'student';
    const [form, setForm] = useState({
        first_name: '', last_name: '', email: '', password: '', confirmPassword: '', role: initialRole
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const strength = useMemo(() => getPasswordStrength(form.password, t), [form.password, t]);
    const passwordsMatch = form.password && form.confirmPassword && form.password === form.confirmPassword;
    const passwordsMismatch = form.confirmPassword && form.password !== form.confirmPassword;

    const update = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (form.password !== form.confirmPassword) {
            setErrors({ confirmPassword: t('signup.passwordMismatch') });
            return;
        }
        if (form.password.length < 8) {
            setErrors({ password: t('signup.passwordTooShort') });
            return;
        }

        setLoading(true);
        try {
            const result = await signup({
                first_name: form.first_name,
                last_name: form.last_name,
                email: form.email,
                password: form.password,
                role: form.role,
            });
            toast.success(t('signup.success'));
            navigate('/dashboard');
        } catch (err) {
            const data = err.response?.data;
            if (data) {
                const newErrors = {};
                Object.entries(data).forEach(([key, val]) => {
                    newErrors[key] = Array.isArray(val) ? val[0] : val;
                });
                setErrors(newErrors);
            } else {
                // Added 2FA handling
                if (err.response?.status === 403 && err.response?.data?.detail === '2FA required') {
                    setNeeds2FA(true);
                    return; // finally will call setLoading(false)
                }
                toast.error(t('signup.error'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <motion.div
                className="auth-card card"
                style={{ width: '100%', maxWidth: 440, margin: '64px auto', padding: 40 }}
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
                    <h1 style={{ fontSize: 28 }}>{t('signup.title')}</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>{t('signup.subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Role Picker */}
                    <div className="form-group">
                        <label className="form-label">{t('signup.iAm')}</label>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <div
                                style={{
                                    flex: 1, padding: 16, border: `1px solid ${form.role === 'teacher' ? 'var(--text-primary)' : 'var(--border)'}`,
                                    borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'center', transition: 'var(--transition)',
                                    background: form.role === 'teacher' ? 'var(--bg-secondary)' : 'transparent',
                                    boxShadow: form.role === 'teacher' ? '0 0 0 1px var(--text-primary)' : 'none'
                                }}
                                onClick={() => update('role', 'teacher')}
                            >
                                <FiMonitor size={24} style={{ marginBottom: 8, color: form.role === 'teacher' ? 'var(--text-primary)' : 'var(--text-muted)' }} />
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{t('signup.teacher')}</div>
                            </div>
                            <div
                                style={{
                                    flex: 1, padding: 16, border: `1px solid ${form.role === 'student' ? 'var(--text-primary)' : 'var(--border)'}`,
                                    borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'center', transition: 'var(--transition)',
                                    background: form.role === 'student' ? 'var(--bg-secondary)' : 'transparent',
                                    boxShadow: form.role === 'student' ? '0 0 0 1px var(--text-primary)' : 'none'
                                }}
                                onClick={() => update('role', 'student')}
                            >
                                <FiBookOpen size={24} style={{ marginBottom: 8, color: form.role === 'student' ? 'var(--text-primary)' : 'var(--text-muted)' }} />
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{t('signup.student')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Name */}
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="signup-first-name">{t('signup.firstName')}</label>
                            <input
                                id="signup-first-name"
                                type="text"
                                className={`form-input ${errors.first_name ? 'error' : ''}`}
                                placeholder={t('signup.firstNamePlaceholder')}
                                value={form.first_name}
                                onChange={e => update('first_name', e.target.value)}
                                required
                            />
                            {errors.first_name && <div className="form-error">{errors.first_name}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="signup-last-name">{t('signup.lastName')}</label>
                            <input
                                id="signup-last-name"
                                type="text"
                                className={`form-input ${errors.last_name ? 'error' : ''}`}
                                placeholder={t('signup.lastNamePlaceholder')}
                                value={form.last_name}
                                onChange={e => update('last_name', e.target.value)}
                                required
                            />
                            {errors.last_name && <div className="form-error">{errors.last_name}</div>}
                        </div>
                    </div>

                    {/* Email */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-email">{t('signup.email')}</label>
                        <input
                            id="signup-email"
                            type="email"
                            className={`form-input ${errors.email ? 'error' : ''}`}
                            placeholder={t('signup.emailPlaceholder')}
                            value={form.email}
                            onChange={e => update('email', e.target.value)}
                            required
                        />
                        {errors.email && <div className="form-error">{errors.email}</div>}
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-password">{t('signup.password')}</label>
                        <input
                            id="signup-password"
                            type="password"
                            className={`form-input ${errors.password ? 'error' : ''}`}
                            placeholder={t('signup.passwordPlaceholder')}
                            value={form.password}
                            onChange={e => update('password', e.target.value)}
                            required
                        />
                        {form.password && (
                            <div className="password-strength" style={{ marginTop: 8 }}>
                                <div className="password-strength-bar" style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                                    <div
                                        className={`password-strength-fill ${strength.color}`}
                                        style={{ width: `${strength.pct}%`, height: '100%', transition: 'all 0.3s ease' }}
                                    />
                                </div>
                                <div className={`password-strength-text ${strength.color}`} style={{ fontSize: 11, marginTop: 4, fontWeight: 500 }}>
                                    {strength.label}
                                </div>
                            </div>
                        )}
                        {errors.password && <div className="form-error">{errors.password}</div>}
                    </div>

                    {/* Confirm Password */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-confirm-password">{t('signup.confirmPassword')}</label>
                        <input
                            id="signup-confirm-password"
                            type="password"
                            className={`form-input ${passwordsMismatch ? 'error' : ''}`}
                            placeholder={t('signup.confirmPlaceholder')}
                            value={form.confirmPassword}
                            onChange={e => update('confirmPassword', e.target.value)}
                            required
                        />
                        {passwordsMatch && <div className="form-success">{t('signup.passwordsMatch')}</div>}
                        {passwordsMismatch && <div className="form-error">{t('signup.passwordsMismatch')}</div>}
                        {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
                    </div>

                    <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: 12 }} disabled={loading || passwordsMismatch}>
                        {loading ? t('signup.creating') : t('signup.create')}
                    </button>
                </form>

                <div className="auth-footer" style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: 'var(--text-secondary)' }}>
                    {t('signup.hasAccount')} <Link to="/login" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{t('signup.login')}</Link>
                </div>
            </motion.div>
        </div>
    );
}
