import { useEffect, useMemo, useState } from 'react';
import { getAddableAssignmentLists, getSpellLists, isSpellEligibleForCharacter } from '../domain/character';
import { useApp } from '../state/AppContext';
import { SpellDetailDialog } from '../components/SpellDetailDialog';
import { getCatalogRowPresentation } from './catalogPresentation';
import type { SpellRecord } from '../types';
import {
  buildCatalogRows,
  getDefaultCatalogPreferences,
  readCatalogPreferences,
  resetCatalogSort,
  sanitizeCatalogPreferences,
  type CatalogPreferences,
  type CatalogSortKey,
} from './catalogViewModel';

const CATALOG_PREFERENCES_KEY = 'spellbook.catalogPreferences';

const SORTABLE_COLUMNS: Array<{ key: CatalogSortKey; label: string }> = [
  { key: 'prepared', label: 'Prepared Status' },
  { key: 'level', label: 'Spell Level' },
  { key: 'name', label: 'Spell Name' },
  { key: 'list', label: 'Spell List' },
  { key: 'save', label: 'Save Type' },
  { key: 'action', label: 'Casting Time' },
  { key: 'notes', label: 'Spell Notes' },
  { key: 'queued', label: 'Queue Status' },
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

function formatSpellLevel(level: number): string {
  if (level === 0) return 'Cantrip';
  return `Level ${level}`;
}

function isRitualSpell(spell: SpellRecord): boolean {
  return (spell.castingTime || '').toLowerCase().includes('ritual');
}

function isConcentrationSpell(spell: SpellRecord): boolean {
  return (spell.duration || '').toLowerCase().startsWith('concentration');
}

function getSpellExcerpt(notes: string, description: string): string {
  const source = notes.trim() || description.trim();
  if (!source) return 'Open the detail view for the full rules text.';
  const sentence = source.split(/(?<=[.!?])\s+/)[0] || source;
  return sentence.length > 120 ? `${sentence.slice(0, 117)}...` : sentence;
}

export function CatalogPage() {
  const {
    spells,
    activeCharacter,
    queueSpellForNextPreparation,
    unqueueSpellForNextPreparation,
    isSpellQueuedForNextPreparation,
    markPreparedForReplacement,
    unmarkPreparedForReplacement,
    isSpellMarkedForReplacement,
  } = useApp();

  const [search, setSearch] = useState('');
  const [preferences, setPreferences] = useState<CatalogPreferences>(readInitialPreferences);
  const [selectedSpellId, setSelectedSpellId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextSortDirection, setNextSortDirection] = useState<'asc' | 'desc'>('asc');

  const showListColumn = (activeCharacter?.availableLists || []).length > 1;
  const effectivePreferences = useMemo(
    () => sanitizeCatalogPreferences(preferences, { allowListSort: showListColumn }),
    [preferences, showListColumn],
  );

  useEffect(() => {
    if (
      preferences.viewMode !== effectivePreferences.viewMode
      || JSON.stringify(preferences.sorts) !== JSON.stringify(effectivePreferences.sorts)
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
  const selectedSpellAddableLists = selectedSpell && activeCharacter
    ? getAddableAssignmentLists(selectedSpell, activeCharacter)
    : [];
  const selectedSpellEligible = selectedSpell
    ? (activeCharacter ? isSpellEligibleForCharacter(selectedSpell, activeCharacter) : true)
    : false;
  const selectedSpellCannotQueue = selectedSpell
    ? (!selectedSpellQueued && (!selectedSpellEligible || selectedSpellAddableLists.length === 0))
    : false;
  const selectedSpellDisabledReason = selectedSpell && activeCharacter && !selectedSpellEligible
    ? 'This spell is outside the active character spell lists.'
    : selectedSpell && selectedSpellAddableLists.length === 0
      ? 'This spell is above every owned list max spell level.'
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

  const queuedCount = activeCharacter?.nextPreparationQueue.length || 0;
  const eligibleCount = rows.filter((row) => row.eligible).length;

  useEffect(() => {
    if (!activeCharacter && preferences.viewMode === 'character_filtered') {
      setPreferences((current) => ({ ...current, viewMode: 'all' }));
    }
  }, [activeCharacter, preferences.viewMode]);

  const emptyStateMessage = effectivePreferences.viewMode === 'character_filtered' && searchMatchedRows.length > 0
    ? 'No spells match for this character and search.'
    : 'No spells match this search yet.';

  async function onQueueToggle(spellId: string) {
    setError(null);
    try {
      if (isSpellQueuedForNextPreparation(spellId)) {
        await unqueueSpellForNextPreparation(spellId);
      } else if (isSpellMarkedForReplacement(spellId)) {
        await unmarkPreparedForReplacement(spellId);
      } else {
        // Check if this is a prepared spell — if so, mark for replacement
        const preparedEntry = activeCharacter?.preparedSpells.find((entry) => entry.spellId === spellId);
        if (preparedEntry) {
          await markPreparedForReplacement(spellId, preparedEntry.assignedList);
        } else {
          await queueSpellForNextPreparation(spellId);
        }
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to update the next preparation queue.');
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[1.55rem] border border-border-dark bg-bg-1/92 p-4 md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <h1 className="font-display text-3xl text-text md:text-4xl">Browse The Spell Shelf</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-2xl border border-border-dark bg-bg px-4 py-2 text-sm text-text transition-colors hover:bg-bg-2"
              onClick={() => {
                setSearch('');
                setPreferences((current) => resetCatalogSort(current));
              }}
            >
              Reset View
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_220px_180px_auto]">
          <div className="flex gap-2">
            <input
              id="catalog-search"
              className="min-w-0 flex-1 rounded-2xl border border-border-dark bg-bg px-4 py-3 text-text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search spells, notes, or rules text"
            />
            <button
              type="button"
              className="rounded-2xl border border-border-dark bg-bg px-4 py-3 text-sm text-text-muted transition-colors hover:bg-bg-2 hover:text-text"
              onClick={() => setSearch('')}
            >
              Clear
            </button>
          </div>

          <select
            className="w-full rounded-2xl border border-border-dark bg-bg px-4 py-3 text-text"
            value=""
            onChange={(event) => {
              const newKey = event.target.value as CatalogSortKey;
              if (!newKey) return;
              setPreferences((current) => {
                if (current.sorts.some((s) => s.key === newKey)) return current;
                return {
                  ...current,
                  sorts: [...current.sorts, { key: newKey, direction: nextSortDirection }],
                };
              });
            }}
          >
            <option value="" disabled>Add sort…</option>
            {SORTABLE_COLUMNS
              .filter((column) => showListColumn || column.key !== 'list')
              .map((column) => (
                <option key={column.key} value={column.key}>{column.label}</option>
              ))}
          </select>

          <button
            type="button"
            className="w-full rounded-2xl border border-border-dark bg-bg px-4 py-3 text-left text-text transition-colors hover:bg-bg-2"
            onClick={() => setNextSortDirection((d) => d === 'asc' ? 'desc' : 'asc')}
          >
            {nextSortDirection === 'asc' ? 'Ascending' : 'Descending'}
          </button>

          {activeCharacter ? (
            <button
              type="button"
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                effectivePreferences.viewMode === 'character_filtered'
                  ? 'border-accent-soft bg-accent-soft/25 text-text'
                  : 'border-border-dark bg-bg text-text-muted hover:bg-bg-2 hover:text-text'
              }`}
              onClick={() => setPreferences((current) => ({
                ...current,
                viewMode: current.viewMode === 'character_filtered' ? 'all' : 'character_filtered',
              }))}
            >
              {effectivePreferences.viewMode === 'character_filtered'
                ? `${activeCharacter.name} ✕`
                : activeCharacter.name}
            </button>
          ) : null}
        </div>

        {(() => {
          const isCharFiltered = effectivePreferences.viewMode === 'character_filtered' && activeCharacter;
          const hasSearch = search.trim().length > 0;

          return (
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-text-muted">
              <span className="rounded-full border border-border-dark bg-bg px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-text-muted">
                Showing {rows.length} of {spells.length}
              </span>
              <span className="rounded-full border border-border-dark bg-bg px-3 py-1">Search matches: {searchMatchedRows.length}</span>
              {activeCharacter ? (
                <>
                  <span className="rounded-full border border-border-dark bg-bg px-3 py-1">Eligible on screen: {eligibleCount}</span>
                  <span className="rounded-full border border-border-dark bg-bg px-3 py-1">Queued: {queuedCount}</span>
                </>
              ) : null}
              {isCharFiltered ? (
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-full border border-accent-soft bg-accent-soft/25 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text transition-colors hover:border-blood-soft"
                  onClick={() => setPreferences((current) => ({ ...current, viewMode: 'all' }))}
                >
                  Character: {activeCharacter.name}
                  <span className="text-[9px] opacity-50" aria-hidden="true">✕</span>
                </button>
              ) : null}
              {effectivePreferences.sorts.map((sort, index) => {
                const label = SORTABLE_COLUMNS.find((c) => c.key === sort.key)?.label || sort.key;
                const arrow = sort.direction === 'asc' ? '↑' : '↓';
                return (
                  <button
                    key={`sort-${sort.key}`}
                    type="button"
                    className="flex items-center gap-1.5 rounded-full border border-border-dark bg-bg px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted transition-colors hover:border-blood-soft"
                    onClick={() => setPreferences((current) => ({
                      ...current,
                      sorts: current.sorts.filter((_, i) => i !== index),
                    }))}
                  >
                    Sort: {label} {arrow}
                    <span className="text-[9px] opacity-50" aria-hidden="true">✕</span>
                  </button>
                );
              })}
              {hasSearch ? (
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-full border border-border-dark bg-bg px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-text-muted transition-colors hover:border-blood-soft"
                  onClick={() => setSearch('')}
                >
                  Search: &ldquo;{search}&rdquo;
                  <span className="text-[9px] opacity-50" aria-hidden="true">✕</span>
                </button>
              ) : null}
            </div>
          );
        })()}

        {error ? <p className="mt-4 rounded-2xl border border-blood-soft bg-blood-soft px-4 py-3 text-sm text-blood">{error}</p> : null}
      </section>

      <section className="space-y-3">
        {rows.map((row) => {
          const spell = row.spell;
          const addableLists = activeCharacter ? getAddableAssignmentLists(spell, activeCharacter) : [];
          const presentation = getCatalogRowPresentation({ row, addableLists });
          const listLabel = showListColumn ? row.displayList : (getSpellLists(spell)[0] || row.displayList);

          return (
            <article
              key={spell.id}
              role="button"
              tabIndex={0}
              aria-label={`View details for ${spell.name}`}
              className="cursor-pointer rounded-[1.45rem] border border-border-dark bg-bg-1/92 p-4 transition-colors hover:border-gold-soft/40 hover:bg-bg-1"
              onClick={() => setSelectedSpellId(spell.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedSpellId(spell.id);
                }
              }}
            >
              <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.95fr)_180px] lg:items-center">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-border-dark bg-bg px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-text-muted">
                      {formatSpellLevel(spell.level)}
                    </span>
                    <span className="rounded-full border border-border-dark bg-bg px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-text-muted">
                      {listLabel}
                    </span>
                    {isRitualSpell(spell) ? (
                      <span className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em]"
                        style={{ borderColor: 'rgba(68,170,153,0.5)', background: 'rgba(68,170,153,0.12)', color: '#6cc' }}>
                        Ritual
                      </span>
                    ) : null}
                    {isConcentrationSpell(spell) ? (
                      <span className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em]"
                        style={{ borderColor: 'rgba(200,160,64,0.5)', background: 'rgba(200,160,64,0.1)', color: '#d4b060' }}>
                        Concentration
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <h3 className="text-left font-display text-2xl text-text">
                      {spell.name}
                    </h3>
                    <p className="mt-1 max-w-3xl text-sm text-text-muted">{getSpellExcerpt(spell.notes || '', spell.description || '')}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-text-muted">
                  <span className="rounded-full border border-border-dark bg-bg px-3 py-1">
                    {spell.castingTime || 'No casting time'}
                  </span>
                  <span className="rounded-full border border-border-dark bg-bg px-3 py-1">
                    Save: {spell.save || 'None'}
                  </span>
                  <span className="rounded-full border border-border-dark bg-bg px-3 py-1">
                    Range: {spell.rangeArea || 'See details'}
                  </span>
                  {activeCharacter ? (
                    <p className="basis-full pt-1 text-sm text-text-dim">{presentation.helperText}</p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2">
                  {activeCharacter ? (
                    <button
                      type="button"
                      className={`rounded-2xl border px-4 py-3 text-sm transition-colors ${
                        presentation.disabled
                          ? 'cursor-not-allowed border-border-dark bg-bg text-text-dim opacity-55'
                          : presentation.stateLabel === 'Queued'
                            ? 'border-gold-soft bg-gold-soft/20 text-text hover:bg-gold-soft/30'
                            : presentation.stateLabel === 'Replacing'
                              ? 'border-gold-soft bg-gold-soft/20 text-text hover:bg-gold-soft/30'
                              : presentation.stateLabel === 'Prepared'
                                ? 'border-accent-soft bg-accent-soft/25 text-text hover:bg-accent-soft/35'
                                : 'border-moon-border bg-moon-paper text-moon-ink hover:opacity-92'
                      }`}
                      disabled={presentation.disabled}
                      title={presentation.helperText}
                      aria-label={presentation.helperText}
                      onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        void onQueueToggle(spell.id);
                      }}
                    >
                      {presentation.actionLabel}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}

        {!rows.length ? (
          <div className="rounded-[1.45rem] border border-border-dark bg-bg-1/92 px-5 py-8 text-center">
            <p className="font-display text-3xl text-text">No spells surfaced</p>
            <p className="mt-2 text-sm text-text-muted">{emptyStateMessage}</p>
          </div>
        ) : null}
      </section>

      <SpellDetailDialog
        spell={selectedSpell}
        activeCharacter={activeCharacter}
        queued={selectedSpellQueued}
        cannotQueue={selectedSpellCannotQueue}
        disabledReason={selectedSpellDisabledReason}
        onToggleQueue={(spellId) => void onQueueToggle(spellId)}
        onClose={() => setSelectedSpellId(null)}
      />
    </div>
  );
}
