import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import ErrorBoundary from "./components/ErrorBoundary";
import UpdateBlocker from "./components/UpdateBlocker";
import AppLayout from "./components/AppLayout";
import SplashScreen from "./pages/SplashScreen";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import RoomDetail from "./pages/RoomDetail";
import AssignmentDetail from "./pages/AssignmentDetail";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import JoinRoom from "./pages/JoinRoom";
import CreateRoom from "./pages/CreateRoom";
import Grades from "./pages/Grades";
import FileViewer from "./pages/FileViewer";
import { versionAPI, APP_VERSION } from "./api/client";

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
  const [updateInfo, setUpdateInfo] = useState<{
    needs_update: boolean;
    message: string;
    update_url: string;
    min_version: string;
  } | null>(null);

  useEffect(() => {
    // Check app version on launch
    versionAPI.check(APP_VERSION)
      .then((data) => {
        if (data.needs_update) {
          setUpdateInfo(data);
        }
      })
      .catch(() => {
        // Silently ignore — don't block the app if the server is unreachable
      });
  }, []);

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

  // Show blocking update screen if version is locked
  if (updateInfo?.needs_update) {
    return (
      <LanguageProvider>
        <UpdateBlocker
          message={updateInfo.message}
          updateUrl={updateInfo.update_url}
          minVersion={updateInfo.min_version}
        />
      </LanguageProvider>
    );
  }

  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
        <ErrorBoundary>
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
        </ErrorBoundary>
      </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;
