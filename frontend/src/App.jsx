import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './AuthContext';
import { useEffect, useState } from 'react';
import api from './api';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import RoomDetail from './pages/RoomDetail';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Grades from './pages/Grades';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';
import './index.css';
// Note: VerifyEmail removed — signup auto-verifies email

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-page"><div className="skeleton" style={{ width: 200, height: 24 }} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-page"><div className="skeleton" style={{ width: 200, height: 24 }} /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppVersionCheck({ children }) {
  const [lockedData, setLockedData] = useState(null);

  useEffect(() => {
    const checkVersion = () => {
      const userAgent = navigator.userAgent;
      const match = userAgent.match(/KelebiaApp\/([\d.]+)/);

      // If the User-Agent doesn't match KelebiaApp, it means this is a standard web browser (the website).
      // We NEVER lock the website, so we can exit early.
      if (!match) {
        return;
      }

      const currentAppVersion = match[1];

      // Query the specific version's lock status
      api.get(`/app-version/?version=${currentAppVersion}`)
        .then(res => {
          if (res.data.is_locked) {
            setLockedData(res.data);
          } else {
            setLockedData(null);
          }
        })
        .catch(err => console.error('Version check failed:', err));
    };

    checkVersion();
    const interval = setInterval(checkVersion, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  if (lockedData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)', textAlign: 'center', padding: '20px' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>{lockedData.message}</h1>
        <a href={lockedData.update_link} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 20px', background: 'var(--primary)', color: 'white', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold' }}>
          Installer la mise à jour
        </a>
      </div>
    );
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <AppVersionCheck>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
              },
            }}
          />
          <Routes>
            <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/rooms/:id" element={<ProtectedRoute><RoomDetail /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/grades" element={<ProtectedRoute><Grades /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppVersionCheck>
    </AuthProvider>
  );
}

export default App;
