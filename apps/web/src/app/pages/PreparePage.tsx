import { useEffect, useMemo, useState } from 'react';
import { buildPreparationUsage, getAddableAssignmentLists, getValidAssignmentLists } from '../domain/character';
import { computeApplyResult } from '../domain/prepareQueue';
import { PreparedDrawer } from '../components/PreparedDrawer';
import { SpellDetailDrawer } from '../components/SpellDetailDrawer';
import {
  formatPrepareReviewLabel,
  formatPrepareRowMeta,
  groupQueuedSpellsByLevel,
  getPrepareQueueListMeta,
  getPrepareQueueReplaceSummary,
  getPrepareReplaceMessage,
  groupPrepareReviewItems,
} from './preparePresentation';
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
    markPreparedForReplacement,
    unmarkPreparedForReplacement,
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

  const queuedRowGroups = useMemo(
    () => groupQueuedSpellsByLevel(
      queuedRows.map(({ spell }) => ({
        key: spell.id,
        level: spell.level,
        spellName: spell.name,
      })),
    ),
    [queuedRows],
  );

  const queuedRowsById = useMemo(
    () => new Map(queuedRows.map((row) => [row.spell.id, row])),
    [queuedRows],
  );

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

  const reviewItems = useMemo(() => (
    queuedRows.map(({ entry, spell }) => {
      const addableLists = getAddableAssignmentLists(spell, activeCharacter);
      const assignedList = entry.assignedList || (addableLists.length === 1 ? addableLists[0] : null);

      return {
        key: `${entry.spellId}:${entry.intent}:${assignedList || '-'}:${entry.replaceTarget || '-'}`,
        assignedList,
        label: formatPrepareReviewLabel({
          intent: entry.intent,
          spellName: spell.name,
          assignedList,
          replaceTargetName: entry.replaceTarget ? (spellsById.get(entry.replaceTarget)?.name || entry.replaceTarget) : null,
        }),
      };
    })
  ), [activeCharacter, queuedRows, spellsById]);

  const reviewGroups = useMemo(
    () => groupPrepareReviewItems(reviewItems, limitsSummary),
    [limitsSummary, reviewItems],
  );

  const highlightedReplaceTargets = useMemo(() => new Set(queueEntries
    .filter((entry) => entry.intent === 'replace' && entry.replaceTarget)
    .map((entry) => String(entry.replaceTarget))), [queueEntries]);

  const markedForReplacementIds = useMemo(() => new Set(queueEntries
    .filter((entry) => entry.intent === 'remove')
    .map((entry) => entry.spellId)), [queueEntries]);

  const selectedQueuedEntry = useMemo(
    () => queueEntries.find((entry) => entry.spellId === selectedSpellId) || null,
    [queueEntries, selectedSpellId],
  );

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
    return (
      <div className="space-y-4">
        <div className="rounded-[1.45rem] border border-border-dark bg-bg-1/92 p-5">
          <h2 className="font-display text-3xl text-text">No character selected</h2>
          <p className="mt-3 max-w-2xl text-sm text-text-muted">
            No character selected. Create one from the header dropdown.
          </p>
        </div>
      </div>
    );
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
      const executed = output.summary.adds + output.summary.replacements + (output.summary.removals || 0);
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
              className="rounded-2xl border border-border-dark bg-bg px-4 py-2 text-sm text-text-muted transition-colors hover:bg-bg-2 hover:text-text"
              onClick={() => setPreparedDrawerOpen(true)}
            >
              View Current Prepared
            </button>
            <button
              type="button"
              className="rounded-2xl border border-border-dark bg-bg px-4 py-2 text-sm text-text transition-colors hover:bg-bg-2"
              onClick={() => void restoreQueueFromPrepared()}
            >
              Reset To Current Prepared
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_360px]">
        <div className="space-y-4">
          <section className="rounded-[1.45rem] border border-border-dark bg-bg-1/92 p-4 md:p-5">
            <h2 className="font-display text-2xl text-text">Stage Another Spell</h2>

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

            <div className="mt-4 max-h-[36vh] overflow-y-auto pr-1">
              {search.trim().length > 0 ? (
                <div className="divide-y divide-border-dark/80">
                  {filtered.map((spell) => {
                    const validLists = getValidAssignmentLists(spell, activeCharacter);
                    const addableLists = getAddableAssignmentLists(spell, activeCharacter);
                    const blocked = validLists.length > 0 && addableLists.length === 0;
                    const meta = addableLists.length === 1
                      ? formatPrepareRowMeta({ level: spell.level, list: addableLists[0] })
                      : addableLists.length > 1
                        ? `${spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} · ${addableLists.length} lists`
                        : validLists.length > 0
                          ? `${spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} · Blocked by max spell level`
                          : `${spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} · Outside active lists`;

                    return (
                      <div key={spell.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between md:gap-4">
                        <div className="min-w-0">
                          <button
                            type="button"
                            className="truncate text-left font-display text-xl text-text transition-colors hover:text-gold-soft"
                            onClick={() => setSelectedSpellId(spell.id)}
                          >
                            {spell.name}
                          </button>
                          <p className="mt-1 text-sm text-text-muted">{meta}</p>
                        </div>

                        <button
                          type="button"
                          className={`self-start rounded-full border px-4 py-2 text-sm transition-colors md:self-center ${blocked ? 'border-border-dark bg-bg opacity-55' : 'border-moon-border bg-moon-paper text-moon-ink hover:opacity-92'}`}
                          disabled={blocked}
                          onClick={() => void onQueueToggle(spell.id)}
                        >
                          {blocked ? 'Blocked' : 'Stage Spell'}
                        </button>
                      </div>
                    );
                  })}
                  {!filtered.length ? <p className="py-4 text-sm text-text-muted">No spells are available to add from this search.</p> : null}
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[1.45rem] border border-border-dark bg-bg-1/92 p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-text">Preparation Queue</h2>
              <span className="text-[11px] uppercase tracking-[0.24em] text-text-dim">
                {queuedRows.length} staged
              </span>
            </div>

            <div className="mt-5 space-y-5">
              {queuedRowGroups.map((group) => (
                <section key={group.level} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[11px] uppercase tracking-[0.28em] text-text-dim">{group.label}</h3>
                    <div className="h-px flex-1 bg-border-dark/80" />
                  </div>

                  <div className="divide-y divide-border-dark/80">
                    {group.itemKeys.map((itemKey) => {
                      const queuedRow = queuedRowsById.get(itemKey);
                      if (!queuedRow) return null;

                      const { entry, spell } = queuedRow;

                      if (entry.intent === 'remove') {
                        return (
                          <article key={spell.id} className="py-4 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="font-display text-2xl leading-tight text-text-dim line-through">
                                  {spell.name}
                                </p>
                                <p className="mt-1 text-xs text-text-muted">
                                  {entry.assignedList || 'Unassigned'} · Marked for replacement
                                </p>
                                <p className="mt-3 text-sm text-text-muted">
                                  Find a replacement from the search above or from the Catalog page.
                                </p>
                                <p className="mt-2 text-xs text-text-dim">
                                  No replacement needed? This spell will simply be unprepared when you apply.
                                </p>
                              </div>
                              <button
                                type="button"
                                className="text-[11px] uppercase tracking-[0.18em] text-gold-soft font-semibold transition-colors hover:text-gold flex-shrink-0 pt-3"
                                onClick={() => void unmarkPreparedForReplacement(spell.id)}
                              >
                                Undo
                              </button>
                            </div>
                          </article>
                        );
                      }

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
                      const listMeta = getPrepareQueueListMeta({ level: spell.level, list: queuedList });
                      const replaceMessage = getPrepareReplaceMessage({ replaceMissing, showValidationErrors });
                      const replaceSummary = getPrepareQueueReplaceSummary(entry.intent);

                      return (
                        <article key={spell.id} className="py-4 text-sm xl:grid xl:grid-cols-[minmax(0,1.7fr)_minmax(9.5rem,0.62fr)_minmax(14rem,0.95fr)_auto] xl:items-start xl:gap-3">
                          <div className="min-w-0">
                            <button
                              type="button"
                              className="whitespace-normal text-left font-display text-2xl leading-tight text-text transition-colors hover:text-gold-soft"
                              onClick={() => setSelectedSpellId(spell.id)}
                            >
                              {spell.name}
                            </button>
                            <div className="mt-2 flex flex-wrap items-center gap-2 xl:pl-8">
                              <button
                                type="button"
                                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${entry.intent === 'replace' ? 'border-moon-border bg-moon-paper text-moon-ink font-semibold' : 'border-border-dark bg-bg text-text-muted hover:bg-bg-2 hover:text-text'}`}
                                onClick={() => void setQueuedSpellIntent(spell.id, 'replace').catch((nextError) => {
                                  setError(nextError instanceof Error ? nextError.message : 'Unable to update queue intent.');
                                })}
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${entry.intent === 'add' ? 'border-gold-soft bg-gold-soft/12 text-text' : 'border-border-dark bg-bg text-text-muted hover:bg-bg-2 hover:text-text'}`}
                                onClick={() => void setQueuedSpellIntent(spell.id, 'add').catch((nextError) => {
                                  setError(nextError instanceof Error ? nextError.message : 'Unable to update queue intent.');
                                })}
                              >
                                Prepare
                              </button>
                              <button
                                type="button"
                                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${entry.intent === 'queue_only' ? 'border-gold-soft bg-gold-soft/12 text-text' : 'border-border-dark bg-bg text-text-muted hover:bg-bg-2 hover:text-text'}`}
                                onClick={() => void setQueuedSpellIntent(spell.id, 'queue_only').catch((nextError) => {
                                  setError(nextError instanceof Error ? nextError.message : 'Unable to update queue intent.');
                                })}
                              >
                                Save Later
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 xl:mt-0 xl:pt-3">
                            {validLists.length > 1 ? (
                              <div className="space-y-1.5 text-xs">
                                <label className="block text-text-muted" htmlFor={`assigned-list-${spell.id}`}>List</label>
                                <div className="flex flex-wrap items-center gap-2">
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
                                  {listBlocked ? <span className="text-text-dim">Max spell level exceeded.</span> : null}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1 text-xs text-text-muted xl:text-sm">
                                <p className="text-xs text-text-muted">List</p>
                                <p>{listMeta.listLabel || 'Choose spell list'}</p>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 xl:mt-0 xl:pt-3">
                            <div className="space-y-1.5 text-xs">
                              {entry.intent === 'replace' ? (
                                <>
                                  <label className="block text-text-muted" htmlFor={`replace-target-${spell.id}`}>Replace</label>
                                  <div className="flex flex-wrap items-center gap-2">
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
                                  </div>
                                  {replaceMessage ? (
                                    <p className="text-blood">
                                      {replaceMessage}
                                    </p>
                                  ) : null}
                                </>
                              ) : (
                                <>
                                  <p className="text-text-muted">Replace</p>
                                  <p className="text-xs text-text-dim xl:text-sm">{replaceSummary}</p>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 self-start xl:mt-0 xl:justify-self-end xl:pt-[2.3rem]">
                            <button
                              type="button"
                              className="text-[11px] uppercase tracking-[0.18em] text-text-dim transition-colors hover:text-blood"
                              onClick={() => void unqueueSpellForNextPreparation(spell.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
              {!queuedRows.length ? <p className="py-5 text-sm text-text-muted">Nothing is staged yet. Queue a spell from Catalog or the search box above.</p> : null}
            </div>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6">
          <section className="rounded-[1.55rem] border border-moon-border bg-moon-paper px-5 py-5 text-moon-ink md:px-6">
            <p className="text-[11px] uppercase tracking-[0.3em] text-moon-ink-muted">Final Check</p>

            <div className="mt-4">
              <h3 className="font-display text-2xl">Queued Changes</h3>
              <div className="mt-3 space-y-4 text-sm">
                {reviewGroups.map((group) => (
                  <section key={group.list} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-display text-xl">{group.list}</h4>
                      <div className="h-px flex-1 bg-moon-border/70" />
                      {group.usageLabel ? (
                        <span className="text-sm text-moon-ink-muted">{group.usageLabel}</span>
                      ) : null}
                    </div>
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <p key={item.key} className="text-moon-ink">
                          {item.label}
                        </p>
                      ))}
                    </div>
                  </section>
                ))}

                {!reviewGroups.length ? <p className="text-moon-ink-muted">No staged actions yet.</p> : null}
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
        </aside>
      </section>

      <PreparedDrawer
        open={preparedDrawerOpen}
        onClose={() => setPreparedDrawerOpen(false)}
        profile={activeCharacter}
        spellsById={spellsById}
        highlightedSpellIds={highlightedReplaceTargets}
        markedForReplacementIds={markedForReplacementIds}
        onMarkForReplacement={(spellId, assignedList) => {
          markPreparedForReplacement(spellId, assignedList).catch(() => {});
        }}
        onUnmarkForReplacement={(spellId) => {
          unmarkPreparedForReplacement(spellId).catch(() => {});
        }}
      />

      <SpellDetailDrawer
        spell={selectedSpell}
        assignedList={selectedQueuedEntry?.assignedList}
        queued={selectedSpellQueued}
        cannotQueue={selectedSpellCannotQueue}
        disabledReason={selectedSpellDisabledReason}
        onToggleQueue={(spellId) => void onQueueToggle(spellId)}
        onClose={() => setSelectedSpellId(null)}
      />
    </div>
  );
}
