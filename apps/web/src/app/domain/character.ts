import type {
  CharacterProfile,
  CharacterProfileInput,
  NextPreparationQueueEntry,
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

export function getSpellLists(spell: Pick<SpellRecord, 'availableFor' | 'additionalSpellLists'>): string[] {
  const normalized = (spell.availableFor || [])
    .map((entry) => parseAvailableForEntry(entry))
    .filter(Boolean);

  const additional = (spell.additionalSpellLists || [])
    .map((entry) => normalizeListName(entry))
    .filter(Boolean);

  return [...new Set([...normalized, ...additional])];
}

export function isSpellEligibleForCharacter(
  spell: Pick<SpellRecord, 'availableFor' | 'additionalSpellLists'>,
  profile: Pick<CharacterProfile, 'availableLists'>,
): boolean {
  const allowedLists = (profile.availableLists || [])
    .map((entry) => normalizeListName(entry))
    .filter(Boolean);

  if (allowedLists.length === 0) return true;

  const spellLists = getSpellLists(spell);
  if (spellLists.length === 0) return false;
  return spellLists.some((entry) => allowedLists.includes(entry));
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

export function getSpellAssignmentList(
  spell: Pick<SpellRecord, 'availableFor' | 'additionalSpellLists'>,
  profile: Pick<CharacterProfile, 'availableLists'>,
): string | null {
  const spellLists = getSpellLists(spell);
  if (spellLists.length === 0) return null;

  const allowed = (profile.availableLists || []).map((entry) => normalizeListName(entry));
  for (const list of spellLists) {
    if (allowed.includes(list)) return list;
  }

  return spellLists[0] || null;
}

export function enforcePreparationLimits(
  nextSpellIds: string[],
  profile: Pick<CharacterProfile, 'availableLists' | 'preparationLimits' | 'name'>,
  spellsById: Map<string, SpellRecord>,
) {
  const limits = new Map<string, number>();
  for (const entry of profile.preparationLimits || []) {
    limits.set(normalizeListName(entry.list), Math.max(1, Math.trunc(Number(entry.limit) || 1)));
  }

  const counts = new Map<string, number>();

  for (const spellId of nextSpellIds) {
    const spell = spellsById.get(spellId);
    if (!spell) {
      throw new Error(`Unknown spell: ${spellId}`);
    }

    if (!isSpellEligibleForCharacter(spell, profile as CharacterProfile)) {
      throw new Error(`${spell.name} is outside ${profile.name}'s available spell lists.`);
    }

    const list = getSpellAssignmentList(spell, profile as CharacterProfile);
    if (!list) continue;

    const nextCount = (counts.get(list) || 0) + 1;
    counts.set(list, nextCount);

    const limit = limits.get(list);
    if (limit !== undefined && nextCount > limit) {
      throw new Error(`Preparation limit reached for ${list}: ${limit}.`);
    }
  }
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

  for (const raw of values || []) {
    let spellId = '';
    let intent: QueueIntent = 'add';
    let replaceTarget: string | undefined;
    let createdAt: string | undefined;

    if (typeof raw === 'string') {
      spellId = raw;
    } else if (raw && typeof raw === 'object') {
      const candidate = raw as {
        spellId?: string;
        intent?: unknown;
        replaceTarget?: string;
        createdAt?: string;
      };
      spellId = String(candidate.spellId || '').trim();
      intent = normalizeQueueIntent(candidate.intent);
      replaceTarget = String(candidate.replaceTarget || '').trim() || undefined;
      createdAt = String(candidate.createdAt || '').trim() || undefined;
    }

    const normalizedSpellId = String(spellId || '').trim();
    if (!normalizedSpellId || seen.has(normalizedSpellId)) continue;

    const entry: NextPreparationQueueEntry = {
      spellId: normalizedSpellId,
      intent,
    };

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
    preparedSpellIds: [],
    nextPreparationQueue: [],
    savedIdeas: [],
    updatedAt: now,
  };
}

export function normalizeCharacterProfile(input: CharacterProfile): CharacterProfile {
  const rawQueue = Array.isArray((input as CharacterProfile & { nextPreparationQueue?: unknown[] }).nextPreparationQueue)
    ? ((input as CharacterProfile & { nextPreparationQueue?: unknown[] }).nextPreparationQueue || [])
    : [];

  const nextPreparationQueue = normalizeQueueEntries(rawQueue);

  return {
    ...input,
    class: String(input.class || '').trim(),
    subclass: String(input.subclass || '').trim(),
    castingAbility: String(input.castingAbility || '').trim(),
    availableLists: [...new Set((input.availableLists || []).map((entry) => normalizeListName(entry)).filter(Boolean))],
    preparationLimits: getPreparationLimits(input),
    preparedSpellIds: normalizeSpellIdList(input.preparedSpellIds || []),
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
