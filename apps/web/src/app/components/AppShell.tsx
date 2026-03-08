import { NavLink } from 'react-router-dom';
import { useApp } from '../state/AppContext';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const {
    characters,
    activeCharacter,
    setActiveCharacter,
    runtime,
  } = useApp();

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border-dark bg-bg-1/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="min-w-[180px] flex-1">
            <p className="font-display text-2xl leading-none">Spellbook</p>
            <p className="text-xs text-text-muted">Character-centric planning flow ({runtime})</p>
          </div>

          <nav className="flex items-center gap-2 rounded-full border border-border-dark bg-bg px-2 py-1">
            <NavLink to="/catalog" className={({ isActive }) => `rounded-full px-3 py-1 text-sm ${isActive ? 'bg-gold-soft/25 text-text' : 'text-text-muted'}`}>
              Catalog
            </NavLink>
            <NavLink to="/prepare" className={({ isActive }) => `rounded-full px-3 py-1 text-sm ${isActive ? 'bg-gold-soft/25 text-text' : 'text-text-muted'}`}>
              Prepare
            </NavLink>
            <NavLink to="/character" className={({ isActive }) => `rounded-full px-3 py-1 text-sm ${isActive ? 'bg-gold-soft/25 text-text' : 'text-text-muted'}`}>
              Character
            </NavLink>
          </nav>

          <label className="flex min-w-[220px] items-center gap-2 text-sm text-text-muted">
            <span>Active</span>
            <select
              className="w-full rounded-xl border border-border-dark bg-bg px-3 py-2 text-text"
              value={activeCharacter?.id || ''}
              onChange={(event) => setActiveCharacter(event.target.value)}
              aria-label="Active character"
            >
              {characters.map((character) => (
                <option key={character.id} value={character.id}>{character.name}</option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
