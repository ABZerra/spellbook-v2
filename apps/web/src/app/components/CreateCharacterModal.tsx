import { FormEvent, useState } from 'react';
import { normalizeListName } from '../domain/character';
import type { CatalogClassInfo } from '../domain/catalog';

interface CreateCharacterModalProps {
  catalogClasses: CatalogClassInfo[];
  onClose: () => void;
  onCreate: (input: {
    name: string;
    classes?: Array<{ name: string; subclass?: string }>;
    availableLists?: string[];
    preparationLimits?: Array<{ list: string; limit: number; maxSpellLevel: number }>;
  }) => Promise<void>;
  busy: boolean;
}

export function CreateCharacterModal({ catalogClasses, onClose, onCreate, busy }: CreateCharacterModalProps) {
  const [name, setName] = useState('');
  const [classRows, setClassRows] = useState<Array<{ className: string; subclass: string }>>([{ className: '', subclass: '' }]);
  const [maxSpells, setMaxSpells] = useState('');
  const [maxLevel, setMaxLevel] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleAddRow() {
    setClassRows((current) => [...current, { className: '', subclass: '' }]);
  }

  function handleRemoveRow(index: number) {
    setClassRows((current) => current.filter((_, i) => i !== index));
  }

  function handleClassChange(index: number, value: string) {
    setClassRows((current) =>
      current.map((row, i) => (i === index ? { className: value, subclass: '' } : row)),
    );
  }

  function handleSubclassChange(index: number, value: string) {
    setClassRows((current) =>
      current.map((row, i) => (i === index ? { ...row, subclass: value } : row)),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const classes = classRows
      .filter((row) => row.className)
      .map((row) => ({ name: row.className, subclass: row.subclass || undefined }));

    const lists = [...new Set(classes.map((c) => normalizeListName(c.name)))];
    const limit = maxSpells ? Math.max(1, Number(maxSpells) || 8) : 8;
    const spellLevel = maxLevel ? Math.max(0, Math.min(9, Number(maxLevel) || 9)) : 9;

    try {
      await onCreate({
        name,
        classes,
        availableLists: lists,
        preparationLimits: lists.map((list) => ({ list, limit, maxSpellLevel: spellLevel })),
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to create character.');
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Create character"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[1.45rem] border border-border-dark bg-bg-1 p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-[11px] uppercase tracking-[0.3em] text-text-dim">Create Character</p>
        <h2 className="mt-1 font-display text-2xl text-text">New Character</h2>

        <form className="mt-5 space-y-3 text-sm" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block space-y-1">
            <span className="text-text-muted">Character Name</span>
            <input
              className="w-full rounded-2xl border border-border-dark bg-bg px-3 py-2.5 text-text"
              placeholder="Aelric Stormward"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoFocus
            />
          </label>

          <div className="space-y-2">
            <span className="text-text-muted">Class</span>
            {classRows.map((row, index) => {
              const selectedClassesElsewhere = classRows
                .filter((_, i) => i !== index)
                .map((r) => r.className)
                .filter(Boolean);

              const availableClasses = catalogClasses.filter(
                (entry) => !selectedClassesElsewhere.includes(entry.name),
              );

              const classInfo = row.className
                ? catalogClasses.find((entry) => entry.name === row.className) || null
                : null;

              return (
                <div key={index} className="flex items-center gap-2">
                  <select
                    className="flex-1 rounded-2xl border border-border-dark bg-bg px-3 py-2.5 text-text"
                    value={row.className}
                    onChange={(event) => handleClassChange(index, event.target.value)}
                    required={index === 0}
                  >
                    <option value="">Select class</option>
                    {availableClasses.map((entry) => (
                      <option key={entry.name} value={entry.name}>
                        {entry.name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="flex-1 rounded-2xl border border-border-dark bg-bg px-3 py-2.5 text-text disabled:opacity-50"
                    value={row.subclass}
                    onChange={(event) => handleSubclassChange(index, event.target.value)}
                    disabled={!classInfo || classInfo.subclasses.length === 0}
                  >
                    <option value="">Subclass (optional)</option>
                    {(classInfo?.subclasses || []).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>

                  {classRows.length > 1 ? (
                    <button
                      type="button"
                      className="flex-shrink-0 rounded-full border border-border-dark bg-bg px-2.5 py-1.5 text-xs text-text-muted transition-colors hover:bg-bg-2 hover:text-text"
                      onClick={() => handleRemoveRow(index)}
                      aria-label={`Remove class row ${index + 1}`}
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              );
            })}

            <button
              type="button"
              className="text-xs uppercase tracking-[0.2em] text-text-dim transition-colors hover:text-text"
              onClick={handleAddRow}
            >
              + Add Class
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-text-muted">
                Max Spells per List <span className="text-text-dim">(optional)</span>
              </span>
              <input
                className="w-full rounded-2xl border border-border-dark bg-bg px-3 py-2.5 text-text"
                type="number"
                min={1}
                value={maxSpells}
                onChange={(event) => setMaxSpells(event.target.value)}
                placeholder="8"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-text-muted">
                Max Spell Level <span className="text-text-dim">(optional)</span>
              </span>
              <input
                className="w-full rounded-2xl border border-border-dark bg-bg px-3 py-2.5 text-text"
                type="number"
                min={0}
                max={9}
                value={maxLevel}
                onChange={(event) => setMaxLevel(event.target.value)}
                placeholder="9"
              />
            </label>
          </div>

          {error ? (
            <p className="rounded-2xl border border-blood-soft bg-blood-soft px-3 py-2 text-sm text-blood">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="rounded-2xl border border-border-dark bg-bg px-4 py-2.5 text-sm text-text-muted transition-colors hover:bg-bg-2 hover:text-text"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-2xl border border-gold-soft bg-gold-soft/20 px-4 py-2.5 text-sm text-text transition-colors hover:bg-gold-soft/30 disabled:opacity-50"
              disabled={busy}
            >
              {busy ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
