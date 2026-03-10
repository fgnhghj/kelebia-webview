import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { roomsAPI } from '../api/client';
import {
  Search, LogIn, Loader2, AlertCircle, CheckCircle2,
  Users, ArrowRight,
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
      <header className="page-header">
        <div>
          <h1 className="page-title">{t('explore')}</h1>
          <p className="page-subtitle">{t('join_with_code')}</p>
        </div>
      </header>

      {/* Search / Join Form */}
      <form onSubmit={handleJoin} className="join-form">
        <div className="join-input-wrapper">
          <Search size={20} className="join-input-icon" />
          <input
            type="text"
            placeholder={t('enter_code')}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="join-input"
            maxLength={8}
            autoFocus
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

      {/* Tips */}
      <div className="join-tips">
        <h3>{t('how_to_join')}</h3>
        <ul>
          <li>{t('tip_1')}</li>
          <li>{t('tip_2')}</li>
          <li>{t('tip_3')}</li>
        </ul>
      </div>
    </div>
  );
}
