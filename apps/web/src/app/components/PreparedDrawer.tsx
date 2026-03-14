import type { CharacterProfile, SpellRecord } from '../types';

interface PreparedDrawerProps {
  open: boolean;
  onClose: () => void;
  profile: Pick<CharacterProfile, 'preparedSpells'>;
  spellsById: Map<string, SpellRecord>;
  highlightedSpellIds?: Set<string>;
}

interface GroupedEntry {
  list: string;
  spells: SpellRecord[];
}

function buildGroups(
  profile: Pick<CharacterProfile, 'preparedSpells'>,
  spellsById: Map<string, SpellRecord>,
): GroupedEntry[] {
  const byList = new Map<string, SpellRecord[]>();

  for (const entry of profile.preparedSpells) {
    const spell = spellsById.get(entry.spellId);
    if (!spell) continue;
    const list = entry.assignedList || 'UNASSIGNED';
    const listEntries = byList.get(list) || [];
    listEntries.push(spell);
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
}: PreparedDrawerProps) {
  if (!open) return null;

  const groups = buildGroups(profile, spellsById);

  return (
    <div className="fixed inset-0 z-40 bg-black/60" role="dialog" aria-modal="true" aria-label="Current prepared spells">
      <button type="button" className="h-full w-full cursor-default bg-transparent" aria-label="Close current prepared drawer" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl border-l border-border-dark bg-bg-1/95 p-4 shadow-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Current Prepared</h2>
          <button
            type="button"
            className="rounded-lg border border-border-dark bg-bg px-2 py-1 text-xs"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <p className="mt-1 text-sm text-text-muted">Reference view for explicit replacements. Queue stays unchanged behind this drawer.</p>

        <div className="mt-4 max-h-[82vh] space-y-4 overflow-y-auto pr-1">
          {groups.map((group) => (
            <section key={group.list} className="space-y-2">
              <h3 className="text-xs uppercase tracking-wide text-text-dim">{group.list}</h3>
              {group.spells.map((spell) => (
                <div
                  key={spell.id}
                  className={`rounded-xl border px-3 py-2 text-sm ${highlightedSpellIds.has(spell.id) ? 'border-gold-soft bg-gold-soft/15' : 'border-border-dark bg-bg'}`}
                >
                  <p className="font-medium text-text">{spell.name}</p>
                  <p className="text-xs text-text-dim">Save: {spell.save || '-'} · Action: {spell.castingTime || '-'}</p>
                </div>
              ))}
            </section>
          ))}

          {!groups.length ? (
            <p className="text-sm text-text-muted">No prepared spells on this character yet.</p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
