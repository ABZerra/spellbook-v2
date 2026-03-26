import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchWithRetry } from './fetchWithRetry.js';

const USER_ID_KEY = 'spellbook.userId';

interface AuthContextValue {
  userId: string | null;
  isAuthenticated: boolean;
  isOffline: boolean;
  serverAvailable: boolean | null;
  loginError: string | null;
  pendingNewUser: string | null;
  login: (username: string) => Promise<boolean>;
  createAccount: (username: string) => Promise<boolean>;
  clearPendingNewUser: () => void;
  goOffline: () => void;
  logout: () => void;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

function getPersistedUserId(): string | null {
  const value = localStorage.getItem(USER_ID_KEY);
  return value ? value.trim() || null : null;
}

export function useAuth() {
  const value = useContext(AuthCtx);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const OFFLINE_USER_ID = '__offline__';

export function AuthProvider({ children }: AuthProviderProps) {
  const persisted = getPersistedUserId();
  const [userId, setUserId] = useState<string | null>(persisted);
  const [isOffline, setIsOffline] = useState(persisted === OFFLINE_USER_ID);
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pendingNewUser, setPendingNewUser] = useState<string | null>(null);

  // Check if API server is reachable on mount
  useEffect(() => {
    if (isOffline) return;
    fetchWithRetry('/api/users/__ping__/characters', { method: 'GET' })
      .then((res) => {
        // 404 = server is up (user just doesn't exist). 500 = proxy error (server down).
        setServerAvailable(res.status !== 500);
      })
      .catch(() => {
        setServerAvailable(false);
      });
  }, [isOffline]);

  const login = useCallback(async (username: string): Promise<boolean> => {
    setLoginError(null);
    setPendingNewUser(null);
    try {
      const res = await fetchWithRetry(`/api/users/${encodeURIComponent(username.toLowerCase())}/characters`);
      if (!res.ok) {
        if (res.status === 404) {
          setPendingNewUser(username);
        } else {
          setLoginError('Login failed. Try again.');
        }
        return false;
      }
      localStorage.setItem(USER_ID_KEY, username.toLowerCase());
      setUserId(username.toLowerCase());
      return true;
    } catch {
      setLoginError('Could not connect to server.');
      return false;
    }
  }, []);

  const createAccount = useCallback(async (username: string): Promise<boolean> => {
    setLoginError(null);
    try {
      const res = await fetchWithRetry('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) {
        if (res.status === 409) {
          setLoginError('Username already exists.');
        } else {
          setLoginError('Account creation failed. Try again.');
        }
        return false;
      }
      setPendingNewUser(null);
      const id = username.toLowerCase();
      localStorage.setItem(USER_ID_KEY, id);
      setUserId(id);
      return true;
    } catch {
      setLoginError('Could not connect to server.');
      return false;
    }
  }, []);

  const clearPendingNewUser = useCallback(() => {
    setPendingNewUser(null);
    setLoginError(null);
  }, []);

  const goOffline = useCallback(() => {
    localStorage.setItem(USER_ID_KEY, OFFLINE_USER_ID);
    setUserId(OFFLINE_USER_ID);
    setIsOffline(true);
    setLoginError(null);
    setPendingNewUser(null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem('spellbook.activeCharacter');
    setUserId(null);
    setIsOffline(false);
    setLoginError(null);
    setPendingNewUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    userId: isOffline ? OFFLINE_USER_ID : userId,
    isAuthenticated: userId !== null,
    isOffline,
    serverAvailable,
    loginError,
    pendingNewUser,
    login,
    createAccount,
    clearPendingNewUser,
    goOffline,
    logout,
  }), [userId, isOffline, serverAvailable, loginError, pendingNewUser, login, createAccount, clearPendingNewUser, goOffline, logout]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
