import { useEffect, useMemo, useState } from 'react';
import { getSpellAssignmentList, getSpellLists, isSpellEligibleForCharacter } from '../domain/character';
import {
  buildCatalogRows,
  getDefaultCatalogPreferences,
  readCatalogPreferences,
  resetCatalogSort,
  sanitizeCatalogPreferences,
  type CatalogPreferences,
  type CatalogSortKey,
} from './catalogViewModel';
import { useApp } from '../state/AppContext';

const CATALOG_PREFERENCES_KEY = 'spellbook.catalogPreferences';

const SORTABLE_COLUMNS: Array<{ key: CatalogSortKey; label: string }> = [
  { key: 'prepared', label: 'Prepared' },
  { key: 'level', label: 'Level' },
  { key: 'name', label: 'Name' },
  { key: 'list', label: 'List' },
  { key: 'save', label: 'Save' },
  { key: 'action', label: 'Action' },
  { key: 'notes', label: 'Notes' },
  { key: 'queued', label: 'Next Preparation' },
];

function readInitialPreferences(): CatalogPreferences {
  if (typeof window === 'undefined') {
    return getDefaultCatalogPreferences();
  }

  return sanitizeCatalogPreferences(
    readCatalogPreferences(window.localStorage.getItem(CATALOG_PREFERENCES_KEY)),
    { allowListSort: true },
  );
}

function getSortIndicator(sortKey: CatalogSortKey, preferences: CatalogPreferences): string | null {
  if (preferences.sortKey !== sortKey) return null;
  return preferences.sortDirection === 'asc' ? 'Asc' : 'Desc';
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
  const [preferences, setPreferences] = useState<CatalogPreferences>(readInitialPreferences);
  const [selectedSpellId, setSelectedSpellId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showListColumn = (activeCharacter?.availableLists || []).length > 1;
  const effectivePreferences = useMemo(
    () => sanitizeCatalogPreferences(preferences, { allowListSort: showListColumn }),
    [preferences, showListColumn],
  );

  useEffect(() => {
    if (
      preferences.viewMode !== effectivePreferences.viewMode
      || preferences.sortKey !== effectivePreferences.sortKey
      || preferences.sortDirection !== effectivePreferences.sortDirection
    ) {
      setPreferences(effectivePreferences);
    }
  }, [effectivePreferences, preferences]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CATALOG_PREFERENCES_KEY, JSON.stringify(effectivePreferences));
  }, [effectivePreferences]);

  const selectedSpell = useMemo(
    () => spells.find((entry) => entry.id === selectedSpellId) || null,
    [spells, selectedSpellId],
  );
  const selectedSpellQueued = selectedSpell ? isSpellQueuedForNextPreparation(selectedSpell.id) : false;
  const selectedSpellEligible = selectedSpell
    ? (activeCharacter ? isSpellEligibleForCharacter(selectedSpell, activeCharacter) : true)
    : false;
  const selectedSpellCannotQueue = selectedSpell ? (!selectedSpellQueued && !selectedSpellEligible) : false;
  const selectedSpellDisabledReason = selectedSpell && activeCharacter && !selectedSpellEligible
    ? 'This spell is outside the active character spell lists.'
    : '';

  const rows = useMemo(
    () => buildCatalogRows({
      spells,
      activeCharacter,
      search,
      preferences: effectivePreferences,
    }),
    [activeCharacter, effectivePreferences, search, spells],
  );

  const searchMatchedRows = useMemo(
    () => buildCatalogRows({
      spells,
      activeCharacter,
      search,
      preferences: {
        ...effectivePreferences,
        viewMode: 'all',
      },
    }),
    [activeCharacter, effectivePreferences, search, spells],
  );

  const emptyStateMessage = effectivePreferences.viewMode === 'eligible_only' && searchMatchedRows.length > 0
    ? 'No spells match this character filter.'
    : 'No spells match your search.';

  function onSortToggle(sortKey: CatalogSortKey) {
    if (sortKey === 'list' && !showListColumn) {
      setPreferences((current) => resetCatalogSort(current));
      return;
    }

    setPreferences((current) => {
      if (current.sortKey !== sortKey) {
        return {
          ...current,
          sortKey,
          sortDirection: 'asc',
        };
      }

      if (current.sortDirection === 'asc') {
        return {
          ...current,
          sortDirection: 'desc',
        };
      }

      return resetCatalogSort(current);
    });
  }

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
          <span>Prepared: {activeCharacter?.preparedSpellIds.length || 0}</span>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="text-sm text-text-muted" htmlFor="catalog-search">Search</label>
            <input
              id="catalog-search"
              className="mt-1 w-full rounded-xl border border-border-dark bg-bg px-3 py-2 text-text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search spells"
            />
          </div>

          <div className="min-w-[240px]">
            <p className="text-sm text-text-muted">View</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'eligible_first', label: 'Eligible First' },
                { value: 'eligible_only', label: 'Eligible Only' },
              ].map((option) => {
                const active = effectivePreferences.viewMode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`rounded-xl border px-3 py-2 text-sm ${active ? 'border-gold-soft bg-gold-soft/20 text-text' : 'border-border-dark bg-bg text-text-muted'}`}
                    onClick={() => setPreferences((current) => ({ ...current, viewMode: option.value as CatalogPreferences['viewMode'] }))}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error ? <p className="mt-3 rounded-xl border border-blood-soft bg-blood-soft px-3 py-2 text-sm text-blood">{error}</p> : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border-dark bg-bg-1/90">
        <div className="grid grid-cols-[90px_80px_minmax(200px,1fr)_120px_110px_140px_minmax(160px,1fr)_150px] gap-2 border-b border-border-dark px-3 py-2 text-xs uppercase tracking-wide text-text-dim">
          {SORTABLE_COLUMNS.map((column) => {
            if (column.key === 'list' && !showListColumn) {
              return <span key={column.key}>List*</span>;
            }

            const indicator = getSortIndicator(column.key, effectivePreferences);

            return (
              <button
                key={column.key}
                type="button"
                className="flex items-center gap-1 text-left"
                onClick={() => onSortToggle(column.key)}
              >
                <span>{column.label}</span>
                {indicator ? <span className="text-[10px] normal-case tracking-normal text-text-muted">{indicator}</span> : null}
              </button>
            );
          })}
        </div>

        <div className="max-h-[65vh] overflow-y-auto">
          {rows.map((row) => {
            const spell = row.spell;
            const displayList = showListColumn ? row.displayList : '-';
            const cannotQueue = !row.queued && !row.eligible;
            const disabledReason = !row.eligible && activeCharacter
              ? 'This spell is outside the active character spell lists.'
              : '';

            return (
              <div
                key={spell.id}
                className="grid grid-cols-[90px_80px_minmax(200px,1fr)_120px_110px_140px_minmax(160px,1fr)_150px] gap-2 border-b border-border-dark/60 px-3 py-2 text-sm hover:bg-bg-2"
              >
                <span>{row.prepared ? 'Yes' : 'No'}</span>
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
                  className={`rounded-lg border px-2 py-1 text-xs ${row.queued ? 'border-gold-soft bg-gold-soft/20' : 'border-border-dark bg-bg'} ${cannotQueue ? 'cursor-not-allowed opacity-55' : ''}`}
                  disabled={cannotQueue}
                  title={disabledReason}
                  aria-label={cannotQueue ? disabledReason : (row.queued ? 'Unqueue spell from next preparation' : 'Queue spell for next preparation')}
                  onClick={(event) => {
                    event.preventDefault();
                    void onQueueToggle(spell.id);
                  }}
                >
                  {row.queued ? 'Queued' : cannotQueue ? 'Unavailable' : 'Queue'}
                </button>
              </div>
            );
          })}

          {!rows.length ? (
            <p className="p-4 text-sm text-text-muted">{emptyStateMessage}</p>
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
