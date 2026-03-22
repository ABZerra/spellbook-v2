import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const USER_ID_KEY = 'spellbook.userId';

interface AuthContextValue {
  userId: string | null;
  isAuthenticated: boolean;
  loginError: string | null;
  pendingNewUser: string | null;
  login: (username: string) => Promise<boolean>;
  createAccount: (username: string) => Promise<boolean>;
  clearPendingNewUser: () => void;
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

export function AuthProvider({ children }: AuthProviderProps) {
  const [userId, setUserId] = useState<string | null>(getPersistedUserId);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pendingNewUser, setPendingNewUser] = useState<string | null>(null);

  const login = useCallback(async (username: string): Promise<boolean> => {
    setLoginError(null);
    setPendingNewUser(null);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username.toLowerCase())}/characters`);
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
      const res = await fetch('/api/users', {
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

  const logout = useCallback(() => {
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem('spellbook.activeCharacter');
    setUserId(null);
    setLoginError(null);
    setPendingNewUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    userId,
    isAuthenticated: userId !== null,
    loginError,
    pendingNewUser,
    login,
    createAccount,
    clearPendingNewUser,
    logout,
  }), [userId, loginError, pendingNewUser, login, createAccount, clearPendingNewUser, logout]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
