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
    }, 2400);
    return () => clearTimeout(timeout);
  }, [loading, user, navigate]);

  return (
    <div className="splash-screen">
      <div className="splash-content">
        {/* Logo Icon */}
        <div className={`splash-icon ${animStage >= 1 ? 'visible' : ''}`}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <rect width="72" height="72" rx="18" fill="#D97757" fillOpacity="0.12" />
            <path
              d="M16 18H26V54H16ZM26 26L56 18V27L26 36ZM26 36L56 45V54L26 46Z"
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

        {/* Progress */}
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
