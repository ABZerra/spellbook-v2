import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  buildPreparationUsage,
  getAddableAssignmentLists,
  getPreparationLimits,
  getSpellLists,
  getValidAssignmentLists,
  normalizeListName,
} from '../domain/character';
import {
  formatPreparedVerificationRowMeta,
  getCharacterCueMetadata,
  getCharacterHeaderPills,
  getCharacterPreparationRuleSummaries,
  getGroupedPreparedVerificationRows,
} from './characterPresentation';
import { SpellDetailDrawer } from '../components/SpellDetailDrawer';
import { useApp } from '../state/AppContext';
import type { SpellRecord } from '../types';

function matchesSpellSearch(spell: SpellRecord, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    spell.name.toLowerCase().includes(normalized)
    || spell.notes.toLowerCase().includes(normalized)
    || spell.description.toLowerCase().includes(normalized)
  );
}

export function CharacterPage() {
  const {
    spells,
    characters,
    activeCharacter,
    createCharacter,
    saveCharacter,
    deleteCharacter,
    setActiveCharacter,
    addPreparedSpell,
    removePreparedSpell,
    reassignPreparedSpell,
  } = useApp();

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCreateCharacterForm, setShowCreateCharacterForm] = useState(false);
  const [editingRuleList, setEditingRuleList] = useState<string | null>(null);
  const [editingPreparedAssignmentKey, setEditingPreparedAssignmentKey] = useState<string | null>(null);
  const [selectedPreparedKey, setSelectedPreparedKey] = useState<string | null>(null);

  const [createName, setCreateName] = useState('');
  const [createLists, setCreateLists] = useState('');
  const [createLimitByList, setCreateLimitByList] = useState<Record<string, number>>({});
  const [alwaysPreparedSearch, setAlwaysPreparedSearch] = useState('');
  const [alwaysPreparedAssignedListBySpell, setAlwaysPreparedAssignedListBySpell] = useState<Record<string, string>>({});

  const spellsById = useMemo(() => new Map(spells.map((spell) => [spell.id, spell])), [spells]);

  const parsedCreateLists = useMemo(
    () => [...new Set(createLists.split(',').map((entry) => entry.trim().toUpperCase()).filter(Boolean))],
    [createLists],
  );

  useEffect(() => {
    setCreateLimitByList((current) => {
      const next: Record<string, number> = {};
      for (const list of parsedCreateLists) {
        next[list] = current[list] || 8;
      }
      return JSON.stringify(next) === JSON.stringify(current) ? current : next;
    });
  }, [parsedCreateLists]);

  const cueMetadata = useMemo(
    () => (activeCharacter ? getCharacterCueMetadata(activeCharacter) : null),
    [activeCharacter],
  );

  const activeCharacterId = activeCharacter?.id ?? null;

  useEffect(() => {
    setEditingPreparedAssignmentKey(null);
  }, [activeCharacterId]);

  const headerPills = useMemo(
    () => getCharacterHeaderPills(characters, activeCharacterId),
    [characters, activeCharacterId],
  );

  const preparationUsage = useMemo(
    () => buildPreparationUsage(activeCharacter?.preparedSpells || [], spellsById),
    [activeCharacter, spellsById],
  );

  const preparationRuleSummaries = useMemo(
    () => (activeCharacter ? getCharacterPreparationRuleSummaries(activeCharacter.preparationLimits, preparationUsage) : []),
    [activeCharacter, preparationUsage],
  );

  const preparedRows = useMemo(() => {
    if (!activeCharacter) return [];

    const occurrenceByKey = new Map<string, number>();

    return activeCharacter.preparedSpells
      .map((entry) => {
        const key = `${entry.spellId}::${entry.assignedList}::${entry.mode}`;
        const occurrenceIndex = occurrenceByKey.get(key) || 0;
        occurrenceByKey.set(key, occurrenceIndex + 1);
        const spell = spellsById.get(entry.spellId) || null;

        return {
          key: `${entry.spellId}:${entry.assignedList}:${entry.mode}:${occurrenceIndex}`,
          entry,
          occurrenceIndex,
          spell,
          spellId: entry.spellId,
          spellName: spell?.name || entry.spellId,
          level: spell?.level ?? 99,
          assignedList: entry.assignedList,
          mode: entry.mode,
          validLists: (() => {
            if (!spell) return [];
            return getValidAssignmentLists(spell, activeCharacter);
          })(),
        };
      });
  }, [activeCharacter, spellsById]);

  const preparedGroups = useMemo(
    () => getGroupedPreparedVerificationRows(preparedRows),
    [preparedRows],
  );

  useEffect(() => {
    if (editingPreparedAssignmentKey && !preparedRows.some((row) => row.key === editingPreparedAssignmentKey)) {
      setEditingPreparedAssignmentKey(null);
    }
  }, [editingPreparedAssignmentKey, preparedRows]);

  const selectedPreparedRow = useMemo(
    () => preparedRows.find((row) => row.key === selectedPreparedKey) || null,
    [preparedRows, selectedPreparedKey],
  );

  const alwaysPreparedOptions = useMemo(() => {
    if (!activeCharacter || !alwaysPreparedSearch.trim()) return [];

    return spells
      .filter((spell) => matchesSpellSearch(spell, alwaysPreparedSearch))
      .map((spell) => ({
        spell,
        addableLists: getAddableAssignmentLists(spell, activeCharacter),
        validLists: getValidAssignmentLists(spell, activeCharacter),
      }))
      .filter(({ validLists }) => validLists.length > 0)
      .slice(0, 12);
  }, [activeCharacter, alwaysPreparedSearch, spells]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const lists = parsedCreateLists;

      await createCharacter({
        name: createName,
        availableLists: lists,
        preparationLimits: lists.map((list) => ({ list, limit: Math.max(1, createLimitByList[list] || 8), maxSpellLevel: 9 })),
      });

      setCreateName('');
      setCreateLists('');
      setCreateLimitByList({});
      setShowCreateCharacterForm(false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to create character.');
    } finally {
      setBusy(false);
    }
  }

  async function onAddAlwaysPrepared(spellId: string, assignedList: string | null) {
    if (!assignedList) {
      setError('Choose a spell list before adding an always prepared spell.');
      return;
    }

    setError(null);
    try {
      await addPreparedSpell(spellId, assignedList, 'always');
      setAlwaysPreparedSearch('');
      setAlwaysPreparedAssignedListBySpell((current) => {
        const next = { ...current };
        delete next[spellId];
        return next;
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to add always prepared spell.');
    }
  }

  async function onUpdatePreparationRule(
    list: string,
    patch: Partial<{ limit: number; maxSpellLevel: number }>,
  ) {
    if (!activeCharacter) return;

    const normalizedList = normalizeListName(list);
    const nextLimits = activeCharacter.preparationLimits.map((entry) => {
      if (normalizeListName(entry.list) !== normalizedList) {
        return entry;
      }

      return {
        ...entry,
        limit: patch.limit === undefined ? entry.limit : Math.max(1, patch.limit),
        maxSpellLevel: patch.maxSpellLevel === undefined ? entry.maxSpellLevel : Math.max(0, Math.min(9, patch.maxSpellLevel)),
      };
    });

    await saveCharacter({ ...activeCharacter, preparationLimits: nextLimits });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[1.55rem] border border-border-dark bg-bg-1/92 p-4 md:p-5">
        <p className="text-[11px] uppercase tracking-[0.34em] text-text-dim">Character</p>
        <div className="mt-2 flex flex-col gap-4">
          <div>
            <h1 className="font-display text-3xl text-text md:text-4xl">Review Current Prepared</h1>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">
              Check your limits first, then confirm today&apos;s prepared list.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="overflow-hidden">
              <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 pr-2 arcane-scrollbar md:flex-wrap md:overflow-visible md:pb-0 md:pr-0">
                {headerPills.map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] transition flex-shrink-0 whitespace-nowrap ${pill.isActive ? 'border-gold-soft bg-gold-soft/20 text-text' : 'border-border-dark bg-bg text-text-muted hover:bg-bg-2 hover:text-text'}`}
                    onClick={() => setActiveCharacter(pill.id)}
                  >
                    {pill.label}
                  </button>
                ))}
                <button
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] transition flex-shrink-0 whitespace-nowrap ${showCreateCharacterForm ? 'border-gold-soft bg-gold-soft/20 text-text' : 'border-border-dark bg-bg text-text-muted hover:bg-bg-2 hover:text-text'}`}
                  onClick={() => setShowCreateCharacterForm((current) => !current)}
                >
                  + New Character
                </button>
              </div>
            </div>

            {!headerPills.length ? (
              <p className="text-sm text-text-muted">Create a character to start building a verification list.</p>
            ) : null}

            {showCreateCharacterForm ? (
              <div className="max-w-2xl rounded-2xl border border-border-dark bg-bg px-4 py-4 text-sm">
                <p className="text-[11px] uppercase tracking-[0.3em] text-text-dim">Create Character</p>
                <form className="mt-4 space-y-3" onSubmit={(event) => void onCreate(event)}>
                  <input
                    className="w-full rounded-2xl border border-border-dark bg-bg-2 px-3 py-2.5 text-sm text-text"
                    placeholder="Character name"
                    value={createName}
                    onChange={(event) => setCreateName(event.target.value)}
                    required
                  />
                  <input
                    className="w-full rounded-2xl border border-border-dark bg-bg-2 px-3 py-2.5 text-sm text-text"
                    placeholder="Lists (Wizard, Cleric)"
                    value={createLists}
                    onChange={(event) => setCreateLists(event.target.value)}
                  />
                  {parsedCreateLists.map((list) => (
                    <label key={list} className="block rounded-2xl border border-border-dark bg-bg-2 px-3 py-3 text-sm">
                      <span className="text-text-muted">{list} preparation limit</span>
                      <input
                        className="mt-2 w-full rounded-xl border border-border-dark bg-bg px-3 py-2 text-text"
                        type="number"
                        min={1}
                        value={createLimitByList[list] || 8}
                        onChange={(event) => setCreateLimitByList((current) => ({
                          ...current,
                          [list]: Math.max(1, Number(event.target.value) || 1),
                        }))}
                      />
                    </label>
                  ))}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="rounded-2xl border border-gold-soft bg-gold-soft/20 px-4 py-3 text-sm text-text transition-colors hover:bg-gold-soft/30"
                      disabled={busy}
                    >
                      {busy ? 'Creating...' : 'Create Character'}
                    </button>
                    <button
                      type="button"
                      className="rounded-2xl border border-border-dark bg-bg-2 px-4 py-3 text-sm text-text-muted transition-colors hover:bg-bg hover:text-text"
                      onClick={() => setShowCreateCharacterForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4">

        {!activeCharacter ? (
          <div className="rounded-[1.45rem] border border-border-dark bg-bg-1/92 p-5">
            <h2 className="font-display text-3xl text-text">No active character</h2>
            <p className="mt-3 max-w-2xl text-sm text-text-muted">
              The header controls let you switch between characters or open the Create Character flow to add a new profile before assigning list limits and always-prepared spells.
            </p>
            {error ? <p className="mt-4 rounded-2xl border border-blood-soft bg-blood-soft px-4 py-3 text-sm text-blood">{error}</p> : null}
          </div>
        ) : (
          <div className="space-y-4">
            <section className="rounded-[1.45rem] border border-border-dark bg-bg-1/92 px-4 py-4 md:px-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-text-dim">Active Profile</p>
                  <h2 className="mt-1 font-display text-2xl text-text md:text-3xl break-words">{activeCharacter.name}</h2>
                  <p className="mt-1 text-sm text-text-muted break-words">
                    {cueMetadata?.classLabel || 'Unassigned class'}{cueMetadata?.subclassLabel ? ` · ${cueMetadata.subclassLabel}` : ''}
                  </p>
                </div>

                <button
                  type="button"
                  className="rounded-2xl border border-blood-soft bg-blood-soft px-4 py-2 text-sm text-blood flex-shrink-0"
                  onClick={() => {
                    if (characters.length <= 1) {
                      setError('At least one character must remain.');
                      return;
                    }
                    void deleteCharacter(activeCharacter.id);
                  }}
                >
                  Delete Character
                </button>
              </div>

              {preparationRuleSummaries.length ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {preparationRuleSummaries.map((summary) => (
                    <div key={summary.list} className="rounded-2xl border border-border-dark bg-bg px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.24em] text-text-dim">{summary.list}</p>
                          <p className="mt-2 font-display text-2xl text-text">
                            {summary.used}/{summary.limit}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-text-muted">
                            Max Level {summary.maxSpellLevel}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="rounded-full border border-border-dark bg-bg-2 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-text-muted transition-colors hover:bg-bg hover:text-text"
                          onClick={() => setEditingRuleList((current) => (current === summary.list ? null : summary.list))}
                        >
                          {editingRuleList === summary.list ? 'Done' : 'Edit'}
                        </button>
                      </div>

                      {editingRuleList === summary.list ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <label className="space-y-1 text-sm">
                            <span className="text-xs uppercase tracking-[0.2em] text-text-dim">Limit</span>
                            <input
                              className="w-full rounded-xl border border-border-dark bg-bg-2 px-3 py-2 text-text"
                              type="number"
                              min={1}
                              value={summary.limit}
                              onChange={(event) => {
                                void onUpdatePreparationRule(summary.list, {
                                  limit: Number(event.target.value) || 1,
                                }).catch((nextError) => {
                                  setError(nextError instanceof Error ? nextError.message : 'Unable to update preparation rule.');
                                });
                              }}
                            />
                          </label>

                          <label className="space-y-1 text-sm">
                            <span className="text-xs uppercase tracking-[0.2em] text-text-dim">Max Level</span>
                            <input
                              className="w-full rounded-xl border border-border-dark bg-bg-2 px-3 py-2 text-text"
                              type="number"
                              min={0}
                              max={9}
                              value={summary.maxSpellLevel}
                              onChange={(event) => {
                                void onUpdatePreparationRule(summary.list, {
                                  maxSpellLevel: Number(event.target.value) || 0,
                                }).catch((nextError) => {
                                  setError(nextError instanceof Error ? nextError.message : 'Unable to update preparation rule.');
                                });
                              }}
                            />
                          </label>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="rounded-[1.45rem] border border-border-dark bg-bg-1/92 p-4 md:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-display text-2xl text-text">Current Prepared</h3>
                <span className="text-[11px] uppercase tracking-[0.24em] text-text-dim">
                  {preparedRows.length} spells
                </span>
              </div>

              {preparedGroups.length ? (
                <div className="mt-5 space-y-5">
                  {preparedGroups.map((group) => (
                    <section key={group.level} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="text-[11px] uppercase tracking-[0.28em] text-text-dim">{group.label}</h4>
                        <div className="h-px flex-1 bg-border-dark" />
                      </div>

                      <div className="space-y-1">
                        {group.rows.map((row) => {
                          const isEditingAssignment = editingPreparedAssignmentKey === row.key;

                          return (
                            <div
                              key={row.key}
                              className="group flex flex-col gap-2 py-1.5 md:flex-row md:items-baseline md:gap-3"
                            >
                              <button
                                type="button"
                                className="min-w-0 truncate text-left font-medium text-text transition-colors hover:text-gold-soft"
                                onClick={() => setSelectedPreparedKey(row.key)}
                              >
                                {row.spell?.name || row.entry.spellId}
                              </button>

                              <div aria-hidden="true" className="hidden h-px flex-1 border-b border-dotted border-border-dark/70 md:block" />

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm md:justify-end">
                                {isEditingAssignment ? (
                                  <>
                                    <select
                                      id={`prepared-list-${row.entry.spellId}-${row.entry.mode}-${row.occurrenceIndex}`}
                                      className="min-w-[8rem] border-0 border-b border-border-dark bg-transparent px-0 py-1 text-sm text-text focus:outline-none"
                                      value={row.entry.assignedList}
                                      onChange={(event) => {
                                        setError(null);
                                        void reassignPreparedSpell(
                                          row.entry.spellId,
                                          row.entry.assignedList,
                                          row.entry.mode,
                                          row.occurrenceIndex,
                                          event.target.value,
                                        ).then(() => {
                                          setEditingPreparedAssignmentKey(null);
                                        }).catch((nextError) => {
                                          setError(nextError instanceof Error ? nextError.message : 'Unable to reassign prepared spell.');
                                        });
                                      }}
                                    >
                                      {row.validLists.map((list) => (
                                        <option key={list} value={list}>{list}</option>
                                      ))}
                                    </select>
                                    {row.entry.mode === 'always' ? (
                                      <span className="text-[11px] uppercase tracking-[0.18em] text-text-dim">Always</span>
                                    ) : null}
                                    <button
                                      type="button"
                                      className="text-[11px] uppercase tracking-[0.18em] text-text-dim transition-colors hover:text-text"
                                      onClick={() => setEditingPreparedAssignmentKey(null)}
                                    >
                                      Done
                                    </button>
                                  </>
                                ) : row.validLists.length > 1 ? (
                                  <button
                                    type="button"
                                    className="text-sm text-text-muted transition-colors hover:text-text"
                                    onClick={() => setEditingPreparedAssignmentKey(row.key)}
                                  >
                                    {formatPreparedVerificationRowMeta(row)}
                                  </button>
                                ) : (
                                  <span className="text-sm text-text-muted">
                                    {formatPreparedVerificationRowMeta(row)}
                                  </span>
                                )}

                                <button
                                  type="button"
                                  className="text-[11px] uppercase tracking-[0.18em] text-text-dim transition-[color,opacity] hover:text-blood md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                                  onClick={() => {
                                    void removePreparedSpell(row.entry.spellId, row.entry.assignedList, row.entry.mode, row.occurrenceIndex).catch((nextError) => {
                                      setError(nextError instanceof Error ? nextError.message : 'Unable to remove prepared spell.');
                                    });
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <p className="mt-5 py-2 text-sm text-text-muted">No prepared spells are active on this character yet.</p>
              )}
            </section>

            <section className="space-y-4 rounded-[1.45rem] border border-border-dark bg-bg-1/92 px-4 py-4 md:px-5 md:py-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-text-dim">Occasional Changes</p>
                <h3 className="mt-2 font-display text-2xl text-text">Profile Details</h3>
                <p className="mt-2 text-sm text-text-muted">Rare edits live here once your quick verification is done.</p>
              </div>

              <div className="space-y-3">
                <details className="rounded-2xl border border-border-dark bg-bg px-4 py-4">
                  <summary className="cursor-pointer list-none font-display text-xl text-text">Identity</summary>
                  <p className="mt-2 text-sm text-text-muted">Only adjust when the character itself changes.</p>
                  <div className="mt-4 grid gap-3">
                    <label className="space-y-1 text-sm">
                      <span className="text-text-muted">Class</span>
                      <input
                        className="w-full rounded-2xl border border-border-dark bg-bg px-3 py-2.5 text-text"
                        value={activeCharacter.class}
                        onChange={(event) => {
                          void saveCharacter({ ...activeCharacter, class: event.target.value });
                        }}
                      />
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="text-text-muted">Subclass</span>
                      <input
                        className="w-full rounded-2xl border border-border-dark bg-bg px-3 py-2.5 text-text"
                        value={activeCharacter.subclass}
                        onChange={(event) => {
                          void saveCharacter({ ...activeCharacter, subclass: event.target.value });
                        }}
                      />
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="text-text-muted">Casting Ability</span>
                      <input
                        className="w-full rounded-2xl border border-border-dark bg-bg px-3 py-2.5 text-text"
                        value={activeCharacter.castingAbility}
                        onChange={(event) => {
                          void saveCharacter({ ...activeCharacter, castingAbility: event.target.value });
                        }}
                      />
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="text-text-muted">Available Lists</span>
                      <input
                        className="w-full rounded-2xl border border-border-dark bg-bg px-3 py-2.5 text-text"
                        value={activeCharacter.availableLists.join(', ')}
                        onChange={(event) => {
                          const nextLists = event.target.value.split(',').map((entry) => entry.trim()).filter(Boolean);
                          const nextProfile = {
                            ...activeCharacter,
                            availableLists: nextLists,
                            preparationLimits: getPreparationLimits({
                              ...activeCharacter,
                              availableLists: nextLists,
                            }),
                          };
                          void saveCharacter(nextProfile);
                        }}
                      />
                    </label>
                  </div>
                </details>

                <div className="rounded-2xl border border-border-dark bg-bg px-4 py-4">
                  <h4 className="font-display text-xl text-text">Add Always Prepared</h4>
                  <input
                    className="mt-4 w-full rounded-2xl border border-border-dark bg-bg-2 px-3 py-2.5 text-sm text-text"
                    placeholder="Search spells to add as always prepared"
                    value={alwaysPreparedSearch}
                    onChange={(event) => setAlwaysPreparedSearch(event.target.value)}
                  />

                  <div className="mt-4 space-y-2">
                    {alwaysPreparedSearch.trim().length > 0 ? (
                      alwaysPreparedOptions.map(({ spell, addableLists, validLists }) => {
                        const selectedList = alwaysPreparedAssignedListBySpell[spell.id] || (addableLists.length === 1 ? addableLists[0] : '');
                        const blockedByLevel = validLists.length > 0 && addableLists.length === 0;

                        return (
                          <div key={spell.id} className="rounded-2xl border border-border-dark bg-bg-2 px-4 py-3 text-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="font-medium text-text">{spell.name}</p>
                                <p className="mt-1 text-xs text-text-muted">
                                  {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} · {getSpellLists(spell).join(', ') || '-'}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {addableLists.length > 1 ? (
                                  <select
                                    id={`always-list-${spell.id}`}
                                    className="rounded-xl border border-border-dark bg-bg px-3 py-2 text-sm text-text"
                                    value={selectedList}
                                    onChange={(event) => setAlwaysPreparedAssignedListBySpell((current) => ({
                                      ...current,
                                      [spell.id]: event.target.value,
                                    }))}
                                  >
                                    <option value="">Choose list</option>
                                    {addableLists.map((list) => (
                                      <option key={list} value={list}>{list}</option>
                                    ))}
                                  </select>
                                ) : null}

                                <button
                                  type="button"
                                  className={`rounded-xl border px-4 py-2 text-xs uppercase tracking-[0.18em] ${blockedByLevel ? 'border-border-dark bg-bg opacity-55' : 'border-gold-soft bg-gold-soft/20 text-text hover:bg-gold-soft/30'}`}
                                  disabled={blockedByLevel || !selectedList}
                                  onClick={() => void onAddAlwaysPrepared(spell.id, selectedList || null)}
                                >
                                  {blockedByLevel ? 'Blocked' : 'Add Always'}
                                </button>
                              </div>
                            </div>

                            {blockedByLevel ? (
                              <p className="mt-2 text-xs text-text-dim">No owned spell list can add this spell under the current max spell level rules.</p>
                            ) : null}
                          </div>
                        );
                      })
                    ) : null}

                    {alwaysPreparedSearch.trim().length > 0 && !alwaysPreparedOptions.length ? (
                      <p className="text-sm text-text-muted">No matching spells are available for this character.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            {error ? <p className="rounded-2xl border border-blood-soft bg-blood-soft px-4 py-3 text-sm text-blood">{error}</p> : null}
          </div>
        )}
      </section>

      <SpellDetailDrawer
        spell={selectedPreparedRow?.spell || null}
        assignedList={selectedPreparedRow?.entry.assignedList}
        mode={selectedPreparedRow?.entry.mode}
        onClose={() => setSelectedPreparedKey(null)}
      />
    </div>
  );
}
