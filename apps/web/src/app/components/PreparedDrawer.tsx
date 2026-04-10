import type { CharacterProfile, SpellRecord } from '../types';

interface PreparedDrawerProps {
  open: boolean;
  onClose: () => void;
  profile: Pick<CharacterProfile, 'preparedSpells'>;
  spellsById: Map<string, SpellRecord>;
  highlightedSpellIds?: Set<string>;
  markedForReplacementIds?: Set<string>;
  onMarkForReplacement?: (spellId: string, assignedList: string) => void;
  onUnmarkForReplacement?: (spellId: string) => void;
}

interface GroupedEntry {
  list: string;
  spells: Array<{ spell: SpellRecord; mode: CharacterProfile['preparedSpells'][number]['mode']; assignedList: string }>;
}

function buildGroups(
  profile: Pick<CharacterProfile, 'preparedSpells'>,
  spellsById: Map<string, SpellRecord>,
): GroupedEntry[] {
  const byList = new Map<string, GroupedEntry['spells']>();

  for (const entry of profile.preparedSpells) {
    const spell = spellsById.get(entry.spellId);
    if (!spell) continue;
    const list = entry.assignedList || 'UNASSIGNED';
    const listEntries = byList.get(list) || [];
    listEntries.push({ spell, mode: entry.mode, assignedList: entry.assignedList });
    byList.set(list, listEntries);
  }

  return [...byList.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([list, spells]) => ({ list, spells }));
}

export function PreparedDrawer({
  open,
  onClose,
  profile,
  spellsById,
  highlightedSpellIds = new Set<string>(),
  markedForReplacementIds = new Set<string>(),
  onMarkForReplacement,
  onUnmarkForReplacement,
}: PreparedDrawerProps) {
  if (!open) return null;

  const groups = buildGroups(profile, spellsById);

  return (
    <div className="fixed inset-0 z-40 bg-black/60" role="dialog" aria-modal="true" aria-label="Current prepared spells">
      <button type="button" className="h-full w-full cursor-default bg-transparent" aria-label="Close current prepared drawer" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl border-l border-moon-border bg-moon-paper p-4 text-moon-ink shadow-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Current Prepared</h2>
          <button
            type="button"
            className="rounded-xl border border-moon-border bg-moon-paper-2 px-3 py-2 text-xs"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <p className="mt-1 text-sm text-moon-ink-muted">Mark spells for replacement here, or use this as a reference while staging changes.</p>

        <div className="mt-4 max-h-[82vh] space-y-4 overflow-y-auto pr-1">
          {groups.map((group) => (
            <section key={group.list} className="space-y-2">
              <h3 className="text-xs uppercase tracking-wide text-moon-ink-muted">{group.list}</h3>
              {group.spells.map(({ spell, mode, assignedList }) => {
                const isMarked = markedForReplacementIds.has(spell.id);
                const isHighlighted = highlightedSpellIds.has(spell.id);
                const showActions = mode !== 'always' && (onMarkForReplacement || onUnmarkForReplacement);

                return (
                  <div
                    key={`${group.list}:${spell.id}:${mode}`}
                    className={`rounded-2xl border px-3 py-3 text-sm transition-opacity ${isMarked ? 'opacity-60' : ''} ${isHighlighted ? 'border-gold-soft bg-gold-soft/15' : 'border-moon-border bg-moon-paper-2'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium text-moon-ink ${isMarked ? 'line-through' : ''}`}>{spell.name}</p>
                          {mode === 'always' ? (
                            <span className="rounded-full border border-gold-soft bg-gold-soft/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-moon-ink-muted">
                              Always Prepared
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-moon-ink-muted">Save: {spell.save || '-'} · Action: {spell.castingTime || '-'}</p>
                      </div>
                      {showActions ? (
                        <button
                          type="button"
                          className="flex-shrink-0 text-[11px] uppercase tracking-[0.18em] text-gold-soft font-semibold transition-colors hover:text-gold"
                          onClick={() => {
                            if (isMarked) {
                              onUnmarkForReplacement?.(spell.id);
                            } else {
                              onMarkForReplacement?.(spell.id, assignedList);
                            }
                          }}
                        >
                          {isMarked ? 'Undo' : 'Replace'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </section>
          ))}

          {!groups.length ? (
            <p className="text-sm text-moon-ink-muted">No prepared spells on this character yet.</p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
