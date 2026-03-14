import type {
  CharacterProfile,
  CharacterProfileInput,
  NextPreparationQueueEntry,
  PreparedSpellEntry,
  PreparationLimit,
  QueueIntent,
  SpellRecord,
} from '../types';

export function normalizeListName(value: string): string {
  return String(value || '').replace(/\s+/g, ' ').trim().toUpperCase();
}

function parseAvailableForEntry(value: string): string {
  let next = String(value || '').replace(/\(LEGACY\)/gi, '').trim();
  if (!next) return '';

  const dashIndex = next.indexOf(' - ');
  if (dashIndex >= 0) {
    next = next.slice(0, dashIndex).trim();
  }

  return normalizeListName(next);
}

export function getSpellLists(spell: Pick<SpellRecord, 'availableFor'>): string[] {
  const normalized = (spell.availableFor || [])
    .map((entry) => parseAvailableForEntry(entry))
    .filter(Boolean);

  return [...new Set(normalized)];
}

export function getValidAssignmentLists(
  spell: Pick<SpellRecord, 'availableFor'>,
  profile: Pick<CharacterProfile, 'availableLists'>,
): string[] {
  const spellLists = getSpellLists(spell);
  if (spellLists.length === 0) return [];

  const allowedLists = (profile.availableLists || [])
    .map((entry) => normalizeListName(entry))
    .filter(Boolean);

  if (allowedLists.length === 0) return spellLists;
  return spellLists.filter((entry) => allowedLists.includes(entry));
}

export function isSpellEligibleForCharacter(spell: Pick<SpellRecord, 'availableFor'>, profile: Pick<CharacterProfile, 'availableLists'>): boolean {
  return getValidAssignmentLists(spell, profile).length > 0;
}

export function getPreparationLimits(input: CharacterProfileInput | CharacterProfile): PreparationLimit[] {
  const availableLists = [...new Set((input.availableLists || [])
    .map((entry) => normalizeListName(entry))
    .filter(Boolean))];

  const byList = new Map<string, number>();
  for (const entry of input.preparationLimits || []) {
    const list = normalizeListName(entry.list);
    if (!list) continue;
    const parsed = Number(entry.limit);
    const limit = Number.isFinite(parsed) ? Math.max(1, Math.trunc(parsed)) : 1;
    byList.set(list, limit);
  }

  for (const list of availableLists) {
    if (!byList.has(list)) {
      byList.set(list, 8);
    }
  }

  return [...byList.entries()].map(([list, limit]) => ({ list, limit }));
}

export function getSpellAssignmentList(spell: Pick<SpellRecord, 'availableFor'>, profile: Pick<CharacterProfile, 'availableLists'>): string | null {
  return getValidAssignmentLists(spell, profile)[0] || null;
}

function getFallbackAssignedList(profile: Pick<CharacterProfile, 'availableLists'>): string {
  return normalizeListName(profile.availableLists?.[0] || 'UNASSIGNED');
}

export function normalizePreparedSpells(
  values: unknown[],
  profile: Pick<CharacterProfile, 'availableLists'>,
): PreparedSpellEntry[] {
  const seen = new Set<string>();
  const output: PreparedSpellEntry[] = [];

  for (const raw of values || []) {
    let spellId = '';
    let assignedList = '';

    if (typeof raw === 'string') {
      spellId = raw;
      assignedList = getFallbackAssignedList(profile);
    } else if (raw && typeof raw === 'object') {
      const candidate = raw as { spellId?: string; assignedList?: string };
      spellId = String(candidate.spellId || '').trim();
      assignedList = normalizeListName(candidate.assignedList || '') || getFallbackAssignedList(profile);
    }

    const normalizedSpellId = String(spellId || '').trim();
    if (!normalizedSpellId) continue;

    const key = `${assignedList}::${normalizedSpellId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({ spellId: normalizedSpellId, assignedList });
  }

  return output;
}

export function enforcePreparationLimits(
  nextPreparedSpells: PreparedSpellEntry[],
  profile: Pick<CharacterProfile, 'availableLists' | 'preparationLimits' | 'name'>,
  spellsById: Map<string, SpellRecord>,
) {
  const limits = new Map<string, number>();
  for (const entry of profile.preparationLimits || []) {
    limits.set(normalizeListName(entry.list), Math.max(1, Math.trunc(Number(entry.limit) || 1)));
  }

  const counts = new Map<string, number>();

  for (const entry of nextPreparedSpells) {
    const spell = spellsById.get(entry.spellId);
    if (!spell) {
      throw new Error(`Unknown spell: ${entry.spellId}`);
    }

    if (!isSpellEligibleForCharacter(spell, profile as CharacterProfile)) {
      throw new Error(`${spell.name} is outside ${profile.name}'s available spell lists.`);
    }

    const assignedList = normalizeListName(entry.assignedList || '');
    const validLists = getValidAssignmentLists(spell, profile as CharacterProfile);
    if (!assignedList || !validLists.includes(assignedList)) {
      throw new Error(`${spell.name}: choose a valid spell list.`);
    }

    if (spell.level <= 0) continue;

    const nextCount = (counts.get(assignedList) || 0) + 1;
    counts.set(assignedList, nextCount);

    const limit = limits.get(assignedList);
    if (limit !== undefined && nextCount > limit) {
      throw new Error(`Preparation limit reached for ${assignedList}: ${limit}.`);
    }
  }
}

export function buildPreparationUsage(
  preparedSpells: PreparedSpellEntry[],
  spellsById: Map<string, SpellRecord>,
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const entry of preparedSpells) {
    const spell = spellsById.get(entry.spellId);
    if (!spell || spell.level <= 0) continue;

    const assignedList = normalizeListName(entry.assignedList || '');
    if (!assignedList) continue;
    counts.set(assignedList, (counts.get(assignedList) || 0) + 1);
  }

  return counts;
}

export function findDuplicatePreparedSpellWarnings(
  preparedSpells: PreparedSpellEntry[],
  spellsById: Map<string, SpellRecord>,
): string[] {
  const counts = new Map<string, number>();

  for (const entry of preparedSpells) {
    counts.set(entry.spellId, (counts.get(entry.spellId) || 0) + 1);
  }

  const warnings: string[] = [];
  for (const [spellId, count] of counts.entries()) {
    if (count <= 1) continue;
    const spell = spellsById.get(spellId);
    const spellName = spell?.name || spellId;
    warnings.push(`${spellName} is prepared more than once.`);
  }

  return warnings;
}

export function normalizeSpellIdList(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const spellId = String(value || '').trim();
    if (!spellId || seen.has(spellId)) continue;
    seen.add(spellId);
    output.push(spellId);
  }

  return output;
}

function normalizeQueueIntent(value: unknown): QueueIntent {
  if (value === 'replace') return 'replace';
  if (value === 'queue_only') return 'queue_only';
  return 'add';
}

export function normalizeQueueEntries(values: unknown[]): NextPreparationQueueEntry[] {
  const seen = new Set<string>();
  const output: NextPreparationQueueEntry[] = [];
  const fallbackList = values && Array.isArray(values) ? '' : '';

  for (const raw of values || []) {
    let spellId = '';
    let intent: QueueIntent = 'add';
    let assignedList: string | undefined;
    let replaceTarget: string | undefined;
    let createdAt: string | undefined;

    if (typeof raw === 'string') {
      spellId = raw;
    } else if (raw && typeof raw === 'object') {
      const candidate = raw as {
        spellId?: string;
        intent?: unknown;
        assignedList?: string;
        replaceTarget?: string;
        createdAt?: string;
      };
      spellId = String(candidate.spellId || '').trim();
      intent = normalizeQueueIntent(candidate.intent);
      assignedList = normalizeListName(candidate.assignedList || '') || undefined;
      replaceTarget = String(candidate.replaceTarget || '').trim() || undefined;
      createdAt = String(candidate.createdAt || '').trim() || undefined;
    }

    const normalizedSpellId = String(spellId || '').trim();
    if (!normalizedSpellId || seen.has(normalizedSpellId)) continue;

    const entry: NextPreparationQueueEntry = {
      spellId: normalizedSpellId,
      intent,
    };

    if (assignedList || fallbackList) {
      entry.assignedList = assignedList || fallbackList || undefined;
    }

    if (intent === 'replace' && replaceTarget) {
      entry.replaceTarget = replaceTarget;
    }

    if (createdAt) {
      entry.createdAt = createdAt;
    }

    seen.add(normalizedSpellId);
    output.push(entry);
  }

  return output;
}

export function createCharacterProfile(input: CharacterProfileInput): CharacterProfile {
  const now = new Date().toISOString();
  const idSource = String(input.id || input.name || '').trim();
  const id = idSource.toLowerCase().replace(/[^a-z0-9_.-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  if (!id) {
    throw new Error('Character id is required.');
  }

  const name = String(input.name || '').trim();
  if (!name) {
    throw new Error('Character name is required.');
  }

  return {
    id,
    name,
    class: String(input.class || '').trim(),
    subclass: String(input.subclass || '').trim(),
    castingAbility: String(input.castingAbility || '').trim(),
    availableLists: [...new Set((input.availableLists || [])
      .map((entry) => normalizeListName(entry))
      .filter(Boolean))],
    preparationLimits: getPreparationLimits(input),
    preparedSpells: [],
    nextPreparationQueue: [],
    savedIdeas: [],
    updatedAt: now,
  };
}

export function normalizeCharacterProfile(input: CharacterProfile): CharacterProfile {
  const availableLists = [...new Set((input.availableLists || []).map((entry) => normalizeListName(entry)).filter(Boolean))];
  const rawQueue = Array.isArray((input as CharacterProfile & { nextPreparationQueue?: unknown[] }).nextPreparationQueue)
    ? ((input as CharacterProfile & { nextPreparationQueue?: unknown[] }).nextPreparationQueue || [])
    : [];
  const rawPreparedSpells = Array.isArray((input as CharacterProfile & { preparedSpells?: unknown[] }).preparedSpells)
    ? ((input as CharacterProfile & { preparedSpells?: unknown[] }).preparedSpells || [])
    : [];
  const legacyPreparedSpellIds = Array.isArray((input as CharacterProfile & { preparedSpellIds?: string[] }).preparedSpellIds)
    ? ((input as CharacterProfile & { preparedSpellIds?: string[] }).preparedSpellIds || [])
    : [];

  const nextPreparationQueue = normalizeQueueEntries(rawQueue);
  const preparedSpells = normalizePreparedSpells(
    rawPreparedSpells.length ? rawPreparedSpells : legacyPreparedSpellIds,
    { availableLists } as Pick<CharacterProfile, 'availableLists'>,
  );

  return {
    ...input,
    class: String(input.class || '').trim(),
    subclass: String(input.subclass || '').trim(),
    castingAbility: String(input.castingAbility || '').trim(),
    availableLists,
    preparationLimits: getPreparationLimits(input),
    preparedSpells,
    nextPreparationQueue,
    savedIdeas: (input.savedIdeas || [])
      .map((idea) => ({
        spellId: String(idea.spellId || '').trim(),
        note: String(idea.note || '').trim() || undefined,
        createdAt: idea.createdAt || new Date().toISOString(),
      }))
      .filter((idea) => Boolean(idea.spellId)),
  };
}

export function touchProfile(profile: CharacterProfile): CharacterProfile {
  return {
    ...profile,
    updatedAt: new Date().toISOString(),
  };
}
