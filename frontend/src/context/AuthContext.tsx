import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User } from '../types';
import { authApi } from '../api/services';

// Inactivity timeout in milliseconds (15 minutes of inactivity)
export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const LAST_ACTIVE_KEY = 'smartskale_last_active';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  resetInactivityTimer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('smartskale_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('smartskale_token');
  });
  const [loading, setLoading] = useState<boolean>(true);
  const lastActivityRef = useRef<number>(Date.now());

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('smartskale_token');
    localStorage.removeItem('smartskale_user');
    localStorage.removeItem(LAST_ACTIVE_KEY);
  }, []);

  const handleSessionExpired = useCallback(() => {
    logout();
    sessionStorage.setItem('smartskale_session_expired', 'true');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login?reason=session_expired';
    }
  }, [logout]);

  const resetInactivityTimer = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    try {
      localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  // Initial auth load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('smartskale_token');
      if (storedToken) {
        // Check if already expired while page was closed
        const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
        if (lastActiveStr) {
          const lastActive = parseInt(lastActiveStr, 10);
          if (Date.now() - lastActive > INACTIVITY_TIMEOUT_MS) {
            handleSessionExpired();
            setLoading(false);
            return;
          }
        }

        try {
          const currentUser = await authApi.me();
          setUser(currentUser);
          localStorage.setItem('smartskale_user', JSON.stringify(currentUser));
          resetInactivityTimer();
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [handleSessionExpired, logout, resetInactivityTimer]);

  // Inactivity tracking & timer
  useEffect(() => {
    if (!token || !user) return;

    // Record activity timestamp on user interaction (throttled to once every 3s)
    let lastThrottledTime = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastThrottledTime > 3000) {
        lastThrottledTime = now;
        resetInactivityTimer();
      }
    };

    // Check expiration status against latest activity timestamp
    const checkExpiration = () => {
      const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
      const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : lastActivityRef.current;
      if (Date.now() - lastActive > INACTIVITY_TIMEOUT_MS) {
        handleSessionExpired();
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Periodic check every 10 seconds
    const intervalId = setInterval(checkExpiration, 10000);

    // Immediate check when tab becomes visible or focused again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkExpiration();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkExpiration);

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkExpiration);
    };
  }, [token, user, resetInactivityTimer, handleSessionExpired]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('smartskale_token', data.access_token);
    localStorage.setItem('smartskale_user', JSON.stringify(data.user));
    resetInactivityTimer();
    sessionStorage.removeItem('smartskale_session_expired');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        logout,
        resetInactivityTimer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

