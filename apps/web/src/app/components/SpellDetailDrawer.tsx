import { getSpellLists } from '../domain/character';
import type { CharacterProfile, SpellRecord } from '../types';

interface SpellDetailDrawerProps {
  spell: SpellRecord | null;
  assignedList?: string;
  mode?: CharacterProfile['preparedSpells'][number]['mode'];
  queued?: boolean;
  cannotQueue?: boolean;
  disabledReason?: string;
  onToggleQueue?: (spellId: string) => void | Promise<void>;
  onClose: () => void;
}

function formatSpellLevel(level: number): string {
  if (level === 0) return 'Cantrip';
  return `Level ${level}`;
}

export function SpellDetailDrawer({
  spell,
  assignedList,
  mode,
  queued = false,
  cannotQueue = false,
  disabledReason = '',
  onToggleQueue,
  onClose,
}: SpellDetailDrawerProps) {
  if (!spell) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/55" role="dialog" aria-modal="true" aria-label={`${spell.name} details`}>
      <button type="button" className="h-full w-full cursor-default bg-transparent" aria-label="Close spell details" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl border-l border-moon-border bg-moon-paper p-4 text-moon-ink shadow-panel md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-moon-border bg-moon-paper-2 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-moon-ink-muted">
                {formatSpellLevel(spell.level)}
              </span>
              <span className="rounded-full border border-moon-border bg-moon-paper-2 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-moon-ink-muted">
                {spell.school || 'School Unknown'}
              </span>
              {mode === 'always' ? (
                <span className="rounded-full border border-gold-soft bg-gold-soft/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-moon-ink-muted">
                  Always Prepared
                </span>
              ) : null}
            </div>
            <h2 className="mt-3 break-words font-display text-4xl">{spell.name}</h2>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {onToggleQueue ? (
              <button
                type="button"
                className={`rounded-xl border px-3 py-2 text-xs ${cannotQueue ? 'cursor-not-allowed border-moon-border bg-moon-paper-2 text-moon-ink-muted opacity-60' : queued ? 'border-moon-border bg-moon-ink text-moon-paper' : 'border-moon-border bg-moon-paper-2 text-moon-ink'}`}
                disabled={cannotQueue}
                title={disabledReason}
                aria-label={disabledReason || 'Queue spell for next preparation'}
                onClick={() => void onToggleQueue(spell.id)}
              >
                {queued ? 'Remove From Queue' : cannotQueue ? 'Unavailable' : 'Stage For Prepare'}
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-xl border border-moon-border bg-moon-paper-2 px-3 py-2 text-xs text-moon-ink"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-moon-border bg-moon-paper-2 px-4 py-3 text-sm">
            <p className="text-[11px] uppercase tracking-[0.28em] text-moon-ink-muted">Assigned List</p>
            <p className="mt-2">{assignedList || '-'}</p>
          </div>
          <div className="rounded-2xl border border-moon-border bg-moon-paper-2 px-4 py-3 text-sm">
            <p className="text-[11px] uppercase tracking-[0.28em] text-moon-ink-muted">Available Lists</p>
            <p className="mt-2">{getSpellLists(spell).join(', ') || '-'}</p>
          </div>
          <div className="rounded-2xl border border-moon-border bg-moon-paper-2 px-4 py-3 text-sm">
            <p className="text-[11px] uppercase tracking-[0.28em] text-moon-ink-muted">Casting Time</p>
            <p className="mt-2">{spell.castingTime || '-'}</p>
          </div>
          <div className="rounded-2xl border border-moon-border bg-moon-paper-2 px-4 py-3 text-sm">
            <p className="text-[11px] uppercase tracking-[0.28em] text-moon-ink-muted">Duration</p>
            <p className="mt-2">{spell.duration || '-'}</p>
          </div>
          <div className="rounded-2xl border border-moon-border bg-moon-paper-2 px-4 py-3 text-sm">
            <p className="text-[11px] uppercase tracking-[0.28em] text-moon-ink-muted">Range</p>
            <p className="mt-2">{spell.rangeArea || '-'}</p>
          </div>
          <div className="rounded-2xl border border-moon-border bg-moon-paper-2 px-4 py-3 text-sm">
            <p className="text-[11px] uppercase tracking-[0.28em] text-moon-ink-muted">Components</p>
            <p className="mt-2">{spell.components || '-'}</p>
          </div>
        </div>

        <div className="mt-5 rounded-[1.4rem] border border-moon-border bg-moon-paper-2 px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-moon-ink-muted">Rules Text</p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-moon-ink-muted">
            {spell.description || spell.notes || 'No details recorded.'}
          </p>
        </div>
      </aside>
    </div>
  );
}
