import { createContext, useContext, useState, useEffect } from "react";
import api, { authAPI } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      authAPI
        .me()
        .then((res) => setUser(res.data))
        .catch(async () => {
          // Access token may be expired — try silent refresh
          const refresh = localStorage.getItem("refresh_token");
          if (refresh) {
            try {
              const { data } = await import("axios")
                .then((m) => m.default)
                .then((axios) =>
                  axios.post(
                    `${import.meta.env.VITE_API_URL || ""}/api/auth/token/refresh/`,
                    { refresh },
                  ),
                );
              localStorage.setItem("access_token", data.access);
              // H7: Re-fetch user after successful silent refresh
              const meRes = await authAPI.me();
              setUser(meRes.data);
            } catch {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
            }
          } else {
            localStorage.removeItem("access_token");
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, totpCode) => {
    const payload = { email, password };
    if (totpCode) payload.totp_code = totpCode;
    try {
      const { data } = await authAPI.login(payload);
      if (data.requires_2fa) {
        return { requires_2fa: true };
      }
      localStorage.setItem("access_token", data.tokens.access);
      localStorage.setItem("refresh_token", data.tokens.refresh);
      setUser(data.user);
      return data.user;
    } catch (err) {
      if (err.response?.status === 206 && err.response?.data?.requires_2fa) {
        return { requires_2fa: true };
      }
      throw err;
    }
  };

  const signup = async (formData) => {
    const { data } = await authAPI.signup(formData);
    localStorage.setItem("access_token", data.tokens.access);
    localStorage.setItem("refresh_token", data.tokens.refresh);
    setUser(data.user);
    return {
      user: data.user,
      requires_verification: data.requires_verification,
    };
  };

  const logout = async () => {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      // Blacklist the refresh token on the server so it can't be reused
      try {
        await api.post("/auth/token/blacklist/", { refresh });
      } catch {
        /* ignore network errors — tokens are cleared locally regardless */
      }
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await authAPI.me();
    setUser(data);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
