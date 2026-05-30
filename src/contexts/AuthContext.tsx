import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  provider: 'google' | 'github';
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAuthenticated: false,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const API_BASE = window.location.port === '8000'
  ? ''
  : `${window.location.protocol}//${window.location.hostname}:8000`;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('auth_token');

    if (authToken) {
      // Remove the token from the URL immediately so it doesn't linger
      window.history.replaceState({}, '', window.location.pathname);

      // Exchange the URL token for a proper HttpOnly cookie via the backend
      fetch(`${API_BASE}/api/auth/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: authToken }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setUser(data ?? null))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      // Normal page load — check if there's already a session cookie
      fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setUser(data ?? null))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
