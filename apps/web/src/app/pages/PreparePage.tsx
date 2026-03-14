import { useEffect, useMemo, useState } from 'react';
import { buildPreparationUsage, getAddableAssignmentLists, getSpellAssignmentList, getValidAssignmentLists } from '../domain/character';
import { buildPlanDiff } from '../domain/plan';
import { computeApplyResult } from '../domain/prepareQueue';
import { PreparedDrawer } from '../components/PreparedDrawer';
import { useApp } from '../state/AppContext';

export function PreparePage() {
  const {
    spells,
    activeCharacter,
    queueSpellForNextPreparation,
    unqueueSpellForNextPreparation,
    setQueuedSpellIntent,
    setQueuedSpellAssignedList,
    setQueuedSpellReplaceTarget,
    restoreQueueFromPrepared,
    applyPlan,
  } = useApp();

  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [preparedDrawerOpen, setPreparedDrawerOpen] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const spellsById = useMemo(() => new Map(spells.map((spell) => [spell.id, spell])), [spells]);

  const queueEntries = activeCharacter?.nextPreparationQueue || [];
  const queuedSpellIds = useMemo(() => new Set(queueEntries.map((entry) => entry.spellId)), [queueEntries]);

  const queuedRows = useMemo(() => {
    const rows: Array<{ entry: typeof queueEntries[number]; spell: typeof spells[number] }> = [];
    for (const entry of queueEntries) {
      const spell = spellsById.get(entry.spellId);
      if (!spell) continue;
      rows.push({ entry, spell });
    }
    return rows;
  }, [queueEntries, spells, spellsById]);

  const filtered = useMemo(() => {
    if (!activeCharacter) return [];
    const q = search.toLowerCase().trim();
    if (!q) return [];
    return spells.filter((spell) => {
      if (queuedSpellIds.has(spell.id)) return false;
      return spell.name.toLowerCase().includes(q) || spell.notes.toLowerCase().includes(q);
    });
  }, [activeCharacter, spells, search, queuedSpellIds]);

  const preview = useMemo(() => {
    if (!activeCharacter) return { result: null, error: null as string | null };
    try {
      const result = computeApplyResult({
        profile: activeCharacter,
        spellsById,
        queue: queueEntries,
      });
      return { result, error: null as string | null };
    } catch (nextError) {
      return {
        result: null,
        error: nextError instanceof Error ? nextError.message : 'Unable to validate queue.',
      };
    }
  }, [activeCharacter, spellsById, queueEntries]);

  const limitsSummary = useMemo(() => {
    if (!activeCharacter) return [];
    const projected = preview.result?.finalPreparedSpells || activeCharacter.preparedSpells;
    const counts = buildPreparationUsage(projected, spellsById);

    return activeCharacter.preparationLimits.map((entry) => ({
      list: entry.list,
      used: counts.get(entry.list) || 0,
      limit: entry.limit,
    }));
  }, [activeCharacter, preview.result, spellsById]);

  const diff = useMemo(() => {
    if (!activeCharacter || !preview.result) return [];
    return buildPlanDiff(activeCharacter.preparedSpells, preview.result.finalPreparedSpells);
  }, [activeCharacter, preview.result]);

  const highlightedReplaceTargets = useMemo(() => new Set(queueEntries
    .filter((entry) => entry.intent === 'replace' && entry.replaceTarget)
    .map((entry) => String(entry.replaceTarget))), [queueEntries]);

  useEffect(() => {
    setShowValidationErrors(false);
  }, [queueEntries]);

  if (!activeCharacter) {
    return <p className="text-sm text-text-muted">Create or choose a character first.</p>;
  }

  async function onApply() {
    if (preview.error) {
      setShowValidationErrors(true);
      setError(preview.error);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const output = await applyPlan();
      const skipped = output.summary.queueOnlySkipped;
      const executed = output.summary.adds + output.summary.replacements;
      const ackStatus = output.ack.acknowledged
        ? output.ack.ok
          ? 'Extension acknowledged payload.'
          : `Extension rejected payload: ${output.ack.error || 'unknown error'}.`
        : 'No extension acknowledgement received.';

      setLastResult(`Applied ${executed} change(s), skipped ${skipped} queue-only item(s). ${ackStatus}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to apply next preparation.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border-dark bg-bg-1/95 p-4">
        <h1 className="font-display text-3xl">Prepare</h1>
        <p className="mt-1 text-sm text-text-muted">
          Queue ideas, mark explicit replacements, and apply only the actions you want now.
        </p>
      </section>

      <section className="rounded-2xl border border-border-dark bg-bg-1/95 p-4">
        <h2 className="font-display text-xl">Queue More Spells</h2>
        <input
          className="mt-3 w-full rounded-xl border border-border-dark bg-bg px-3 py-2 text-sm text-text"
          placeholder="Search spells to queue"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="mt-3 max-h-[32vh] space-y-2 overflow-y-auto">
          {search.trim().length === 0 ? (
            <p className="text-sm text-text-muted">Type to search and queue spells.</p>
          ) : (
            <>
              {filtered.map((spell) => (
                (() => {
                  const validLists = getValidAssignmentLists(spell, activeCharacter);
                  const addableLists = getAddableAssignmentLists(spell, activeCharacter);
                  const listLabel = addableLists.length === 1
                    ? addableLists[0]
                    : addableLists.length > 1
                      ? 'Choose in queue'
                      : validLists.length > 0
                        ? 'Blocked by max level'
                        : '-';
                  const blocked = validLists.length > 0 && addableLists.length === 0;

                  return (
                    <div key={spell.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-dark bg-bg px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-text">{spell.name}</p>
                        <p className="text-xs text-text-dim">{`${listLabel} · ${spell.castingTime || '-'} · Save: ${spell.save || '-'}`}</p>
                        {blocked ? (
                          <p className="mt-1 text-xs text-text-dim">This spell is above every owned list&apos;s max spell level.</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className={`rounded-xl border px-3 py-1 text-xs ${blocked ? 'border-border-dark bg-bg opacity-55' : 'border-gold-soft bg-gold-soft/20'}`}
                        disabled={blocked}
                        onClick={() => void queueSpellForNextPreparation(spell.id).catch((nextError) => {
                          setError(nextError instanceof Error ? nextError.message : 'Unable to queue spell.');
                        })}
                      >
                        {blocked ? 'Blocked' : 'Queue'}
                      </button>
                    </div>
                  );
                })()
              ))}
              {!filtered.length ? <p className="text-sm text-text-muted">No spells available to add.</p> : null}
            </>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border-dark bg-bg-1/95 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">Next Preparation Queue</h2>
          <button
            type="button"
            className="rounded-lg border border-border-dark bg-bg px-3 py-1 text-xs"
            onClick={() => setPreparedDrawerOpen(true)}
          >
            View Current Prepared
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {queuedRows.map(({ entry, spell }) => {
            const validLists = getValidAssignmentLists(spell, activeCharacter);
            const addableLists = getAddableAssignmentLists(spell, activeCharacter);
            const queuedList = entry.assignedList || (addableLists.length === 1 ? addableLists[0] : null);
            const selectableLists = entry.assignedList && !addableLists.includes(entry.assignedList)
              ? [entry.assignedList, ...addableLists.filter((list) => list !== entry.assignedList)]
              : addableLists;
            const replaceOptions = activeCharacter.preparedSpells
              .filter((preparedEntry) => preparedEntry.assignedList === queuedList)
              .map((preparedEntry) => ({
                ...preparedEntry,
                spell: spellsById.get(preparedEntry.spellId),
              }))
              .filter((candidate): candidate is typeof candidate & { spell: NonNullable<typeof candidate.spell> } => Boolean(candidate.spell));

            const replaceMissing = entry.intent === 'replace' && !entry.replaceTarget;
            const listMissing = !queuedList && addableLists.length > 1;
            const listBlocked = Boolean(entry.assignedList) && !addableLists.includes(entry.assignedList);

            return (
              <div key={spell.id} className="space-y-2 rounded-xl border border-border-dark bg-bg px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-text">{spell.name}</p>
                    <p className="text-xs text-text-dim">{queuedList || '-'} · {spell.castingTime || '-'} · Save: {spell.save || '-'}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-text-muted">Intent</span>
                    <div className="flex items-center gap-1 rounded-lg border border-border-dark bg-bg p-1">
                      <button
                        type="button"
                        className={`rounded-md px-2 py-1 text-xs ${entry.intent === 'add' ? 'bg-gold-soft/20 text-text' : 'text-text-muted'}`}
                        onClick={() => void setQueuedSpellIntent(spell.id, 'add').catch((nextError) => {
                          setError(nextError instanceof Error ? nextError.message : 'Unable to update queue intent.');
                        })}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        className={`rounded-md px-2 py-1 text-xs ${entry.intent === 'replace' ? 'bg-gold-soft/20 text-text' : 'text-text-muted'}`}
                        onClick={() => void setQueuedSpellIntent(spell.id, 'replace').catch((nextError) => {
                          setError(nextError instanceof Error ? nextError.message : 'Unable to update queue intent.');
                        })}
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        className={`rounded-md px-2 py-1 text-xs ${entry.intent === 'queue_only' ? 'bg-gold-soft/20 text-text' : 'text-text-muted'}`}
                        onClick={() => void setQueuedSpellIntent(spell.id, 'queue_only').catch((nextError) => {
                          setError(nextError instanceof Error ? nextError.message : 'Unable to update queue intent.');
                        })}
                      >
                        Queue-only
                      </button>
                    </div>

                    <button
                      type="button"
                      className="rounded-xl border border-border-dark bg-bg-2 px-3 py-1 text-xs"
                      onClick={() => void unqueueSpellForNextPreparation(spell.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {validLists.length > 1 ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <label className="text-text-muted" htmlFor={`assigned-list-${spell.id}`}>Spell List</label>
                    <select
                      id={`assigned-list-${spell.id}`}
                      className={`rounded-lg border bg-bg px-2 py-1 ${(listMissing || listBlocked) ? 'border-gold-soft text-text' : 'border-border-dark text-text'}`}
                      value={entry.assignedList || ''}
                      onChange={(event) => {
                        void setQueuedSpellAssignedList(spell.id, event.target.value || null).catch((nextError) => {
                          setError(nextError instanceof Error ? nextError.message : 'Unable to update spell list.');
                        });
                      }}
                    >
                      <option value="">Choose spell list</option>
                      {selectableLists.map((list) => (
                        <option key={list} value={list}>{list}</option>
                      ))}
                    </select>
                    {listMissing ? <span className="text-text-dim">Choose where this spell belongs before applying.</span> : null}
                    {listBlocked ? <span className="text-text-dim">This list now exceeds the allowed max spell level. Choose another list or remove it.</span> : null}
                  </div>
                ) : null}

                {entry.intent === 'replace' ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <label className="text-text-muted" htmlFor={`replace-target-${spell.id}`}>Replace Target</label>
                    <select
                      id={`replace-target-${spell.id}`}
                      className={`rounded-lg border bg-bg px-2 py-1 ${replaceMissing ? (showValidationErrors ? 'border-blood-soft text-blood' : 'border-gold-soft text-text') : 'border-border-dark text-text'}`}
                      value={entry.replaceTarget || ''}
                      onChange={(event) => {
                        void setQueuedSpellReplaceTarget(spell.id, event.target.value || null).catch((nextError) => {
                          setError(nextError instanceof Error ? nextError.message : 'Unable to update replace target.');
                        });
                      }}
                    >
                      <option value="">Select prepared spell</option>
                      {replaceOptions.map((option) => (
                        <option key={`${option.assignedList}:${option.spellId}`} value={option.spellId}>{option.spell.name}</option>
                      ))}
                    </select>
                    {replaceMissing ? (
                      <span className={showValidationErrors ? 'text-blood' : 'text-text-dim'}>
                        {showValidationErrors ? 'Required to apply' : 'Choose a prepared spell to replace'}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
          {!queuedRows.length ? <p className="text-sm text-text-muted">No spells queued yet. Queue from Catalog or above.</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-border-dark bg-bg-1/95 p-4">
        <h2 className="font-display text-xl">Finalize Preparation</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" className="rounded-lg border border-border-dark bg-bg px-3 py-1 text-sm" onClick={() => void restoreQueueFromPrepared()}>
            Reset Queue To Current Prepared
          </button>
          <button
            type="button"
            className="rounded-lg border border-gold-soft bg-gold-soft/20 px-3 py-1 text-sm"
            onClick={() => void onApply()}
            disabled={busy}
          >
            {busy ? 'Applying...' : 'Apply Next Preparation'}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {limitsSummary.map((entry) => (
            <div key={entry.list} className="rounded-xl border border-border-dark bg-bg px-3 py-1">
              {entry.list}: {entry.used}/{entry.limit}
            </div>
          ))}
          {!limitsSummary.length ? <p className="text-sm text-text-muted">No limits configured.</p> : null}
        </div>

        {preview.result?.warnings?.length ? (
          <div className="mt-3 space-y-2">
            {preview.result.warnings.map((warning) => (
              <p key={warning} className="rounded-xl border border-gold-soft bg-gold-soft/10 px-3 py-2 text-sm text-text-muted">{warning}</p>
            ))}
          </div>
        ) : null}
        {preview.error ? <p className="mt-3 rounded-xl border border-blood-soft bg-blood-soft px-3 py-2 text-sm text-blood">{preview.error}</p> : null}
        {error ? <p className="mt-3 rounded-xl border border-blood-soft bg-blood-soft px-3 py-2 text-sm text-blood">{error}</p> : null}
        {lastResult ? <p className="mt-3 rounded-xl border border-border-dark bg-bg px-3 py-2 text-sm text-text-muted">{lastResult}</p> : null}

        <h3 className="mt-4 font-display text-lg">Queued Changes</h3>
        <div className="mt-2 space-y-2 text-sm">
          {diff.map((item) => {
            const fromName = item.from ? (spellsById.get(item.from.spellId)?.name || 'Unknown') : 'Unknown';
            const toName = item.to ? (spellsById.get(item.to.spellId)?.name || 'Unknown') : 'Unknown';

            const label = item.type === 'replace'
              ? `Replace ${fromName} [${item.from?.assignedList || '-'}] -> ${toName} [${item.to?.assignedList || '-'}]`
              : item.type === 'add'
                ? `Prepare ${toName} [${item.to?.assignedList || '-'}]`
                : `Unprepare ${fromName} [${item.from?.assignedList || '-'}]`;

            return (
              <div key={`diff-${item.index}-${item.type}`} className="rounded-xl border border-border-dark bg-bg px-3 py-2">
                <p>{label}</p>
              </div>
            );
          })}

          {!diff.length ? <p className="text-text-muted">No queued changes.</p> : null}
        </div>
      </section>

      <PreparedDrawer
        open={preparedDrawerOpen}
        onClose={() => setPreparedDrawerOpen(false)}
        profile={activeCharacter}
        spellsById={spellsById}
        highlightedSpellIds={highlightedReplaceTargets}
      />
    </div>
  );
}
