import { useMemo, useState } from 'react';
import { getAddableAssignmentLists, getSpellAssignmentList, getSpellLists, isSpellEligibleForCharacter } from '../domain/character';
import { useApp } from '../state/AppContext';
import type { SpellRecord } from '../types';

function matchesSearch(spell: SpellRecord, query: string): boolean {
  const q = query.toLowerCase();
  if (!q) return true;
  return (
    spell.name.toLowerCase().includes(q)
    || spell.notes.toLowerCase().includes(q)
    || spell.description.toLowerCase().includes(q)
  );
}

export function CatalogPage() {
  const {
    spells,
    activeCharacter,
    queueSpellForNextPreparation,
    unqueueSpellForNextPreparation,
    isSpellQueuedForNextPreparation,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedSpellId, setSelectedSpellId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedSpell = useMemo(
    () => spells.find((entry) => entry.id === selectedSpellId) || null,
    [spells, selectedSpellId],
  );
  const selectedSpellQueued = selectedSpell ? isSpellQueuedForNextPreparation(selectedSpell.id) : false;
  const selectedSpellAddableLists = selectedSpell && activeCharacter
    ? getAddableAssignmentLists(selectedSpell, activeCharacter)
    : [];
  const selectedSpellEligible = selectedSpell && activeCharacter
    ? isSpellEligibleForCharacter(selectedSpell, activeCharacter)
    : false;
  const selectedSpellCannotQueue = selectedSpell
    ? (!selectedSpellQueued && (!selectedSpellEligible || selectedSpellAddableLists.length === 0))
    : false;
  const selectedSpellDisabledReason = selectedSpell && !selectedSpellEligible
    ? 'This spell is outside the active character spell lists.'
    : selectedSpell && selectedSpellAddableLists.length === 0
      ? 'This spell is above every owned list max spell level.'
      : '';

  const preparedSet = useMemo(
    () => new Set((activeCharacter?.preparedSpells || []).map((entry) => entry.spellId)),
    [activeCharacter?.preparedSpells],
  );

  const rows = useMemo(
    () => spells.filter((spell) => matchesSearch(spell, search)),
    [spells, search],
  );

  const showListColumn = (activeCharacter?.availableLists || []).length > 1;

  async function onQueueToggle(spellId: string) {
    setError(null);
    try {
      if (isSpellQueuedForNextPreparation(spellId)) {
        await unqueueSpellForNextPreparation(spellId);
      } else {
        await queueSpellForNextPreparation(spellId);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to update next preparation queue.');
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border-dark bg-bg-1/90 p-4">
        <h1 className="font-display text-3xl">Catalog</h1>
        <p className="mt-1 text-sm text-text-muted">
          Quick browse flow. Queue spells for next preparation and review details only when needed.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-text-muted">
          <span>Queued: {activeCharacter?.nextPreparationQueue.length || 0}</span>
          <span>Prepared: {activeCharacter?.preparedSpells.length || 0}</span>
        </div>

        <div className="mt-4">
          <label className="text-sm text-text-muted" htmlFor="catalog-search">Search</label>
          <input
            id="catalog-search"
            className="mt-1 w-full rounded-xl border border-border-dark bg-bg px-3 py-2 text-text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search spells"
          />
        </div>

        {error ? <p className="mt-3 rounded-xl border border-blood-soft bg-blood-soft px-3 py-2 text-sm text-blood">{error}</p> : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border-dark bg-bg-1/90">
        <div className="grid grid-cols-[90px_80px_minmax(200px,1fr)_120px_110px_140px_minmax(160px,1fr)_150px] gap-2 border-b border-border-dark px-3 py-2 text-xs uppercase tracking-wide text-text-dim">
          <span>Prepared</span>
          <span>Level</span>
          <span>Name</span>
          <span>{showListColumn ? 'List' : 'List*'}</span>
          <span>Save</span>
          <span>Action</span>
          <span>Notes</span>
          <span>Next Preparation</span>
        </div>

        <div className="max-h-[65vh] overflow-y-auto">
          {rows.map((spell) => {
            const lists = getSpellLists(spell);
            const displayList = showListColumn ? (lists[0] || '-') : '-';
            const queued = isSpellQueuedForNextPreparation(spell.id);
            const eligible = activeCharacter ? isSpellEligibleForCharacter(spell, activeCharacter) : false;
            const addableLists = activeCharacter ? getAddableAssignmentLists(spell, activeCharacter) : [];
            const cannotQueue = !queued && (!eligible || addableLists.length === 0);
            const disabledReason = !eligible
              ? 'This spell is outside the active character spell lists.'
              : addableLists.length === 0
                ? 'This spell is above every owned list max spell level.'
              : '';

            return (
              <div
                key={spell.id}
                className="grid grid-cols-[90px_80px_minmax(200px,1fr)_120px_110px_140px_minmax(160px,1fr)_150px] gap-2 border-b border-border-dark/60 px-3 py-2 text-sm hover:bg-bg-2"
              >
                <span>{preparedSet.has(spell.id) ? 'Yes' : 'No'}</span>
                <span>{spell.level === 0 ? 'Cantrip' : spell.level}</span>
                <button
                  type="button"
                  className="truncate text-left text-text underline-offset-2 hover:underline"
                  title={spell.name}
                  aria-label={`Inspect ${spell.name}`}
                  onClick={() => setSelectedSpellId(spell.id)}
                >
                  {spell.name}
                </button>
                <span>{displayList}</span>
                <span>{spell.save || '-'}</span>
                <span>{spell.castingTime || '-'}</span>
                <span className="truncate" title={spell.notes || '-'}>{spell.notes || '-'}</span>
                <button
                  type="button"
                  className={`rounded-lg border px-2 py-1 text-xs ${queued ? 'border-gold-soft bg-gold-soft/20' : 'border-border-dark bg-bg'} ${cannotQueue ? 'cursor-not-allowed opacity-55' : ''}`}
                  disabled={cannotQueue}
                  title={disabledReason}
                  aria-label={cannotQueue ? disabledReason : (queued ? 'Unqueue spell from next preparation' : 'Queue spell for next preparation')}
                  onClick={(event) => {
                    event.preventDefault();
                    void onQueueToggle(spell.id);
                  }}
                >
                  {queued ? 'Queued' : cannotQueue ? 'Unavailable' : 'Queue'}
                </button>
              </div>
            );
          })}

          {!rows.length ? (
            <p className="p-4 text-sm text-text-muted">No spells match your search.</p>
          ) : null}
        </div>

        {!showListColumn ? (
          <p className="border-t border-border-dark px-3 py-2 text-xs text-text-dim">
            * List column stays hidden unless this character has multiple available lists.
          </p>
        ) : null}
      </section>

      {selectedSpell ? (
        <div
          className="fixed inset-0 z-40 bg-black/65 p-4 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedSpell.name} details`}
          onClick={() => setSelectedSpellId(null)}
        >
          <section
            className="mx-auto max-h-full max-w-4xl overflow-y-auto rounded-2xl border border-border-dark bg-bg-1/95 p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl">{selectedSpell.name}</h2>
                <p className="text-sm text-text-muted">Level {selectedSpell.level} · {selectedSpell.school || 'Unspecified school'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`rounded-lg border px-2 py-1 text-xs ${selectedSpellQueued ? 'border-gold-soft bg-gold-soft/20' : 'border-border-dark bg-bg'} ${selectedSpellCannotQueue ? 'cursor-not-allowed opacity-55' : ''}`}
                  disabled={selectedSpellCannotQueue}
                  title={selectedSpellDisabledReason}
                  aria-label={selectedSpellCannotQueue ? selectedSpellDisabledReason : (selectedSpellQueued ? 'Unqueue spell from next preparation' : 'Queue spell for next preparation')}
                  onClick={() => void onQueueToggle(selectedSpell.id)}
                >
                  {selectedSpellQueued ? 'Queued' : selectedSpellCannotQueue ? 'Unavailable' : 'Queue'}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-border-dark bg-bg px-2 py-1 text-xs"
                  onClick={() => setSelectedSpellId(null)}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <p><strong>Lists:</strong> {getSpellLists(selectedSpell).join(', ') || '-'}</p>
              <p><strong>Assigned List:</strong> {activeCharacter ? (getSpellAssignmentList(selectedSpell, activeCharacter) || '-') : '-'}</p>
              <p><strong>Save:</strong> {selectedSpell.save || '-'}</p>
              <p><strong>Action:</strong> {selectedSpell.castingTime || '-'}</p>
              <p><strong>Range:</strong> {selectedSpell.rangeArea || '-'}</p>
              <p><strong>Duration:</strong> {selectedSpell.duration || '-'}</p>
              <p><strong>Components:</strong> {selectedSpell.components || '-'}</p>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm text-text-muted">{selectedSpell.description || selectedSpell.notes || 'No details recorded.'}</p>
          </section>
        </div>
      ) : null}
    </div>
  );
}
