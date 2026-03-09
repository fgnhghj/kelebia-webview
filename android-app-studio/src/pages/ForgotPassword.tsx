import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/client';
import { Mail, Lock, KeyRound, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

type Step = 'email' | 'code' | 'done';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setStep('code');
    } catch (err: any) {
      setError(err?.detail || 'Failed to send code.');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({ email, code, new_password: newPassword });
      setStep('done');
    } catch (err: any) {
      setError(err?.detail || 'Invalid code or request failed.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <KeyRound size={32} className="text-accent" />
          </div>
          <h1 className="auth-title">
            {step === 'done' ? 'All Set!' : 'Reset Password'}
          </h1>
          <p className="auth-subtitle">
            {step === 'email' && "Enter your email and we'll send you a reset code"}
            {step === 'code' && `Enter the code sent to ${email}`}
            {step === 'done' && 'Your password has been reset successfully'}
          </p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleSendCode} className="auth-form">
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Send Reset Code'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="input-group">
              <label>Reset Code</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  autoFocus
                  className="text-center tracking-[0.3em]"
                />
              </div>
            </div>
            <div className="input-group">
              <label>New Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="auth-form">
            <div className="success-icon-container">
              <CheckCircle2 size={56} className="text-success" />
            </div>
            <button className="btn-primary" onClick={() => navigate('/login', { replace: true })}>
              Back to Sign In
            </button>
          </div>
        )}

        <Link to="/login" className="auth-back-link">
          <ArrowLeft size={16} />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
}
