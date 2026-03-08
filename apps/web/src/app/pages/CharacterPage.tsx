import { FormEvent, useMemo, useState } from 'react';
import { getPreparationLimits } from '../domain/character';
import { useApp } from '../state/AppContext';

export function CharacterPage() {
  const {
    characters,
    activeCharacter,
    createCharacter,
    saveCharacter,
    deleteCharacter,
    setActiveCharacter,
  } = useApp();

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [createName, setCreateName] = useState('');
  const [createLists, setCreateLists] = useState('');
  const [createLimit, setCreateLimit] = useState(8);

  const summary = useMemo(() => {
    if (!activeCharacter) return null;
    return {
      prepared: activeCharacter.preparedSpellIds.length,
      queued: activeCharacter.nextPreparationQueue.length,
      ideas: activeCharacter.savedIdeas.length,
    };
  }, [activeCharacter]);

  if (!activeCharacter) {
    return <p className="text-sm text-text-muted">No character selected.</p>;
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const lists = createLists.split(',').map((entry) => entry.trim()).filter(Boolean);

      await createCharacter({
        name: createName,
        availableLists: lists,
        preparationLimits: lists.map((list) => ({ list, limit: Math.max(1, createLimit) })),
      });

      setCreateName('');
      setCreateLists('');
      setCreateLimit(8);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to create character.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border-dark bg-bg-1/95 p-4">
        <h1 className="font-display text-3xl">Character</h1>
        <p className="mt-1 text-sm text-text-muted">
          Configure spell lists and preparation limits. Character id stays internal.
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
            <input
              className="w-full rounded-xl border border-border-dark bg-bg px-3 py-2 text-sm text-text"
              type="number"
              min={1}
              value={createLimit}
              onChange={(event) => setCreateLimit(Number(event.target.value) || 1)}
              placeholder="Preparation limit per list"
            />
            <button type="submit" className="w-full rounded-xl border border-gold-soft bg-gold-soft/20 px-3 py-2 text-sm" disabled={busy}>
              {busy ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>

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
            <p className="text-sm text-text-muted">Preparation limits per list</p>
            <div className="grid gap-2 md:grid-cols-2">
              {activeCharacter.preparationLimits.map((entry) => (
                <label key={entry.list} className="rounded-xl border border-border-dark bg-bg px-3 py-2 text-sm">
                  <span className="text-text-muted">{entry.list}</span>
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
              ))}
            </div>
          </div>

          {summary ? (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-border-dark bg-bg px-3 py-2 text-sm">Prepared: {summary.prepared}</div>
              <div className="rounded-xl border border-border-dark bg-bg px-3 py-2 text-sm">Queued: {summary.queued}</div>
              <div className="rounded-xl border border-border-dark bg-bg px-3 py-2 text-sm">Queued from Catalog: {summary.ideas}</div>
            </div>
          ) : null}

          {error ? <p className="rounded-xl border border-blood-soft bg-blood-soft px-3 py-2 text-sm text-blood">{error}</p> : null}
        </div>
      </section>
    </div>
  );
}
