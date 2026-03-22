import { useState } from 'react';
import { useAuth } from '../state/AuthContext';

interface LoginScreenProps {
  onSuccess?: () => void;
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const { login, loginError } = useAuth();
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

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="space-y-1">
          <p className="font-display text-2xl">Welcome to Spellbook</p>
          <p className="text-sm text-text-muted">Enter your username to access your characters.</p>
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
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
