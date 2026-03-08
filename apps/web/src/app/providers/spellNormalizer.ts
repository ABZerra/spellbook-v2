import type { ApiSpell } from '../../shared/api';
import type { SpellRecord } from '../types';

function asString(value: unknown): string {
  return String(value ?? '').trim();
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => asString(entry)).filter(Boolean);
}

function asLevel(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.trunc(parsed);
}

export function normalizeSpell(input: ApiSpell): SpellRecord {
  return {
    id: asString(input.id),
    name: asString(input.name),
    level: asLevel(input.level),
    source: asStringList(input.source),
    spellList: asStringList(input.spellList),
    save: asString(input.save),
    castingTime: asString(input.castingTime),
    notes: asString(input.notes),
    description: asString(input.description),
    school: asString(input.school),
    duration: asString(input.duration),
    range: asString(input.range),
    components: asString(input.components || input.component),
    tags: asStringList(input.tags),
  };
}

export function normalizeSpells(spells: ApiSpell[]): SpellRecord[] {
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
