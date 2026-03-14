import type { SnapshotSpell } from '../../shared/snapshot';
import type { SpellRecord } from '../types';

function asString(value: unknown): string {
  return String(value ?? '').trim();
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((entry) => asString(entry)).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((entry) => asString(entry)).filter(Boolean);
  return [];
}

function asLevel(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.trunc(parsed);
}

export function normalizeSpell(input: SnapshotSpell): SpellRecord {
  return {
    id: asString(input.id),
    ddbSpellId: asString(input.ddbSpellId),
    name: asString(input.name),
    level: asLevel(input.level),
    source: asString(input.source),
    page: asString(input.page),
    sourceCitation: asString(input.sourceCitation),
    save: asString(input.save),
    castingTime: asString(input.castingTime),
    notes: asString(input.notes),
    description: asString(input.description),
    school: asString(input.school),
    duration: asString(input.duration),
    rangeArea: asString(input.rangeArea),
    attackSave: asString(input.attackSave),
    damageEffect: asString(input.damageEffect),
    atHigherLevels: asString(input.atHigherLevels),
    components: asString(input.components),
    componentsExpanded: asString(input.componentsExpanded || input.components),
    spellTags: asStringList(input.spellTags),
    availableFor: asStringList(input.availableFor),
    ddbUrl: asString(input.ddbUrl),
  };
}

export function normalizeSpells(spells: SnapshotSpell[]): SpellRecord[] {
  const output: SpellRecord[] = [];
  for (const spell of spells) {
    const normalized = normalizeSpell(spell);
    if (!normalized.id || !normalized.name) continue;
    output.push(normalized);
  }

  return output.sort((left, right) => {
    if (left.level !== right.level) return left.level - right.level;
    return left.name.localeCompare(right.name);
  });
}
