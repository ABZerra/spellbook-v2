import { useEffect, useMemo, useState } from 'react';
import { buildPreparationUsage, getAddableAssignmentLists, getValidAssignmentLists } from '../domain/character';
import { buildPlanDiff } from '../domain/plan';
import { computeApplyResult } from '../domain/prepareQueue';
import { PreparedDrawer } from '../components/PreparedDrawer';
import { SpellDetailDialog } from '../components/SpellDetailDialog';
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
    isSpellQueuedForNextPreparation,
  } = useApp();

  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [preparedDrawerOpen, setPreparedDrawerOpen] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [selectedSpellId, setSelectedSpellId] = useState<string | null>(null);

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

  const selectedSpell = useMemo(
    () => spells.find((entry) => entry.id === selectedSpellId) || null,
    [spells, selectedSpellId],
  );
  const selectedSpellQueued = selectedSpell ? isSpellQueuedForNextPreparation(selectedSpell.id) : false;
  const selectedSpellAddableLists = selectedSpell && activeCharacter
    ? getAddableAssignmentLists(selectedSpell, activeCharacter)
    : [];
  const selectedSpellEligible = selectedSpell
    ? (activeCharacter ? getValidAssignmentLists(selectedSpell, activeCharacter).length > 0 : true)
    : false;
  const selectedSpellCannotQueue = selectedSpell
    ? (!selectedSpellQueued && (!selectedSpellEligible || selectedSpellAddableLists.length === 0))
    : false;
  const selectedSpellDisabledReason = selectedSpell && !selectedSpellEligible
    ? 'This spell is outside the active character spell lists.'
    : selectedSpell && selectedSpellAddableLists.length === 0
      ? 'This spell is above every owned list max spell level.'
      : '';

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
          ? 'Extension acknowledged the payload.'
          : `Extension rejected the payload: ${output.ack.error || 'unknown error'}.`
        : 'No extension acknowledgement received.';

      setLastResult(`Applied ${executed} change(s), skipped ${skipped} saved-for-later item(s). ${ackStatus}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to apply next preparation.');
    } finally {
      setBusy(false);
    }
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
      setError(nextError instanceof Error ? nextError.message : 'Unable to update the next preparation queue.');
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[1.55rem] border border-border-dark bg-bg-1/92 p-4 md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.34em] text-text-dim">Prepare</p>
            <h1 className="font-display text-3xl text-text md:text-4xl">Shape The Next Rest</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-2xl border border-border-dark bg-bg px-4 py-2 text-sm text-text transition-colors hover:bg-bg-2"
              onClick={() => void restoreQueueFromPrepared()}
            >
              Reset To Current Prepared
            </button>
            <button
              type="button"
              className="rounded-2xl border border-gold-soft bg-gold-soft/20 px-4 py-2 text-sm text-text transition-colors hover:bg-gold-soft/30 disabled:opacity-50"
              onClick={() => void onApply()}
              disabled={busy}
            >
              {busy ? 'Applying...' : 'Apply Next Preparation'}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_360px]">
        <div className="space-y-4">
          <section className="rounded-[1.45rem] border border-border-dark bg-bg-1/92 p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-text">Stage Another Spell</h2>
              <button
                type="button"
                className="rounded-2xl border border-border-dark bg-bg px-4 py-2 text-sm text-text-muted transition-colors hover:bg-bg-2 hover:text-text"
                onClick={() => setPreparedDrawerOpen(true)}
              >
                View Current Prepared
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-2xl border border-border-dark bg-bg px-4 py-3 text-text"
                placeholder="Search spells to stage"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button
                type="button"
                className="rounded-2xl border border-border-dark bg-bg px-4 py-3 text-sm text-text-muted transition-colors hover:bg-bg-2 hover:text-text"
                onClick={() => setSearch('')}
              >
                Clear
              </button>
            </div>

            <div className="mt-4 max-h-[36vh] space-y-2 overflow-y-auto pr-1">
              {search.trim().length === 0 ? (
                <div className="rounded-2xl border border-border-dark bg-bg px-4 py-4 text-sm text-text-muted">
                  Search by spell name or notes to stage something new.
                </div>
              ) : (
                <>
                  {filtered.map((spell) => {
                    const validLists = getValidAssignmentLists(spell, activeCharacter);
                    const addableLists = getAddableAssignmentLists(spell, activeCharacter);
                    const listLabel = addableLists.length === 1
                      ? addableLists[0]
                      : addableLists.length > 1
                        ? 'Choose list after staging'
                        : validLists.length > 0
                          ? 'Blocked by max spell level'
                          : '-';
                    const blocked = validLists.length > 0 && addableLists.length === 0;

                    return (
                      <div key={spell.id} className="rounded-2xl border border-border-dark bg-bg px-4 py-3 text-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-display text-2xl text-text">{spell.name}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-muted">
                              <span className="rounded-full border border-border-dark bg-bg-2 px-3 py-1">{listLabel}</span>
                              <span className="rounded-full border border-border-dark bg-bg-2 px-3 py-1">{spell.castingTime || 'No casting time'}</span>
                              <span className="rounded-full border border-border-dark bg-bg-2 px-3 py-1">Save: {spell.save || 'None'}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded-2xl border border-border-dark bg-bg px-4 py-2 text-sm text-text-muted transition-colors hover:bg-bg-2 hover:text-text"
                              onClick={() => setSelectedSpellId(spell.id)}
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              className={`rounded-2xl border px-4 py-2 text-sm ${blocked ? 'border-border-dark bg-bg opacity-55' : 'border-moon-border bg-moon-paper text-moon-ink'}`}
                              disabled={blocked}
                              onClick={() => void onQueueToggle(spell.id)}
                            >
                              {blocked ? 'Blocked' : 'Stage Spell'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {!filtered.length ? <p className="rounded-2xl border border-border-dark bg-bg px-4 py-4 text-sm text-text-muted">No spells are available to add from this search.</p> : null}
                </>
              )}
            </div>
          </section>

          <section className="rounded-[1.45rem] border border-border-dark bg-bg-1/92 p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-text">Next Rest Workbench</h2>
                <p className="mt-1 text-sm text-text-muted">Replace is the default for newly staged spells. Switch to prepare or save-for-later only when needed.</p>
              </div>
              <span className="rounded-full border border-border-dark bg-bg px-4 py-2 text-xs uppercase tracking-[0.24em] text-text-muted">
                {queuedRows.length} staged
              </span>
            </div>

            <div className="mt-4 space-y-3">
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
                  <article key={spell.id} className="rounded-2xl border border-border-dark bg-bg px-4 py-4 text-sm">
                    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-2xl text-text">{spell.name}</p>
                          <span className="rounded-full border border-border-dark bg-bg-2 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-text-muted">
                            {queuedList || 'List not chosen'}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-muted">
                          <span className="rounded-full border border-border-dark bg-bg-2 px-3 py-1">{spell.castingTime || 'No casting time'}</span>
                          <span className="rounded-full border border-border-dark bg-bg-2 px-3 py-1">Save: {spell.save || 'None'}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-2xl border border-border-dark bg-bg-2 px-4 py-2 text-sm text-text-muted transition-colors hover:bg-bg hover:text-text"
                          onClick={() => setSelectedSpellId(spell.id)}
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          className="rounded-2xl border border-border-dark bg-bg-2 px-4 py-2 text-sm text-text-muted transition-colors hover:bg-bg hover:text-text"
                          onClick={() => void unqueueSpellForNextPreparation(spell.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={`rounded-full border px-4 py-2 text-sm ${entry.intent === 'replace' ? 'border-gold-soft bg-gold-soft/20 text-text' : 'border-border-dark bg-bg text-text-muted hover:bg-bg-2 hover:text-text'}`}
                        onClick={() => void setQueuedSpellIntent(spell.id, 'replace').catch((nextError) => {
                          setError(nextError instanceof Error ? nextError.message : 'Unable to update queue intent.');
                        })}
                      >
                        Replace Something
                      </button>
                      <button
                        type="button"
                        className={`rounded-full border px-4 py-2 text-sm ${entry.intent === 'add' ? 'border-gold-soft bg-gold-soft/20 text-text' : 'border-border-dark bg-bg text-text-muted hover:bg-bg-2 hover:text-text'}`}
                        onClick={() => void setQueuedSpellIntent(spell.id, 'add').catch((nextError) => {
                          setError(nextError instanceof Error ? nextError.message : 'Unable to update queue intent.');
                        })}
                      >
                        Prepare It
                      </button>
                      <button
                        type="button"
                        className={`rounded-full border px-4 py-2 text-sm ${entry.intent === 'queue_only' ? 'border-gold-soft bg-gold-soft/20 text-text' : 'border-border-dark bg-bg text-text-muted hover:bg-bg-2 hover:text-text'}`}
                        onClick={() => void setQueuedSpellIntent(spell.id, 'queue_only').catch((nextError) => {
                          setError(nextError instanceof Error ? nextError.message : 'Unable to update queue intent.');
                        })}
                      >
                        Save For Later
                      </button>
                    </div>

                    {validLists.length > 1 ? (
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                        <label className="text-text-muted" htmlFor={`assigned-list-${spell.id}`}>Spell List</label>
                        <select
                          id={`assigned-list-${spell.id}`}
                          className={`rounded-xl border bg-bg px-3 py-2 ${(listMissing || listBlocked) ? 'border-gold-soft text-text' : 'border-border-dark text-text'}`}
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
                        {listMissing ? <span className="text-text-dim">Choose the spell list before applying.</span> : null}
                        {listBlocked ? <span className="text-text-dim">That list now exceeds its allowed max spell level. Choose another one or remove this spell.</span> : null}
                      </div>
                    ) : null}

                    {entry.intent === 'replace' ? (
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                        <label className="text-text-muted" htmlFor={`replace-target-${spell.id}`}>Replace Target</label>
                        <select
                          id={`replace-target-${spell.id}`}
                          className={`rounded-xl border bg-bg px-3 py-2 ${replaceMissing ? (showValidationErrors ? 'border-blood-soft text-blood' : 'border-gold-soft text-text') : 'border-border-dark text-text'}`}
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
                            {showValidationErrors ? 'Choose a prepared spell before applying.' : 'Pick the prepared spell this should replace.'}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
              {!queuedRows.length ? <p className="rounded-2xl border border-border-dark bg-bg px-4 py-5 text-sm text-text-muted">Nothing is staged yet. Queue a spell from Catalog or the search box above.</p> : null}
            </div>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6">
          <section className="rounded-[1.55rem] border border-moon-border bg-moon-paper px-5 py-5 text-moon-ink md:px-6">
            <p className="text-[11px] uppercase tracking-[0.3em] text-moon-ink-muted">Final Decision</p>
            <h2 className="mt-3 font-display text-3xl">Apply Preview</h2>
            <p className="mt-2 text-sm text-moon-ink-muted">
              Review the final diff, list limits, and any warnings in one place before you apply anything.
            </p>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-moon-border bg-moon-paper-2 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.28em] text-moon-ink-muted">Staged</p>
                <p className="mt-2 font-display text-3xl">{queuedRows.length}</p>
              </div>
              <div className="rounded-2xl border border-moon-border bg-moon-paper-2 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.28em] text-moon-ink-muted">Changes To Apply</p>
                <p className="mt-2 font-display text-3xl">{diff.length}</p>
              </div>
            </div>

            <div className="mt-5 space-y-2 text-sm">
              <p className="text-[11px] uppercase tracking-[0.28em] text-moon-ink-muted">Preparation Limits</p>
              <div className="flex flex-wrap gap-2">
                {limitsSummary.map((entry) => (
                  <div key={entry.list} className="rounded-xl border border-moon-border bg-moon-paper-2 px-3 py-2">
                    {entry.list}: {entry.used}/{entry.limit}
                  </div>
                ))}
                {!limitsSummary.length ? <p className="text-sm text-moon-ink-muted">No limits configured.</p> : null}
              </div>
            </div>

            {preview.result?.warnings?.length ? (
              <div className="mt-5 space-y-2">
                <p className="text-[11px] uppercase tracking-[0.28em] text-moon-ink-muted">Warnings</p>
                {preview.result.warnings.map((warning) => (
                  <p key={warning} className="rounded-2xl border border-gold-soft bg-gold-soft/10 px-4 py-3 text-sm text-moon-ink">{warning}</p>
                ))}
              </div>
            ) : null}
            {preview.error ? <p className="mt-5 rounded-2xl border border-blood-soft bg-blood-soft px-4 py-3 text-sm text-blood">{preview.error}</p> : null}
            {error ? <p className="mt-5 rounded-2xl border border-blood-soft bg-blood-soft px-4 py-3 text-sm text-blood">{error}</p> : null}
            {lastResult ? <p className="mt-5 rounded-2xl border border-moon-border bg-moon-paper-2 px-4 py-3 text-sm text-moon-ink">{lastResult}</p> : null}

            <button
              type="button"
              className="mt-5 w-full rounded-2xl border border-moon-border bg-moon-ink px-4 py-3 text-sm text-moon-paper transition-opacity hover:opacity-92 disabled:opacity-50"
              onClick={() => void onApply()}
              disabled={busy}
            >
              {busy ? 'Applying...' : 'Apply Next Preparation'}
            </button>
          </section>

          <section className="rounded-[1.45rem] border border-border-dark bg-bg-1/92 p-4 md:p-5">
            <h3 className="font-display text-2xl text-text">Queued Changes</h3>
            <div className="mt-4 space-y-2 text-sm">
              {diff.map((item) => {
                const fromName = item.from ? (spellsById.get(item.from.spellId)?.name || 'Unknown') : 'Unknown';
                const toName = item.to ? (spellsById.get(item.to.spellId)?.name || 'Unknown') : 'Unknown';

                const label = item.type === 'replace'
                  ? `Replace ${fromName} [${item.from?.assignedList || '-'}] with ${toName} [${item.to?.assignedList || '-'}]`
                  : item.type === 'add'
                    ? `Prepare ${toName} [${item.to?.assignedList || '-'}]`
                    : `Unprepare ${fromName} [${item.from?.assignedList || '-'}]`;

                return (
                  <div key={`diff-${item.index}-${item.type}`} className="rounded-xl border border-border-dark bg-bg px-3 py-3">
                    <p>{label}</p>
                  </div>
                );
              })}

              {!diff.length ? <p className="rounded-xl border border-border-dark bg-bg px-3 py-3 text-text-muted">No final change has been queued yet.</p> : null}
            </div>
          </section>
        </aside>
      </section>

      <PreparedDrawer
        open={preparedDrawerOpen}
        onClose={() => setPreparedDrawerOpen(false)}
        profile={activeCharacter}
        spellsById={spellsById}
        highlightedSpellIds={highlightedReplaceTargets}
      />

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
