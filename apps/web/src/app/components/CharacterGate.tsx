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
    <div className="mx-auto max-w-6xl rounded-[2rem] border border-border-dark bg-bg-1/95 shadow-panel">
      <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="space-y-5">
          <p className="text-[11px] uppercase tracking-[0.34em] text-text-dim">First Setup</p>
          <div className="space-y-3">
            <h1 className="font-display text-4xl text-text md:text-5xl">Choose Your Character</h1>
            <p className="max-w-xl text-sm text-text-muted md:text-base">
              Spellbook works best when it knows who you are preparing for. Start with one character, then browse every spell through that lens.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border-dark bg-bg px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.28em] text-text-dim">1</p>
              <p className="mt-2 font-display text-xl text-text">Pick a lens</p>
              <p className="mt-1 text-sm text-text-muted">Filter the catalog to the spell lists your character can actually use.</p>
            </div>
            <div className="rounded-2xl border border-border-dark bg-bg px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.28em] text-text-dim">2</p>
              <p className="mt-2 font-display text-xl text-text">Stage the next rest</p>
              <p className="mt-1 text-sm text-text-muted">Queue swaps, mark replacements, and keep track of what changes next.</p>
            </div>
            <div className="rounded-2xl border border-border-dark bg-bg px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.28em] text-text-dim">3</p>
              <p className="mt-2 font-display text-xl text-text">Lock it in</p>
              <p className="mt-1 text-sm text-text-muted">Apply the final plan when the spell list looks right.</p>
            </div>
          </div>
        </section>

        <form className="grid gap-4 rounded-[1.75rem] border border-moon-border bg-moon-paper px-5 py-5 text-moon-ink md:grid-cols-2 md:px-6 md:py-6" onSubmit={(event) => void onSubmit(event)}>
          <div className="md:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-moon-ink-muted">Character Profile</p>
            <p className="mt-2 font-display text-3xl">Build the spell lens</p>
            <p className="mt-1 text-sm text-moon-ink-muted">The basics here decide what the rest of Spellbook will surface and stage.</p>
          </div>

          <label className="space-y-1 text-sm">
            <span className="text-moon-ink-muted">Character Name</span>
            <input
              className="w-full rounded-xl border border-moon-border bg-moon-paper-2 px-3 py-2 text-moon-ink"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Aelric Stormward"
              required
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-moon-ink-muted">Class</span>
            <input
              className="w-full rounded-xl border border-moon-border bg-moon-paper-2 px-3 py-2 text-moon-ink"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              placeholder="Wizard"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-moon-ink-muted">Subclass</span>
            <input
              className="w-full rounded-xl border border-moon-border bg-moon-paper-2 px-3 py-2 text-moon-ink"
              value={subclass}
              onChange={(event) => setSubclass(event.target.value)}
              placeholder="School of Abjuration"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-moon-ink-muted">Casting Ability</span>
            <select
              className="w-full rounded-xl border border-moon-border bg-moon-paper-2 px-3 py-2 text-moon-ink"
              value={castingAbility}
              onChange={(event) => setCastingAbility(event.target.value)}
            >
              {CASTING_ABILITIES.map((ability) => (
                <option key={ability} value={ability}>{ability}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-moon-ink-muted">Available Spell Lists</span>
            <input
              className="w-full rounded-xl border border-moon-border bg-moon-paper-2 px-3 py-2 text-moon-ink"
              value={availableLists}
              onChange={(event) => setAvailableLists(event.target.value)}
              placeholder="Wizard, Cleric"
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-moon-ink-muted">Preparation Slots Per List</span>
            <input
              className="w-full rounded-xl border border-moon-border bg-moon-paper-2 px-3 py-2 text-moon-ink"
              type="number"
              min={1}
              value={spellsPerList}
              onChange={(event) => setSpellsPerList(Number(event.target.value) || 1)}
            />
          </label>

          {error ? <p className="md:col-span-2 rounded-xl border border-blood-soft bg-blood-soft px-3 py-2 text-sm text-blood">{error}</p> : null}

          <button
            type="submit"
            className="md:col-span-2 rounded-xl border border-moon-border bg-moon-ink px-4 py-3 text-moon-paper transition-opacity hover:opacity-92 disabled:opacity-50"
            disabled={busy}
          >
            {busy ? 'Creating...' : 'Open Spellbook'}
          </button>
        </form>
      </div>
    </div>
  );
}
