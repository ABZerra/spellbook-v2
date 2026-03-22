import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const USER_ID_KEY = 'spellbook.userId';

interface AuthContextValue {
  userId: string | null;
  isAuthenticated: boolean;
  loginError: string | null;
  login: (username: string) => Promise<boolean>;
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

  const login = useCallback(async (username: string): Promise<boolean> => {
    setLoginError(null);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}/characters`);
      if (!res.ok) {
        if (res.status === 404) {
          setLoginError('Username not found.');
        } else {
          setLoginError('Login failed. Try again.');
        }
        return false;
      }
      localStorage.setItem(USER_ID_KEY, username);
      setUserId(username);
      return true;
    } catch {
      setLoginError('Could not connect to server.');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem('spellbook.activeCharacter');
    setUserId(null);
    setLoginError(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    userId,
    isAuthenticated: userId !== null,
    loginError,
    login,
    logout,
  }), [userId, loginError, login, logout]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
