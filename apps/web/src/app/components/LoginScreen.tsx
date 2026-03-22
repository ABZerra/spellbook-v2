import { useState } from 'react';
import { useAuth } from '../state/AuthContext';

interface LoginScreenProps {
  onSuccess?: () => void;
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const { login, createAccount, clearPendingNewUser, loginError, pendingNewUser } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;

    setLoading(true);
    const success = await login(trimmed);
    setLoading(false);

    if (success) {
      onSuccess?.();
    }
  }

  async function handleCreate() {
    if (!pendingNewUser) return;
    setLoading(true);
    const success = await createAccount(pendingNewUser);
    setLoading(false);

    if (success) {
      onSuccess?.();
    }
  }

  function handleBack() {
    clearPendingNewUser();
  }

  if (pendingNewUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-sm space-y-4">
          <div className="space-y-1">
            <p className="font-display text-2xl">New user</p>
            <p className="text-sm text-text-muted">
              <span className="font-medium text-text">{pendingNewUser}</span> doesn't have an account yet. Create it?
            </p>
          </div>

          {loginError ? (
            <p className="text-sm text-blood">{loginError}</p>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="flex-1 rounded-lg border border-border-dark px-4 py-2.5 text-sm text-text-muted transition-colors hover:bg-bg-2"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 rounded-lg bg-gold-soft/20 px-4 py-2.5 text-sm text-text transition-colors hover:bg-gold-soft/30 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="space-y-1">
          <p className="font-display text-2xl">Welcome to Spellbook</p>
          <p className="text-sm text-text-muted">Enter or create your username.</p>
        </div>

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoFocus
          disabled={loading}
          className="w-full rounded-lg border border-border-dark bg-bg-1 px-4 py-2.5 text-sm text-text placeholder:text-text-dim focus:border-gold-soft focus:outline-none"
        />

        {loginError ? (
          <p className="text-sm text-blood">{loginError}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="w-full rounded-lg bg-gold-soft/20 px-4 py-2.5 text-sm text-text transition-colors hover:bg-gold-soft/30 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
