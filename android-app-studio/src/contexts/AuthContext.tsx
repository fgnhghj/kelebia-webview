import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, authAPI, notificationsAPI } from '../api/client';

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'teacher' | 'student';
  avatar: string | null;
  bio: string;
  institution: string;
  email_verified: boolean;
  is_2fa_enabled: boolean;
  date_joined: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  unreadCount: number;
  login: (email: string, password: string, totpCode?: string) => Promise<{ requires_2fa?: boolean }>;
  signup: (data: { first_name: string; last_name: string; email: string; password: string; role: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  isTeacher: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authAPI.me();
      setUser(userData);
    } catch {
      setUser(null);
      api.clearTokens();
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await notificationsAPI.unreadCount();
      setUnreadCount(data.count);
    } catch {
      // Silently fail
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    const init = async () => {
      if (api.hasTokens()) {
        try {
          const userData = await authAPI.me();
          setUser(userData);
          const notifData = await notificationsAPI.unreadCount();
          setUnreadCount(notifData.count);
        } catch {
          api.clearTokens();
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  // Poll notifications every 30s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, refreshNotifications]);

  const login = async (email: string, password: string, totpCode?: string) => {
    const data = await authAPI.login({ email, password, totp_code: totpCode });
    if (data.requires_2fa) {
      return { requires_2fa: true };
    }
    api.setTokens(data.tokens.access, data.tokens.refresh);
    setUser(data.user);
    refreshNotifications();
    return {};
  };

  const signup = async (signupData: { first_name: string; last_name: string; email: string; password: string; role: string }) => {
    const data = await authAPI.signup(signupData);
    api.setTokens(data.tokens.access, data.tokens.refresh);
    setUser(data.user);
  };

  const logout = () => {
    api.clearTokens();
    setUser(null);
    setUnreadCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        unreadCount,
        login,
        signup,
        logout,
        refreshUser,
        refreshNotifications,
        isTeacher: user?.role === 'teacher',
        isStudent: user?.role === 'student',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
