import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getAddableAssignmentLists, getPreparationLimits, getSpellLists, getValidAssignmentLists } from '../domain/character';
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

  const summary = useMemo(() => {
    if (!activeCharacter) return null;
    return {
      prepared: activeCharacter.preparedSpells.length,
      alwaysPrepared: activeCharacter.preparedSpells.filter((entry) => entry.mode === 'always').length,
      queued: activeCharacter.nextPreparationQueue.length,
    };
  }, [activeCharacter]);

  const preparedRows = useMemo(() => {
    if (!activeCharacter) return [];

    const occurrenceByKey = new Map<string, number>();

    return activeCharacter.preparedSpells
      .map((entry) => {
        const key = `${entry.spellId}::${entry.assignedList}::${entry.mode}`;
        const occurrenceIndex = occurrenceByKey.get(key) || 0;
        occurrenceByKey.set(key, occurrenceIndex + 1);

        return {
        entry,
        occurrenceIndex,
        spell: spellsById.get(entry.spellId) || null,
        validLists: (() => {
          const spell = spellsById.get(entry.spellId);
          if (!spell) return [];
          return getValidAssignmentLists(spell, activeCharacter);
        })(),
      };
      })
      .sort((left, right) => {
        const leftName = left.spell?.name || left.entry.spellId;
        const rightName = right.spell?.name || right.entry.spellId;
        return left.entry.assignedList.localeCompare(right.entry.assignedList)
          || leftName.localeCompare(rightName)
          || left.entry.mode.localeCompare(right.entry.mode);
      });
  }, [activeCharacter, spellsById]);

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

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border-dark bg-bg-1/95 p-4">
        <h1 className="font-display text-3xl">Character</h1>
        <p className="mt-1 text-sm text-text-muted">
          Configure spell lists, prepared-state rules, and long-lived always prepared spells.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3 rounded-2xl border border-border-dark bg-bg-1/95 p-4">
          <h2 className="font-display text-xl">Profiles</h2>
          {characters.map((character) => (
            <button
              key={character.id}
              type="button"
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${character.id === activeCharacter.id ? 'border-gold-soft bg-gold-soft/20' : 'border-border-dark bg-bg'}`}
              onClick={() => setActiveCharacter(character.id)}
            >
              <p className="font-medium text-text">{character.name}</p>
            </button>
          ))}

          <form className="space-y-2 border-t border-border-dark pt-3" onSubmit={(event) => void onCreate(event)}>
            <h3 className="text-sm font-semibold">Create character</h3>
            <input
              className="w-full rounded-xl border border-border-dark bg-bg px-3 py-2 text-sm text-text"
              placeholder="Character name"
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              required
            />
            <input
              className="w-full rounded-xl border border-border-dark bg-bg px-3 py-2 text-sm text-text"
              placeholder="Lists (Wizard, Cleric)"
              value={createLists}
              onChange={(event) => setCreateLists(event.target.value)}
            />
            {parsedCreateLists.map((list) => (
              <label key={list} className="block rounded-xl border border-border-dark bg-bg px-3 py-2 text-sm">
                <span className="text-text-muted">{list} limit</span>
                <input
                  className="mt-1 w-full rounded-md border border-border-dark bg-bg-2 px-2 py-1 text-text"
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
            <button type="submit" className="w-full rounded-xl border border-gold-soft bg-gold-soft/20 px-3 py-2 text-sm" disabled={busy}>
              {busy ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>

        {!activeCharacter ? (
          <div className="rounded-2xl border border-border-dark bg-bg-1/95 p-4">
            <h2 className="font-display text-2xl">No Active Character</h2>
            <p className="mt-2 text-sm text-text-muted">
              Create a character from the left panel to start assigning list limits, always prepared spells, and queue rules.
            </p>
            {error ? <p className="mt-4 rounded-xl border border-blood-soft bg-blood-soft px-3 py-2 text-sm text-blood">{error}</p> : null}
          </div>
        ) : (
        <div className="space-y-4 rounded-2xl border border-border-dark bg-bg-1/95 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl">{activeCharacter.name}</h2>
            </div>
            <button
              type="button"
              className="rounded-xl border border-blood-soft bg-blood-soft px-3 py-2 text-xs text-blood"
              onClick={() => {
                if (characters.length <= 1) {
                  setError('At least one character must remain.');
                  return;
                }
                void deleteCharacter(activeCharacter.id);
              }}
            >
              Delete
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-text-muted">Class</span>
              <input
                className="w-full rounded-xl border border-border-dark bg-bg px-3 py-2 text-text"
                value={activeCharacter.class}
                onChange={(event) => {
                  void saveCharacter({ ...activeCharacter, class: event.target.value });
                }}
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-text-muted">Subclass</span>
              <input
                className="w-full rounded-xl border border-border-dark bg-bg px-3 py-2 text-text"
                value={activeCharacter.subclass}
                onChange={(event) => {
                  void saveCharacter({ ...activeCharacter, subclass: event.target.value });
                }}
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-text-muted">Casting Ability</span>
              <input
                className="w-full rounded-xl border border-border-dark bg-bg px-3 py-2 text-text"
                value={activeCharacter.castingAbility}
                onChange={(event) => {
                  void saveCharacter({ ...activeCharacter, castingAbility: event.target.value });
                }}
              />
            </label>

            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-text-muted">Available Lists (comma separated)</span>
              <input
                className="w-full rounded-xl border border-border-dark bg-bg px-3 py-2 text-text"
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

          <div className="space-y-2">
            <p className="text-sm text-text-muted">Preparation rules per list</p>
            <div className="grid gap-2 md:grid-cols-2">
              {activeCharacter.preparationLimits.map((entry) => (
                <div key={entry.list} className="rounded-xl border border-border-dark bg-bg px-3 py-2 text-sm">
                  <p className="text-text-muted">{entry.list}</p>
                  <label className="mt-2 block">
                    <span className="text-xs text-text-dim">Preparation limit</span>
                    <input
                      className="mt-1 w-full rounded-md border border-border-dark bg-bg-2 px-2 py-1 text-text"
                      type="number"
                      min={1}
                      value={entry.limit}
                      onChange={(event) => {
                        const nextLimits = activeCharacter.preparationLimits.map((limitEntry) => (
                          limitEntry.list === entry.list
                            ? { ...limitEntry, limit: Math.max(1, Number(event.target.value) || 1) }
                            : limitEntry
                        ));
                        void saveCharacter({ ...activeCharacter, preparationLimits: nextLimits });
                      }}
                    />
                  </label>
                  <label className="mt-3 block">
                    <span className="text-xs text-text-dim">Max spell level for new additions</span>
                    <input
                      className="mt-1 w-full rounded-md border border-border-dark bg-bg-2 px-2 py-1 text-text"
                      type="number"
                      min={0}
                      max={9}
                      value={entry.maxSpellLevel}
                      onChange={(event) => {
                        const nextLimits = activeCharacter.preparationLimits.map((limitEntry) => (
                          limitEntry.list === entry.list
                            ? { ...limitEntry, maxSpellLevel: Math.max(0, Math.min(9, Number(event.target.value) || 0)) }
                            : limitEntry
                        ));
                        void saveCharacter({ ...activeCharacter, preparationLimits: nextLimits });
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {summary ? (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-border-dark bg-bg px-3 py-2 text-sm">Prepared: {summary.prepared}</div>
              <div className="rounded-xl border border-border-dark bg-bg px-3 py-2 text-sm">Always Prepared: {summary.alwaysPrepared}</div>
              <div className="rounded-xl border border-border-dark bg-bg px-3 py-2 text-sm">Queued: {summary.queued}</div>
            </div>
          ) : null}

          <section className="space-y-3 rounded-2xl border border-border-dark bg-bg px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-xl">Current Prepared</h3>
              <p className="text-xs text-text-dim">Manage list corrections directly here.</p>
            </div>

            <div className="space-y-2">
              {preparedRows.map(({ entry, occurrenceIndex, spell, validLists }) => (
                <div key={`${entry.spellId}:${entry.assignedList}:${entry.mode}:${occurrenceIndex}`} className="rounded-xl border border-border-dark bg-bg-2 px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-text">{spell?.name || entry.spellId}</p>
                        {entry.mode === 'always' ? (
                          <span className="rounded-full border border-gold-soft bg-gold-soft/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-muted">
                            Always Prepared
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-text-dim">
                        {entry.assignedList} · {spell ? (spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`) : 'Unknown level'}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="rounded-xl border border-border-dark bg-bg px-3 py-1 text-xs"
                      onClick={() => {
                        void removePreparedSpell(entry.spellId, entry.assignedList, entry.mode, occurrenceIndex).catch((nextError) => {
                          setError(nextError instanceof Error ? nextError.message : 'Unable to remove prepared spell.');
                        });
                      }}
                    >
                      Remove
                    </button>
                  </div>

                  {validLists.length > 1 ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <label className="text-text-muted" htmlFor={`prepared-list-${entry.spellId}-${entry.mode}-${occurrenceIndex}`}>Change List</label>
                      <select
                        id={`prepared-list-${entry.spellId}-${entry.mode}-${occurrenceIndex}`}
                        className="rounded-lg border border-border-dark bg-bg px-2 py-1 text-text"
                        value={entry.assignedList}
                        onChange={(event) => {
                          void reassignPreparedSpell(entry.spellId, entry.assignedList, entry.mode, occurrenceIndex, event.target.value).catch((nextError) => {
                            setError(nextError instanceof Error ? nextError.message : 'Unable to reassign prepared spell.');
                          });
                        }}
                      >
                        {validLists.map((list) => (
                          <option key={list} value={list}>{list}</option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </div>
              ))}

              {!preparedRows.length ? <p className="text-sm text-text-muted">No prepared spells on this character yet.</p> : null}
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-border-dark bg-bg px-4 py-3">
            <h3 className="font-display text-xl">Add Always Prepared Spell</h3>
            <input
              className="w-full rounded-xl border border-border-dark bg-bg-2 px-3 py-2 text-sm text-text"
              placeholder="Search spells to add as always prepared"
              value={alwaysPreparedSearch}
              onChange={(event) => setAlwaysPreparedSearch(event.target.value)}
            />

            <div className="space-y-2">
              {alwaysPreparedSearch.trim().length === 0 ? (
                <p className="text-sm text-text-muted">Search to add long-lived always prepared spells.</p>
              ) : (
                alwaysPreparedOptions.map(({ spell, addableLists, validLists }) => {
                  const selectedList = alwaysPreparedAssignedListBySpell[spell.id] || (addableLists.length === 1 ? addableLists[0] : '');
                  const blockedByLevel = validLists.length > 0 && addableLists.length === 0;

                  return (
                    <div key={spell.id} className="rounded-xl border border-border-dark bg-bg-2 px-3 py-2 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-text">{spell.name}</p>
                          <p className="text-xs text-text-dim">
                            {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} · {getSpellLists(spell).join(', ') || '-'}
                          </p>
                        </div>

                        <button
                          type="button"
                          className={`rounded-xl border px-3 py-1 text-xs ${blockedByLevel ? 'border-border-dark bg-bg opacity-55' : 'border-gold-soft bg-gold-soft/20'}`}
                          disabled={blockedByLevel || !selectedList}
                          onClick={() => void onAddAlwaysPrepared(spell.id, selectedList || null)}
                        >
                          {blockedByLevel ? 'Blocked' : 'Add Always'}
                        </button>
                      </div>

                      {addableLists.length > 1 ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <label className="text-text-muted" htmlFor={`always-list-${spell.id}`}>Spell List</label>
                          <select
                            id={`always-list-${spell.id}`}
                            className="rounded-lg border border-border-dark bg-bg px-2 py-1 text-text"
                            value={selectedList}
                            onChange={(event) => setAlwaysPreparedAssignedListBySpell((current) => ({
                              ...current,
                              [spell.id]: event.target.value,
                            }))}
                          >
                            <option value="">Choose spell list</option>
                            {addableLists.map((list) => (
                              <option key={list} value={list}>{list}</option>
                            ))}
                          </select>
                        </div>
                      ) : null}

                      {blockedByLevel ? (
                        <p className="mt-2 text-xs text-text-dim">No owned spell list can add this spell under the current max spell level rules.</p>
                      ) : null}
                    </div>
                  );
                })
              )}

              {alwaysPreparedSearch.trim().length > 0 && !alwaysPreparedOptions.length ? (
                <p className="text-sm text-text-muted">No matching spells are available for this character.</p>
              ) : null}
            </div>
          </section>

          {error ? <p className="rounded-xl border border-blood-soft bg-blood-soft px-3 py-2 text-sm text-blood">{error}</p> : null}
        </div>
        )}
      </section>
    </div>
  );
}
