import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function SplashScreen() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [animStage, setAnimStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setAnimStage(1), 80);
    const t2 = setTimeout(() => setAnimStage(2), 420);
    const t3 = setTimeout(() => setAnimStage(3), 920);
    const t4 = setTimeout(() => setAnimStage(4), 1400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const timeout = setTimeout(() => {
      if (user) {
        navigate("/home", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }, 2800);

    return () => clearTimeout(timeout);
  }, [loading, user, navigate]);

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className={`splash-emblem ${animStage >= 1 ? "visible" : ""}`}>
          <div className="splash-icon-card">
            <div className={`splash-icon ${animStage >= 1 ? "visible" : ""}`}>
              <svg
                width="92"
                height="92"
                viewBox="0 0 88 88"
                fill="none"
                className={`splash-k-svg ${animStage >= 1 ? "draw" : ""}`}
              >
                <path className="k-line k-line-1" d="M26 18 L26 70" />
                <path className="k-line k-line-2" d="M26 44 L58 18" />
                <path className="k-line k-line-3" d="M34 38 L58 70" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`splash-text-block ${animStage >= 2 ? "visible" : ""}`}>
          <div className="splash-badge">Kelebia Classroom</div>

          <h1 className={`splash-title ${animStage >= 2 ? "visible" : ""}`}>
            <span className="splash-title-main">ISET Classroom</span>
            <span className="splash-title-shine" />
          </h1>

          <div className={`splash-tagline ${animStage >= 3 ? "visible" : ""}`}>
            BETA
          </div>
        </div>

        <div className={`splash-loader ${animStage >= 4 ? "visible" : ""}`}>
          <div className="splash-progress">
            <div
              className={`splash-progress-bar ${animStage >= 4 ? "animate" : ""}`}
            />
          </div>

          <div className="splash-loading-dots" aria-hidden="true">
            <span className="splash-dot" />
            <span className="splash-dot" />
            <span className="splash-dot" />
          </div>
        </div>
      </div>

      <div className={`splash-branding ${animStage >= 3 ? "visible" : ""}`}>
        <span className="splash-branding-line" />
        <span>BY AYMEN HM</span>
        <span className="splash-branding-line" />
      </div>
    </div>
  );
}
