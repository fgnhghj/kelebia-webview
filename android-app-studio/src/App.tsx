import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { appVersionAPI } from "./api/client";
import { Copy, Compass, Bell, BookOpen, Settings as SettingsIcon } from "lucide-react";
import ErrorBoundary from "./components/ErrorBoundary";
import AppLayout from "./components/AppLayout";
import SplashScreen from "./pages/SplashScreen";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";

function AppVersionCheck({ children }: { children: React.ReactNode }) {
  const [lockedData, setLockedData] = useState<{ is_locked: boolean; message?: string; update_link?: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkVersion() {
      // If running on the web, bypass version locking entirely.
      if (!Capacitor.isNativePlatform()) {
        setChecking(false);
        return;
      }

      try {
        const info = await CapApp.getInfo();
        // Send the native app version to the backend to see if it was forcibly locked
        const response = await appVersionAPI.checkLock(info.version);
        if (response.is_locked) {
          setLockedData(response);
        }
      } catch (err) {
        console.warn("Failed to check app version lock status", err);
      } finally {
        setChecking(false);
      }
    }
    checkVersion();
  }, []);

  if (checking) {
    return <LoadingScreen />;
  }

  if (lockedData) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#1A1714] text-white p-6 text-center z-[9999]">
        <div className="w-20 h-20 mb-6 rounded-full bg-[#D97757]/20 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D97757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4">Mise à jour requise</h1>
        <p className="text-white/70 mb-8 max-w-sm">
          {lockedData.message || "Votre version de l'application n'est plus supportée. Veuillez la mettre à jour pour continuer."}
        </p>
        <a
          href={lockedData.update_link || "https://isetkl-classroom.gleeze.com"}
          className="bg-[#D97757] hover:bg-[#D97757]/90 text-white font-medium py-3 px-8 rounded-full transition-colors"
        >
          Télécharger la mise à jour
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
import RoomDetail from "./pages/RoomDetail";
import AssignmentDetail from "./pages/AssignmentDetail";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import JoinRoom from "./pages/JoinRoom";
import CreateRoom from "./pages/CreateRoom";
import Grades from "./pages/Grades";
import FileViewer from "./pages/FileViewer";

function LoadingScreen() {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-icon visible">
          <svg width="88" height="88" viewBox="0 0 88 88" fill="none" className="splash-k-svg draw">
            <path className="k-line k-line-1" d="M22 14 L22 74" stroke="#D97757" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path className="k-line k-line-2" d="M26 44 L62 14" stroke="#D97757" strokeWidth="7" strokeLinecap="round" fill="none" />
            <path className="k-line k-line-3" d="M26 44 L62 74" stroke="#D97757" strokeWidth="7" strokeLinecap="round" fill="none" />
            <circle className="k-dot" cx="66" cy="14" r="4" fill="#D97757" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

const App = () => {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.show();
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: "#1A1714" });
      StatusBar.setOverlaysWebView({ overlay: false });

      const handler = CapApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          CapApp.exitApp();
        }
      });
      return () => { handler.then(h => h.remove()); };
    }
  }, []);

  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AppVersionCheck>
              <div className="ambient-bg">
                <div className="ambient-orb orb-1" />
                <div className="ambient-orb orb-2" />
                <div className="ambient-orb orb-3" />
              </div>
              <Routes>
                {/* Splash */}
                <Route path="/" element={<SplashScreen />} />

                {/* Auth (guest only) */}
                <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Main App (protected, with bottom nav) */}
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/home" element={<Home />} />
                  <Route path="/explore" element={<JoinRoom />} />
                  <Route path="/grades" element={<Grades />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                {/* Detail pages (protected, no bottom nav) */}
                <Route path="/room/create" element={<ProtectedRoute><CreateRoom /></ProtectedRoute>} />
                <Route path="/room/:id" element={<ProtectedRoute><RoomDetail /></ProtectedRoute>} />
                <Route path="/room/:id/assignment/:assignmentId" element={<ProtectedRoute><AssignmentDetail /></ProtectedRoute>} />
                <Route path="/file-view" element={<ProtectedRoute><FileViewer /></ProtectedRoute>} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppVersionCheck>
          </ErrorBoundary>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;
