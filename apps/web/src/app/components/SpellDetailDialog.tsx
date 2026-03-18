import { getSpellAssignmentList, getSpellLists } from '../domain/character';
import type { CharacterProfile, SpellRecord } from '../types';

interface SpellDetailDialogProps {
  spell: SpellRecord | null;
  activeCharacter: CharacterProfile | null;
  queued: boolean;
  cannotQueue: boolean;
  disabledReason: string;
  onToggleQueue: (spellId: string) => void | Promise<void>;
  onClose: () => void;
}

function formatSpellLevel(level: number): string {
  if (level === 0) return 'Cantrip';
  return `Level ${level}`;
}

function getSpellExcerpt(notes: string, description: string): string {
  const source = notes.trim() || description.trim();
  if (!source) return 'Open the detail view for the full rules text.';
  const sentence = source.split(/(?<=[.!?])\s+/)[0] || source;
  return sentence.length > 150 ? `${sentence.slice(0, 147)}...` : sentence;
}

export function SpellDetailDialog({
  spell,
  activeCharacter,
  queued,
  cannotQueue,
  disabledReason,
  onToggleQueue,
  onClose,
}: SpellDetailDialogProps) {
  if (!spell) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-black/65 p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`${spell.name} details`}
      onClick={onClose}
    >
      <section
        className="mx-auto max-h-full max-w-4xl overflow-y-auto rounded-[1.85rem] border border-moon-border bg-moon-paper p-5 text-moon-ink md:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-moon-border bg-moon-paper-2 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-moon-ink-muted">
                {formatSpellLevel(spell.level)}
              </span>
              <span className="rounded-full border border-moon-border bg-moon-paper-2 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-moon-ink-muted">
                {spell.school || 'School Unknown'}
              </span>
            </div>
            <h2 className="font-display text-4xl">{spell.name}</h2>
            <p className="max-w-2xl text-sm text-moon-ink-muted">
              {getSpellExcerpt(spell.notes || '', spell.description || '')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`rounded-2xl border px-4 py-2.5 text-sm ${cannotQueue ? 'cursor-not-allowed border-moon-border bg-moon-paper-2 text-moon-ink-muted opacity-60' : queued ? 'border-moon-border bg-moon-ink text-moon-paper' : 'border-moon-border bg-moon-paper-2 text-moon-ink'}`}
              disabled={cannotQueue}
              title={disabledReason}
              aria-label={disabledReason || 'Queue spell for next preparation'}
              onClick={() => void onToggleQueue(spell.id)}
            >
              {queued ? 'Remove From Queue' : cannotQueue ? 'Unavailable' : 'Stage For Prepare'}
            </button>
            <button
              type="button"
              className="rounded-2xl border border-moon-border bg-transparent px-4 py-2.5 text-sm text-moon-ink"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-moon-border bg-moon-paper-2 px-4 py-3 text-sm">
            <p className="text-[11px] uppercase tracking-[0.28em] text-moon-ink-muted">Lists</p>
            <p className="mt-2">{getSpellLists(spell).join(', ') || '-'}</p>
          </div>
          <div className="rounded-2xl border border-moon-border bg-moon-paper-2 px-4 py-3 text-sm">
            <p className="text-[11px] uppercase tracking-[0.28em] text-moon-ink-muted">Assigned List</p>
            <p className="mt-2">{activeCharacter ? (getSpellAssignmentList(spell, activeCharacter) || '-') : '-'}</p>
          </div>
          <div className="rounded-2xl border border-moon-border bg-moon-paper-2 px-4 py-3 text-sm">
            <p className="text-[11px] uppercase tracking-[0.28em] text-moon-ink-muted">Casting</p>
            <p className="mt-2">{spell.castingTime || '-'}</p>
          </div>
          <div className="rounded-2xl border border-moon-border bg-moon-paper-2 px-4 py-3 text-sm">
            <p className="text-[11px] uppercase tracking-[0.28em] text-moon-ink-muted">Save</p>
            <p className="mt-2">{spell.save || '-'}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-moon-border bg-moon-paper-2 px-4 py-3 text-sm">
            <p className="text-[11px] uppercase tracking-[0.28em] text-moon-ink-muted">Range</p>
            <p className="mt-2">{spell.rangeArea || '-'}</p>
          </div>
          <div className="rounded-2xl border border-moon-border bg-moon-paper-2 px-4 py-3 text-sm">
            <p className="text-[11px] uppercase tracking-[0.28em] text-moon-ink-muted">Duration</p>
            <p className="mt-2">{spell.duration || '-'}</p>
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
      </section>
    </div>
  );
}
