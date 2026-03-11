import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { roomsAPI } from '../api/client';
import {
  Hash, Loader2, AlertCircle, CheckCircle2,
  Users, ArrowRight, Compass
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
    <div className="page-container flex flex-col items-center justify-center min-h-[85vh] px-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-fade-in">
          <Compass size={32} className="text-white/80" />
        </div>
        <h1 className="text-3xl font-serif text-white text-center mb-2 animate-fade-up" style={{ animationDelay: '50ms' }}>{t('join_room')}</h1>
        <p className="text-tertiary text-center text-[15px] mb-12 animate-fade-up" style={{ animationDelay: '100ms' }}>{t('join_with_code')}</p>

        <form onSubmit={handleJoin} className="w-full relative animate-fade-up" style={{ animationDelay: '150ms' }}>
          <div className="glass-panel p-2 flex items-center rounded-2xl border border-white/10 shadow-2xl">
            <Hash size={20} className="text-tertiary ml-3" />
            <input
              type="text"
              placeholder="ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="flex-1 bg-transparent border-none text-white px-4 py-3 font-medium tracking-[0.2em] outline-none placeholder:text-white/20 uppercase"
              maxLength={8}
            />
            <button
              type="submit"
              className="bg-white text-black w-12 h-12 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center hover:scale-[1.02] active:scale-95"
              disabled={loading || !code.trim()}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-8 flex items-center justify-center gap-2 text-red-400 bg-red-400/10 py-3 px-5 rounded-xl border border-red-400/20 w-full animate-fade-up">
            <AlertCircle size={18} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {result && (
          <div className="mt-8 w-full glass-panel p-6 rounded-3xl border border-white/10 text-center animate-fade-up">
            <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-4 border border-green-500/30">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-white text-lg font-medium mb-1">{result.message}</h3>
            <div className="flex items-center justify-center gap-2 text-tertiary text-sm mb-6 mt-3">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: result.room?.color_theme || '#4a5468' }}></span>
              <span>{result.room?.name}</span>
              <span>•</span>
              <Users size={14} />
              <span>{result.room?.student_count}</span>
            </div>
            <button
              className="bg-white text-black font-medium py-3.5 px-8 rounded-xl w-full hover:bg-white/90 transition-colors"
              onClick={() => navigate(`/room/${result.room?.id}`)}
            >
              {t('open_room')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
