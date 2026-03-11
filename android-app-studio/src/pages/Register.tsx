import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, GraduationCap, BookOpen } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'student',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await signup(form);
      navigate('/home', { replace: true });
    } catch (err: any) {
      if (err instanceof TypeError || err?.message === 'Failed to fetch') {
        setError('Network error. Please check your connection.');
      } else {
        const detail = err?.detail || err?.email?.[0] || err?.password?.[0] || err?.non_field_errors?.[0] || 'Registration failed.';
        setError(detail);
      }
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container glass-panel relative z-10 mx-6">
        <div className="auth-header">
          <div className="auth-logo">
            <svg width="48" height="48" viewBox="0 0 72 72" fill="none">
              <rect width="72" height="72" rx="18" fill="#D97757" fillOpacity="0.15" />
              <path d="M16 18H26V54H16ZM26 26L56 18V27L26 36ZM26 36L56 45V54L26 46Z" fill="#D97757" />
            </svg>
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join ISET Classroom today</p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Role selector */}
          <div className="role-selector">
            <button
              type="button"
              className={`role-option ${form.role === 'student' ? 'active' : ''}`}
              onClick={() => update('role', 'student')}
            >
              <GraduationCap size={20} />
              <span>Student</span>
            </button>
            <button
              type="button"
              className={`role-option ${form.role === 'teacher' ? 'active' : ''}`}
              onClick={() => update('role', 'teacher')}
            >
              <BookOpen size={20} />
              <span>Teacher</span>
            </button>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>First Name</label>
              <div className="input-wrapper glass-panel py-1 px-2 border-white/10">
                <User size={18} className="input-icon text-tertiary" />
                <input
                  type="text"
                  placeholder="First"
                  value={form.first_name}
                  onChange={(e) => update('first_name', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="input-group">
              <label>Last Name</label>
              <div className="input-wrapper glass-panel py-1 px-2 border-white/10">
                <User size={18} className="input-icon text-tertiary" />
                <input
                  type="text"
                  placeholder="Last"
                  value={form.last_name}
                  onChange={(e) => update('last_name', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="input-group">
            <label>Email</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon text-tertiary" />
              <input
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon text-tertiary" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
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

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/login" className="auth-link">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
