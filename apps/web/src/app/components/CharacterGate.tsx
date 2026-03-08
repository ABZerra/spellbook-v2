import { FormEvent, useState } from 'react';
import { useApp } from '../state/AppContext';

const CASTING_ABILITIES = ['INT', 'WIS', 'CHA', 'CON', 'DEX', 'STR'];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function CharacterGate() {
  const { createCharacter } = useApp();

  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [subclass, setSubclass] = useState('');
  const [castingAbility, setCastingAbility] = useState('INT');
  const [availableLists, setAvailableLists] = useState('');
  const [spellsPerList, setSpellsPerList] = useState(8);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const id = slugify(name) || 'character';
      const lists = availableLists
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

      await createCharacter({
        id,
        name,
        class: className,
        subclass,
        castingAbility,
        availableLists: lists,
        preparationLimits: lists.map((list) => ({ list, limit: Math.max(1, spellsPerList) })),
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to create character.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-border-dark bg-bg-1/95 p-6 shadow-panel">
      <h1 className="font-display text-4xl text-text">Choose Your Character</h1>
      <p className="mt-2 text-sm text-text-muted">
        Spellbook is character-first. Create the character you want to prepare spells for.
      </p>

      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={(event) => void onSubmit(event)}>
        <label className="space-y-1 text-sm">
          <span className="text-text-muted">Character Name</span>
          <input
            className="w-full rounded-xl border border-border-dark bg-bg px-3 py-2 text-text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Aelric Stormward"
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-text-muted">Class</span>
          <input
            className="w-full rounded-xl border border-border-dark bg-bg px-3 py-2 text-text"
            value={className}
            onChange={(event) => setClassName(event.target.value)}
            placeholder="Wizard"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-text-muted">Subclass</span>
          <input
            className="w-full rounded-xl border border-border-dark bg-bg px-3 py-2 text-text"
            value={subclass}
            onChange={(event) => setSubclass(event.target.value)}
            placeholder="School of Abjuration"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-text-muted">Casting Ability</span>
          <select
            className="w-full rounded-xl border border-border-dark bg-bg px-3 py-2 text-text"
            value={castingAbility}
            onChange={(event) => setCastingAbility(event.target.value)}
          >
            {CASTING_ABILITIES.map((ability) => (
              <option key={ability} value={ability}>{ability}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-text-muted">Available Spell Lists (comma separated)</span>
          <input
            className="w-full rounded-xl border border-border-dark bg-bg px-3 py-2 text-text"
            value={availableLists}
            onChange={(event) => setAvailableLists(event.target.value)}
            placeholder="Wizard, Cleric"
          />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-text-muted">Number of Available Spells (per list)</span>
          <input
            className="w-full rounded-xl border border-border-dark bg-bg px-3 py-2 text-text"
            type="number"
            min={1}
            value={spellsPerList}
            onChange={(event) => setSpellsPerList(Number(event.target.value) || 1)}
          />
        </label>

        {error ? <p className="md:col-span-2 rounded-xl border border-blood-soft bg-blood-soft px-3 py-2 text-sm text-blood">{error}</p> : null}

        <button
          type="submit"
          className="md:col-span-2 rounded-xl border border-gold-soft bg-gold-soft/20 px-4 py-2 text-text hover:bg-gold-soft/30 disabled:opacity-50"
          disabled={busy}
        >
          {busy ? 'Creating...' : 'Create Character'}
        </button>
      </form>
    </div>
  );
}
