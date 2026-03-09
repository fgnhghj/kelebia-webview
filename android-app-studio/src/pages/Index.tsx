import { useState, useEffect } from "react";

const Index = () => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check connectivity first
    const checkConnection = async () => {
      try {
        // Try fetching the target with a short timeout
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
        // Also check general internet
        if (!navigator.onLine) {
          setIsOffline(true);
          setChecking(false);
        } else {
          // Server might be down but internet works — proceed anyway
          setChecking(false);
          startSplash();
        }
      }
    };

    const startSplash = () => {
      // Smooth CSS-driven progress
      requestAnimationFrame(() => {
        setProgress(100);
      });

      // Start exit animation after 2.2s
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 2200);

      // Redirect after exit animation completes
      const redirectTimer = setTimeout(() => {
        window.location.replace("https://isetkl-classroom.gleeze.com");
      }, 2700);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(redirectTimer);
      };
    };

    checkConnection();

    // Listen for online/offline events
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

  // Offline / Error screen
  if (isOffline) {
    return (
      <div className="h-full w-full relative overflow-hidden bg-splash flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-radial" />
        <div className="relative z-10 flex flex-col items-center text-center px-8">
          {/* Offline icon */}
          <div className="w-20 h-20 rounded-2xl bg-splash-logo/10 border border-splash-logo/15 flex items-center justify-center mb-6 animate-logo-fade-in">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-splash-logo/70"
            >
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          </div>

          <h2 className="logo-font text-xl font-medium text-splash-logo/90 mb-2">
            No Connection
          </h2>
          <p className="text-sm text-splash-logo/40 mb-8 max-w-[260px] leading-relaxed">
            Please check your internet connection and try again
          </p>

          <button
            onClick={retry}
            className="px-8 py-3 rounded-xl bg-splash-logo/10 border border-splash-logo/20 text-splash-logo/80 text-sm font-medium active:scale-95 transition-all duration-200 hover:bg-splash-logo/15"
          >
            Try Again
          </button>
        </div>

        {/* Version */}
        <div className="absolute bottom-8 text-splash-logo/20 text-xs">
          v1.0.0
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative overflow-hidden bg-splash flex flex-col">
      {/* Radial gradient background */}
      <div className="absolute inset-0 bg-radial" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
        <div className="particle particle-4" />
        <div className="particle particle-5" />
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />

        {/* Main content */}
        <div
          className={`relative z-10 flex flex-col items-center ${isExiting ? "animate-splash-exit" : ""
            }`}
        >
          {/* Logo Container */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-splash-logo/5 animate-logo-pulse-glow blur-2xl" />
            </div>
            <div className="animate-logo-fade-in relative">
              <div className="w-24 h-24 rounded-3xl bg-splash-logo/8 border border-splash-logo/15 flex items-center justify-center backdrop-blur-sm shadow-logo">
                <span className="logo-font text-6xl font-medium text-splash-logo tracking-tight">
                  K
                </span>
              </div>
            </div>
          </div>

          {/* Brand name */}
          <div
            className="animate-fade-up opacity-0 mb-3"
            style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
          >
            <h1 className="logo-font text-2xl font-medium tracking-wide shimmer-text">
              Kelebia Classroom
            </h1>
          </div>

          {/* Tagline */}
          <div
            className="animate-fade-up opacity-0 mb-12"
            style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}
          >
            <p className="text-xs text-splash-logo/30 tracking-widest uppercase">
              Learn Anywhere
            </p>
          </div>

          {/* Minimal progress bar */}
          <div
            className="animate-fade-up opacity-0 w-40"
            style={{ animationDelay: "0.6s", animationFillMode: "forwards" }}
          >
            <div className="h-[2px] bg-splash-logo/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-splash-logo/50 via-splash-accent/60 to-splash-logo/50 rounded-full"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  transition: "width 2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Version at bottom */}
      <div
        className="animate-fade-up opacity-0 text-center pb-8"
        style={{ animationDelay: "0.8s", animationFillMode: "forwards" }}
      >
        <span className="text-splash-logo/15 text-[10px] tracking-wider">
          v1.0.0
        </span>
      </div>
    </div>
  );
};

export default Index;
