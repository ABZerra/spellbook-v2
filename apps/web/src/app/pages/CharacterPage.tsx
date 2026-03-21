import { useEffect, useMemo, useState } from 'react';
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
  getCharacterPreparationRuleSummaries,
  getGroupedPreparedVerificationRows,
} from './characterPresentation';
import { SpellDetailDrawer } from '../components/SpellDetailDrawer';
import { useApp } from '../state/AppContext';
import type { ClassEntry, SpellRecord } from '../types';

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
    activeCharacter,
    catalogClasses,
    saveCharacter,
    deleteCharacter,
    addPreparedSpell,
    removePreparedSpell,
    reassignPreparedSpell,
  } = useApp();

  const [error, setError] = useState<string | null>(null);
  const [editingRuleList, setEditingRuleList] = useState<string | null>(null);
  const [editingPreparedAssignmentKey, setEditingPreparedAssignmentKey] = useState<string | null>(null);
  const [selectedPreparedKey, setSelectedPreparedKey] = useState<string | null>(null);

  const [alwaysPreparedSearch, setAlwaysPreparedSearch] = useState('');
  const [alwaysPreparedAssignedListBySpell, setAlwaysPreparedAssignedListBySpell] = useState<Record<string, string>>({});

  const spellsById = useMemo(() => new Map(spells.map((spell) => [spell.id, spell])), [spells]);

  const cueMetadata = useMemo(
    () => (activeCharacter ? getCharacterCueMetadata(activeCharacter) : null),
    [activeCharacter],
  );

  const activeCharacterId = activeCharacter?.id ?? null;

  useEffect(() => {
    setEditingPreparedAssignmentKey(null);
  }, [activeCharacterId]);

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

  function onClassChange(rowIndex: number, newClassName: string) {
    if (!activeCharacter) return;

    const currentClasses = activeCharacter.classes;
    const oldClassName = currentClasses[rowIndex]?.name || '';

    const nextClasses: ClassEntry[] = currentClasses.map((entry, i) => {
      if (i !== rowIndex) return entry;
      return { name: newClassName, subclass: undefined };
    });

    // Recompute availableLists: keep lists that don't match any class name (manually added),
    // plus add the new class names
    const allClassNames = new Set(nextClasses.filter((c) => c.name).map((c) => normalizeListName(c.name)));
    const oldNormalized = oldClassName ? normalizeListName(oldClassName) : null;

    const manualLists = activeCharacter.availableLists.filter((list) => {
      const normalized = normalizeListName(list);
      // Keep if not matching any current class name (it's manually added)
      // but also remove the old class being replaced
      if (oldNormalized && normalized === oldNormalized) return false;
      return !allClassNames.has(normalized) || !currentClasses.some((c) => c.name && normalizeListName(c.name) === normalized);
    });

    const classLists = nextClasses.filter((c) => c.name).map((c) => normalizeListName(c.name));
    const nextLists = [...new Set([...classLists, ...manualLists])];

    const nextProfile = {
      ...activeCharacter,
      classes: nextClasses,
      availableLists: nextLists,
      preparationLimits: getPreparationLimits({ ...activeCharacter, availableLists: nextLists }),
    };

    void saveCharacter(nextProfile);
  }

  function onSubclassChange(rowIndex: number, newSubclass: string) {
    if (!activeCharacter) return;

    const nextClasses: ClassEntry[] = activeCharacter.classes.map((entry, i) => {
      if (i !== rowIndex) return entry;
      return { ...entry, subclass: newSubclass || undefined };
    });

    void saveCharacter({ ...activeCharacter, classes: nextClasses });
  }

  function onCastingAbilityChange(rowIndex: number, newAbility: string) {
    if (!activeCharacter) return;

    const nextClasses: ClassEntry[] = activeCharacter.classes.map((entry, i) => {
      if (i !== rowIndex) return entry;
      return { ...entry, castingAbility: newAbility || undefined };
    });

    void saveCharacter({ ...activeCharacter, classes: nextClasses });
  }

  function onAddClassRow() {
    if (!activeCharacter) return;

    const nextClasses: ClassEntry[] = [...activeCharacter.classes, { name: '', subclass: undefined }];
    void saveCharacter({ ...activeCharacter, classes: nextClasses });
  }

  function onRemoveClassRow(rowIndex: number) {
    if (!activeCharacter) return;

    const removedClass = activeCharacter.classes[rowIndex];
    const nextClasses: ClassEntry[] = activeCharacter.classes.filter((_, i) => i !== rowIndex);

    // Remove the list for the removed class (unless it matches a remaining class)
    const remainingClassNames = new Set(nextClasses.filter((c) => c.name).map((c) => normalizeListName(c.name)));
    const removedNorm = removedClass?.name ? normalizeListName(removedClass.name) : null;

    const nextLists = activeCharacter.availableLists.filter((list) => {
      if (!removedNorm) return true;
      if (normalizeListName(list) === removedNorm && !remainingClassNames.has(removedNorm)) return false;
      return true;
    });

    const nextProfile = {
      ...activeCharacter,
      classes: nextClasses.length > 0 ? nextClasses : [{ name: '', subclass: undefined }],
      availableLists: nextLists,
      preparationLimits: getPreparationLimits({ ...activeCharacter, availableLists: nextLists }),
    };

    void saveCharacter(nextProfile);
  }

  // Classes already selected in other rows (for filtering dropdowns)
  const selectedClassNames = useMemo(
    () => new Set((activeCharacter?.classes || []).filter((c) => c.name).map((c) => c.name)),
    [activeCharacter],
  );

  return (
    <div className="space-y-4">
      <section className="space-y-4">

        {!activeCharacter ? (
          <div className="rounded-[1.45rem] border border-border-dark bg-bg-1/92 p-5">
            <h2 className="font-display text-3xl text-text">No character selected</h2>
            <p className="mt-3 max-w-2xl text-sm text-text-muted">
              No character selected. Create one from the header dropdown.
            </p>
            {error ? <p className="mt-4 rounded-2xl border border-blood-soft bg-blood-soft px-4 py-3 text-sm text-blood">{error}</p> : null}
          </div>
        ) : (
          <div className="space-y-4">
            <section className="rounded-[1.45rem] border border-border-dark bg-bg-1/92 px-4 py-4 md:px-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-text-dim">Active Profile</p>
                  <h2 className="mt-1 font-display text-2xl text-text md:text-3xl break-words">{activeCharacter.name}</h2>
                  {cueMetadata?.classDisplayString ? (
                    <p className="mt-1 text-sm text-text-muted">{cueMetadata.classDisplayString}</p>
                  ) : null}
                </div>

                <button
                  type="button"
                  className="rounded-2xl border border-blood-soft bg-blood-soft px-4 py-2 text-sm text-blood flex-shrink-0"
                  onClick={() => {
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

                <details className="rounded-2xl border border-border-dark bg-bg px-4 py-4">
                  <summary className="cursor-pointer list-none font-display text-xl text-text">Identity</summary>
                  <p className="mt-2 text-sm text-text-muted">Only adjust when the character itself changes.</p>
                  <div className="mt-4 space-y-2">
                    {(activeCharacter.classes.length > 0 ? activeCharacter.classes : [{ name: '', subclass: undefined }]).map((classEntry, rowIndex) => {
                      const classInfo = catalogClasses.find((c) => c.name === classEntry.name) || null;
                      const listName = classEntry.name ? normalizeListName(classEntry.name) : null;
                      const ruleSummary = listName ? preparationRuleSummaries.find((s) => s.list === listName) : null;

                      return (
                        <div key={rowIndex} className="flex flex-wrap items-center gap-2 rounded-xl border border-border-dark bg-bg-2 px-3 py-2">
                          <select
                            className="rounded-xl border border-border-dark bg-bg px-3 py-1.5 text-sm text-text"
                            value={classEntry.name}
                            onChange={(event) => onClassChange(rowIndex, event.target.value)}
                          >
                            <option value="">Class</option>
                            {catalogClasses.map((entry) => (
                              <option
                                key={entry.name}
                                value={entry.name}
                                disabled={entry.name !== classEntry.name && selectedClassNames.has(entry.name)}
                              >
                                {entry.name}
                              </option>
                            ))}
                          </select>

                          <select
                            className="rounded-xl border border-border-dark bg-bg px-3 py-1.5 text-sm text-text"
                            value={classEntry.subclass || ''}
                            disabled={!classInfo || classInfo.subclasses.length === 0}
                            onChange={(event) => onSubclassChange(rowIndex, event.target.value)}
                          >
                            <option value="">Subclass</option>
                            {(classInfo?.subclasses || []).map((sub) => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>

                          <select
                            className="rounded-xl border border-border-dark bg-bg px-3 py-1.5 text-sm text-text"
                            value={classEntry.castingAbility || ''}
                            onChange={(event) => onCastingAbilityChange(rowIndex, event.target.value)}
                          >
                            <option value="">Ability</option>
                            {['Intelligence', 'Wisdom', 'Charisma'].map((ability) => (
                              <option key={ability} value={ability}>{ability}</option>
                            ))}
                          </select>

                          {ruleSummary ? (
                            <>
                              <label className="flex items-center gap-1 text-xs">
                                <span className="text-text-dim">Spell limit</span>
                                <input
                                  className="w-14 rounded-lg border border-border-dark bg-bg px-2 py-1 text-text"
                                  type="number"
                                  min={1}
                                  value={ruleSummary.limit}
                                  onChange={(event) => {
                                    void onUpdatePreparationRule(ruleSummary.list, {
                                      limit: Number(event.target.value) || 1,
                                    }).catch((nextError) => {
                                      setError(nextError instanceof Error ? nextError.message : 'Unable to update preparation rule.');
                                    });
                                  }}
                                />
                              </label>
                              <label className="flex items-center gap-1 text-xs">
                                <span className="text-text-dim">Max lvl</span>
                                <input
                                  className="w-14 rounded-lg border border-border-dark bg-bg px-2 py-1 text-text"
                                  type="number"
                                  min={0}
                                  max={9}
                                  value={ruleSummary.maxSpellLevel}
                                  onChange={(event) => {
                                    void onUpdatePreparationRule(ruleSummary.list, {
                                      maxSpellLevel: Number(event.target.value) || 0,
                                    }).catch((nextError) => {
                                      setError(nextError instanceof Error ? nextError.message : 'Unable to update preparation rule.');
                                    });
                                  }}
                                />
                              </label>
                            </>
                          ) : null}

                          {activeCharacter.classes.length > 1 ? (
                            <button
                              type="button"
                              className="rounded-xl border border-blood-soft bg-blood-soft/10 px-3 py-1.5 text-xs text-blood hover:bg-blood-soft/20"
                              onClick={() => onRemoveClassRow(rowIndex)}
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      className="mt-1 rounded-xl border border-border-dark bg-bg-2 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-text-muted hover:bg-bg hover:text-text"
                      onClick={onAddClassRow}
                    >
                      + Add Class
                    </button>
                  </div>
                </details>
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
