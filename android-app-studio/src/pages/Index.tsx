import { useState, useEffect } from "react";

const Index = () => {
  const [phase, setPhase] = useState<"loading" | "exiting" | "done">("loading");
  const [isOffline, setIsOffline] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch("https://isetkl-classroom.gleeze.com", {
          method: "HEAD",
          mode: "no-cors",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        setChecking(false);
        startSplash();
      } catch {
        if (!navigator.onLine) {
          setIsOffline(true);
          setChecking(false);
        } else {
          setChecking(false);
          startSplash();
        }
      }
    };

    const startSplash = () => {
      const exitTimer = setTimeout(() => setPhase("exiting"), 2400);
      const redirectTimer = setTimeout(() => {
        setPhase("done");
        window.location.replace("https://isetkl-classroom.gleeze.com");
      }, 3000);
      return () => {
        clearTimeout(exitTimer);
        clearTimeout(redirectTimer);
      };
    };

    checkConnection();

    const handleOnline = () => {
      setIsOffline(false);
      setChecking(true);
      checkConnection();
    };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const retry = () => {
    setIsOffline(false);
    setChecking(true);
    window.location.reload();
  };

  // ──── Offline screen ────
  if (isOffline) {
    return (
      <div className="splash-container">
        <div className="splash-content">
          {/* Wifi-off icon */}
          <div className="splash-icon-offline">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          </div>
          <h2 className="splash-offline-title">No Connection</h2>
          <p className="splash-offline-desc">
            Check your internet connection and try again
          </p>
          <button onClick={retry} className="splash-retry-btn">
            Try Again
          </button>
        </div>
        <div className="splash-footer">v1.0.0</div>
      </div>
    );
  }

  // ──── Splash screen (Claude-style) ────
  return (
    <div className="splash-container">
      <div className={`splash-content ${phase === "exiting" ? "splash-exit" : ""}`}>
        {/* App icon */}
        <div className="splash-logo-wrap">
          <img
            src="/app-icon.png"
            alt="K"
            className="splash-logo-img"
          />
        </div>

        {/* App name */}
        <h1 className="splash-title">
          <span className="splash-title-icon">✦</span>
          {" "}Kelebia Classroom
        </h1>
      </div>

      {/* Bottom branding */}
      <div className={`splash-bottom ${phase === "exiting" ? "splash-exit" : ""}`}>
        <span className="splash-byline">BY KELEBIA</span>
      </div>
    </div>
  );
};

export default Index;
  );
};

export default Index;
