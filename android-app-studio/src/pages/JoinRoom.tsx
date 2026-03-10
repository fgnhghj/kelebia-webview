import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { roomsAPI } from '../api/client';
import {
  Search, Loader2, AlertCircle, CheckCircle2,
  Users, ArrowRight, Compass, Hash, BookOpen, Zap,
} from 'lucide-react';

export default function JoinRoom() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const data = await roomsAPI.join(code.trim());
      setResult(data);
    } catch (err: any) {
      setError(err?.error || err?.detail || 'Invalid invite code.');
    }
    setLoading(false);
  };

  return (
    <div className="page-container">
      {/* Hero */}
      <div className="explore-hero">
        <div className="explore-hero-icon">
          <Compass size={36} />
        </div>
        <h1 className="explore-hero-title">{t('explore')}</h1>
        <p className="explore-hero-desc">{t('join_with_code')}</p>
      </div>

      {/* Search / Join Form */}
      <form onSubmit={handleJoin} className="explore-form-card">
        <div className="explore-form-label">
          <Hash size={16} />
          <span>{t('enter_code')}</span>
        </div>
        <div className="join-input-wrapper">
          <Search size={20} className="join-input-icon" />
          <input
            type="text"
            placeholder="ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="join-input"
            maxLength={8}
          />
          <button
            type="submit"
            className="join-submit-btn"
            disabled={loading || !code.trim()}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
          </button>
        </div>
      </form>

      {error && (
        <div className="join-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="join-result">
          <div className="join-result-icon">
            <CheckCircle2 size={32} className="text-success" />
          </div>
          <h3>{result.message}</h3>
          <div className="join-room-preview">
            <div
              className="join-room-color"
              style={{ backgroundColor: result.room?.color_theme }}
            />
            <div className="join-room-info">
              <h4>{result.room?.name}</h4>
              {result.room?.subject && <span>{result.room.subject}</span>}
              <div className="join-room-meta">
                <Users size={14} />
                <span>{result.room?.student_count} {t('students')}</span>
              </div>
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate(`/room/${result.room?.id}`)}
          >
            {t('open_room')}
          </button>
        </div>
      )}

      {/* Step Cards */}
      <div className="explore-steps">
        <h3 className="explore-steps-title">{t('how_to_join')}</h3>
        <div className="explore-step-card">
          <div className="explore-step-num">1</div>
          <div className="explore-step-body">
            <BookOpen size={18} className="explore-step-icon" />
            <p>{t('tip_1')}</p>
          </div>
        </div>
        <div className="explore-step-card">
          <div className="explore-step-num">2</div>
          <div className="explore-step-body">
            <Hash size={18} className="explore-step-icon" />
            <p>{t('tip_2')}</p>
          </div>
        </div>
        <div className="explore-step-card">
          <div className="explore-step-num">3</div>
          <div className="explore-step-body">
            <Zap size={18} className="explore-step-icon" />
            <p>{t('tip_3')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
