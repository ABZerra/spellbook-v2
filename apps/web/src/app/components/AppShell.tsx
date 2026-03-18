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
  } = useApp();

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border-dark bg-bg-1/92 backdrop-blur">
        <div className="mx-auto w-full max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1.3fr)_auto_280px] xl:items-center">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.34em] text-text-dim">Spellbook</p>
              <div className="flex flex-wrap items-end gap-3">
                <p className="font-display text-3xl leading-none md:text-4xl">Plan Your Next Rest</p>
                {activeCharacter ? (
                  <span className="rounded-full border border-gold-soft bg-gold-soft/12 px-3 py-1 text-xs uppercase tracking-[0.2em] text-text-muted">
                    {activeCharacter.name}
                  </span>
                ) : null}
              </div>
              <p className="max-w-2xl text-sm text-text-muted">
                Browse spells, stage swaps, and lock in a preparation plan without losing track of what is already active.
              </p>
            </div>

            <nav className="flex flex-wrap items-center gap-2 rounded-[1.35rem] border border-border-dark bg-bg/80 p-1.5">
              <NavLink
                to="/catalog"
                className={({ isActive }) => `rounded-xl px-4 py-2 text-sm transition-colors ${isActive ? 'bg-moon-paper text-moon-ink shadow-insetPaper' : 'text-text-muted hover:bg-bg-2 hover:text-text'}`}
              >
                Browse
              </NavLink>
              <NavLink
                to="/prepare"
                className={({ isActive }) => `rounded-xl px-4 py-2 text-sm transition-colors ${isActive ? 'bg-moon-paper text-moon-ink shadow-insetPaper' : 'text-text-muted hover:bg-bg-2 hover:text-text'}`}
              >
                Prepare
              </NavLink>
              <NavLink
                to="/character"
                className={({ isActive }) => `rounded-xl px-4 py-2 text-sm transition-colors ${isActive ? 'bg-moon-paper text-moon-ink shadow-insetPaper' : 'text-text-muted hover:bg-bg-2 hover:text-text'}`}
              >
                Character
              </NavLink>
            </nav>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[11px] uppercase tracking-[0.28em] text-text-dim">Active Character</span>
              <select
                className="w-full rounded-2xl border border-border-dark bg-bg px-3 py-2.5 text-text"
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:py-8">{children}</main>
    </div>
  );
}
