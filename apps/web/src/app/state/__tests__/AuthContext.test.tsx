import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import React from 'react';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const storage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = value; },
  removeItem: (key: string) => { delete storage[key]; },
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

// Default: ping check returns 404 (server is up but user doesn't exist — normal)
function mockPing() {
  mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(storage).forEach((key) => delete storage[key]);
  });

  it('starts unauthenticated', () => {
    mockPing();
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userId).toBeNull();
  });

  it('login succeeds and stores userId', async () => {
    mockPing();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ characters: [], sha: null }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginResult: boolean = false;
    await act(async () => {
      loginResult = await result.current.login('alice');
    });

    expect(loginResult).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userId).toBe('alice');
    expect(storage['spellbook.userId']).toBe('alice');
  });

  it('login fails for unknown user and sets pendingNewUser', async () => {
    mockPing();
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginResult: boolean = true;
    await act(async () => {
      loginResult = await result.current.login('nobody');
    });

    expect(loginResult).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.pendingNewUser).toBe('nobody');
  });

  it('logout clears state', async () => {
    mockPing();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ characters: [], sha: null }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('alice');
    });
    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userId).toBeNull();
    expect(storage['spellbook.userId']).toBeUndefined();
  });

  it('restores session from localStorage on mount', () => {
    mockPing();
    storage['spellbook.userId'] = 'bob';

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userId).toBe('bob');
  });

  it('detects server unavailable when ping fails after retries', async () => {
    // fetchWithRetry retries up to 2 times (3 total attempts)
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for retries to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.serverAvailable).toBe(false);
    mockFetch.mockReset();
  });
});
