import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SplashScreen() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [animStage, setAnimStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setAnimStage(1), 100);
    const t2 = setTimeout(() => setAnimStage(2), 600);
    const t3 = setTimeout(() => setAnimStage(3), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    if (loading) return;
    const timeout = setTimeout(() => {
      if (user) {
        navigate('/home', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 2800);
    return () => clearTimeout(timeout);
  }, [loading, user, navigate]);

  return (
    <div className="splash-screen">
      <div className="splash-content">
        {/* Animated K Logo — line-draw effect */}
        <div className={`splash-icon ${animStage >= 1 ? 'visible' : ''}`}>
          <svg
            width="88"
            height="88"
            viewBox="0 0 88 88"
            fill="none"
            className={`splash-k-svg ${animStage >= 1 ? 'draw' : ''}`}
          >
            {/* K vertical bar */}
            <path
              className="k-line k-line-1"
              d="M22 14 L22 74"
              stroke="#D97757"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
            {/* K upper arm */}
            <path
              className="k-line k-line-2"
              d="M26 44 L62 14"
              stroke="#D97757"
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
            />
            {/* K lower arm */}
            <path
              className="k-line k-line-3"
              d="M26 44 L62 74"
              stroke="#D97757"
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
            />
            {/* Decorative dot */}
            <circle
              className="k-dot"
              cx="66"
              cy="14"
              r="4"
              fill="#D97757"
            />
          </svg>
        </div>

        {/* App Name */}
        <h1 className={`splash-title ${animStage >= 2 ? 'visible' : ''}`}>
          ISET Classroom
        </h1>

        {/* Tagline */}
        <p className={`splash-tagline ${animStage >= 2 ? 'visible' : ''}`}>
          Learn Anywhere
        </p>

        {/* Progress bar */}
        <div className={`splash-progress ${animStage >= 3 ? 'visible' : ''}`}>
          <div className={`splash-progress-bar ${animStage >= 3 ? 'animate' : ''}`} />
        </div>
      </div>

      {/* Branding */}
      <div className={`splash-branding ${animStage >= 2 ? 'visible' : ''}`}>
        <span>BY AYMEN HM</span>
      </div>
    </div>
  );
}
