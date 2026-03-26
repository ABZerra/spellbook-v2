import type { SpellRecord } from '../types';
import { CLASS_REGISTRY } from './classRegistry';

export interface CatalogClassInfo {
  name: string;
  subclasses: string[];
}

const PARENTHETICAL_RE = /\s*\([^)]*\)\s*/g;

function cleanName(value: string): string {
  return value.replace(PARENTHETICAL_RE, ' ').replace(/\s+/g, ' ').trim();
}

function parseAvailableForEntry(value: string): { className: string; subclass?: string } | null {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const dashIndex = raw.indexOf(' - ');
  if (dashIndex >= 0) {
    const className = cleanName(raw.slice(0, dashIndex));
    const subclass = cleanName(raw.slice(dashIndex + 3));
    if (!className) return null;
    return { className, subclass: subclass || undefined };
  }

  const className = cleanName(raw);
  return className ? { className } : null;
}

export function extractClassInfo(spells: Pick<SpellRecord, 'availableFor'>[]): CatalogClassInfo[] {
  const displayNames = new Map<string, string>();
  const subclassesMap = new Map<string, Set<string>>();

  // Seed from registry
  for (const entry of CLASS_REGISTRY) {
    const key = entry.name.toLowerCase();
    displayNames.set(key, entry.name);
    subclassesMap.set(key, new Set(entry.subclasses));
  }

  // Merge from spell data
  for (const spell of spells) {
    for (const entry of spell.availableFor || []) {
      const parsed = parseAvailableForEntry(entry);
      if (!parsed) continue;

      const key = parsed.className.toLowerCase();

      if (!displayNames.has(key)) {
        displayNames.set(key, parsed.className);
        subclassesMap.set(key, new Set());
      }

      if (parsed.subclass) {
        subclassesMap.get(key)!.add(parsed.subclass);
      }
    }
  }

  const results: CatalogClassInfo[] = [];

  for (const [key, subclasses] of subclassesMap) {
    results.push({
      name: displayNames.get(key)!,
      subclasses: [...subclasses].sort((a, b) => a.localeCompare(b)),
    });
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

export function extractListNames(spells: Pick<SpellRecord, 'availableFor'>[]): string[] {
  const names = new Set<string>();

  // Seed from registry
  for (const entry of CLASS_REGISTRY) {
    names.add(entry.name.toUpperCase());
  }

  // Merge from spell data
  for (const spell of spells) {
    for (const entry of spell.availableFor || []) {
      const parsed = parseAvailableForEntry(entry);
      if (parsed) {
        names.add(parsed.className.toUpperCase());
      }
    }
  }

  return [...names].sort((a, b) => a.localeCompare(b));
}
