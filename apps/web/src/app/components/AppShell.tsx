import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import { useAuth } from '../state/AuthContext';
import { CharacterDropdown } from './CharacterDropdown';
import { CreateCharacterModal } from './CreateCharacterModal';
import { LoginModal } from './LoginModal';
import { SyncIndicator } from './SyncIndicator';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const {
    characters,
    activeCharacter,
    setActiveCharacter,
    catalogClasses,
    createCharacter,
    syncStatus,
  } = useApp();

  const { isAuthenticated, isOffline, logout } = useAuth();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  function handleCreateNew() {
    if (isAuthenticated) {
      setShowCreateModal(true);
    } else {
      setShowLoginModal(true);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border-dark bg-bg-1/92 backdrop-blur">
        <div className="mx-auto w-full max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1.3fr)_auto_280px] xl:items-center">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.34em] text-text-dim">Spellbook</p>
              <p className="font-display text-3xl leading-none md:text-4xl">Plan Your Next Rest</p>
              <p className="max-w-2xl text-sm text-text-muted">
                Browse spells, stage swaps, and lock in a preparation plan without losing track of what is already active.
              </p>
            </div>

            <nav className="flex flex-wrap items-center gap-2 rounded-[1.35rem] border border-border-dark bg-bg/80 p-1.5">
              <NavLink
                to="/catalog"
                className={({ isActive }) => `rounded-xl px-4 py-2 text-sm transition-colors ${isActive ? 'bg-moon-paper text-moon-ink shadow-insetPaper' : 'text-text-muted hover:bg-bg-2 hover:text-text'}`}
              >
                Catalog
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

            <CharacterDropdown
              characters={characters}
              activeCharacterId={activeCharacter?.id ?? null}
              onSelectCharacter={setActiveCharacter}
              onCreateNew={handleCreateNew}
            />

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {isOffline ? (
                  <span className="text-[11px] text-text-dim">Offline</span>
                ) : (
                  <SyncIndicator status={syncStatus} />
                )}
                <button
                  onClick={logout}
                  className="text-xs text-text-dim hover:text-text transition-colors"
                >
                  Log out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:py-8">{children}</main>

      {showLoginModal ? (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowLoginModal(false);
            setShowCreateModal(true);
          }}
        />
      ) : null}

      {showCreateModal ? (
        <CreateCharacterModal
          catalogClasses={catalogClasses}
          onClose={() => setShowCreateModal(false)}
          onCreate={async (input) => {
            await createCharacter(input);
            setShowCreateModal(false);
          }}
          busy={false}
        />
      ) : null}
    </div>
  );
}
