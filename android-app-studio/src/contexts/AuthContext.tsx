import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
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
  const prevUnreadRef = useRef(0);
  const permissionRequested = useRef(false);

  /* ─── Request notification permission on native ── */
  const requestNotificationPermission = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const { display } = await LocalNotifications.checkPermissions();
      if (display === 'granted') return;
      // Ask every time the app finds the user hasn't granted
      await LocalNotifications.requestPermissions();
    } catch { /* ignore on web */ }
  }, []);

  /* ─── Fire a local notification when new unread arrives ── */
  const fireLocalNotification = useCallback(async (title: string, body: string) => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const { display } = await LocalNotifications.checkPermissions();
      if (display !== 'granted') {
        if (!permissionRequested.current) {
          permissionRequested.current = true;
          const res = await LocalNotifications.requestPermissions();
          if (res.display !== 'granted') return;
        } else {
          return;
        }
      }
      // Android notification id must be a 32-bit int
      const id = Math.floor(Math.random() * 2147483646) + 1;
      await LocalNotifications.schedule({
        notifications: [{
          title,
          body,
          id,
          smallIcon: 'ic_notification',
          largeIcon: 'ic_launcher',
          iconColor: '#D4845A',
        }],
      });
    } catch (e) { console.warn('LocalNotif error', e); }
  }, []);

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
      const newCount = data.count ?? 0;

      // If unread count increased → new notification arrived
      if (newCount > prevUnreadRef.current && prevUnreadRef.current >= 0) {
        // Fetch latest notification to get real title/message
        try {
          const list = await notificationsAPI.list();
          const latest = Array.isArray(list) ? list.find((n: any) => !n.is_read) : null;
          if (latest) {
            fireLocalNotification(latest.title || 'ISET Classroom', latest.message || 'New notification');
          } else {
            fireLocalNotification('ISET Classroom', `${newCount - prevUnreadRef.current} new notification(s)`);
          }
        } catch {
          fireLocalNotification('ISET Classroom', `${newCount - prevUnreadRef.current} new notification(s)`);
        }
      }
      prevUnreadRef.current = newCount;
      setUnreadCount(newCount);
    } catch {
      // Silently fail
    }
  }, [fireLocalNotification]);

  // Check auth on mount
  useEffect(() => {
    const init = async () => {
      if (api.hasTokens()) {
        try {
          const userData = await authAPI.me();
          setUser(userData);
          // Request notification permission early
          requestNotificationPermission();
          const notifData = await notificationsAPI.unreadCount();
          const count = notifData.count ?? 0;
          prevUnreadRef.current = count; // seed so first poll doesn't fire
          setUnreadCount(count);
        } catch {
          api.clearTokens();
        }
      }
      setLoading(false);
    };
    init();
  }, [requestNotificationPermission]);

  // Poll notifications every 30s + re-request permission if not granted
  useEffect(() => {
    if (!user) return;
    const poll = async () => {
      // Re-ask permission every time if user hasn't granted
      await requestNotificationPermission();
      await refreshNotifications();
    };
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [user, refreshNotifications, requestNotificationPermission]);

  const login = async (email: string, password: string, totpCode?: string) => {
    const data = await authAPI.login({ email, password, totp_code: totpCode });
    if (data.requires_2fa) {
      return { requires_2fa: true };
    }
    api.setTokens(data.tokens.access, data.tokens.refresh);
    setUser(data.user);
    // Request notification permission on login
    requestNotificationPermission();
    // Seed the previous count so the first poll doesn't fire a notification
    const notifData = await notificationsAPI.unreadCount();
    prevUnreadRef.current = notifData.count ?? 0;
    setUnreadCount(notifData.count ?? 0);
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
    prevUnreadRef.current = 0;
    permissionRequested.current = false;
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
