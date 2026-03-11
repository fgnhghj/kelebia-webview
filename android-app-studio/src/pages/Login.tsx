import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password, needs2FA ? totpCode : undefined);
      if (result.requires_2fa) {
        setNeeds2FA(true);
        setLoading(false);
        return;
      }
      navigate('/home', { replace: true });
    } catch (err: any) {
      if (err instanceof TypeError || err?.message === 'Failed to fetch') {
        setError('Network error. Please check your connection.');
      } else {
        setError(err?.detail || err?.non_field_errors?.[0] || 'Invalid email or password.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container glass-panel relative z-10 mx-6">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <svg width="48" height="48" viewBox="0 0 88 88" fill="none">
              <path d="M26 18 L26 70" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" />
              <path d="M26 44 L58 18" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" />
              <path d="M34 38 L58 70" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" />
              <circle cx="62" cy="18" r="6" fill="var(--accent)" />
            </svg>
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your ISET Classroom account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {!needs2FA ? (
            <>
              <div className="input-group">
                <label>Email</label>
                <div className="input-wrapper glass-panel py-1 px-2 border-white/10">
                  <Mail size={18} className="input-icon text-tertiary" />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Password</label>
                <div className="input-wrapper glass-panel py-1 px-2 border-white/10">
                  <Lock size={18} className="input-icon text-tertiary" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="input-action"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Link to="/forgot-password" className="auth-link-inline">
                Forgot password?
              </Link>
            </>
          ) : (
            <div className="input-group">
              <label>2FA Code</label>
              <p className="input-hint">Enter the 6-digit code from your authenticator app</p>
              <div className="input-wrapper glass-panel py-1 px-2 border-white/10">
                <Lock size={18} className="input-icon text-tertiary" />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  autoFocus
                  className="text-center tracking-[0.5em]"
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : needs2FA ? 'Verify' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        {!needs2FA && (
          <div className="auth-footer">
            <span>Don't have an account?</span>
            <Link to="/register" className="auth-link">Sign Up</Link>
          </div>
        )}

        {needs2FA && (
          <button
            className="auth-back-link"
            onClick={() => { setNeeds2FA(false); setTotpCode(''); setError(''); }}
          >
            ← Back to login
          </button>
        )}
      </div>
    </div>
  );
}
