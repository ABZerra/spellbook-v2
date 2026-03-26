import { describe, expect, it } from 'vitest';
import { extractClassInfo, extractListNames } from '../domain/catalog';
import { CLASS_REGISTRY } from '../domain/classRegistry';

describe('extractClassInfo', () => {
  it('returns all 11 registry classes with empty spell array', () => {
    const result = extractClassInfo([]);
    expect(result).toHaveLength(11);

    const names = result.map((c) => c.name);
    for (const entry of CLASS_REGISTRY) {
      expect(names).toContain(entry.name);
    }
  });

  it('includes all registry subclasses for each class', () => {
    const result = extractClassInfo([]);
    for (const entry of CLASS_REGISTRY) {
      const found = result.find((c) => c.name === entry.name);
      expect(found).toBeDefined();
      for (const sub of entry.subclasses) {
        expect(found!.subclasses).toContain(sub);
      }
    }
  });

  it('merges spell-data subclasses into registry classes without duplicates', () => {
    const spells = [
      { availableFor: ['Cleric (Legacy) - Life Domain'] },
    ];
    const result = extractClassInfo(spells);
    const cleric = result.find((c) => c.name === 'Cleric')!;

    const count = cleric.subclasses.filter((s) => s === 'Life Domain').length;
    expect(count).toBe(1);
  });

  it('merges a novel spell-data subclass into the correct registry class', () => {
    const spells = [
      { availableFor: ['Wizard (Legacy) - School of Hypothetics'] },
    ];
    const result = extractClassInfo(spells);
    const wizard = result.find((c) => c.name === 'Wizard')!;
    expect(wizard.subclasses).toContain('School of Hypothetics');
  });

  it('returns results sorted alphabetically by class name', () => {
    const result = extractClassInfo([]);
    const names = result.map((c) => c.name);
    expect(names).toEqual([...names].sort());
  });

  it('has correct subclass counts for key classes', () => {
    const result = extractClassInfo([]);
    const find = (name: string) => result.find((c) => c.name === name)!;
    expect(find('Artificer').subclasses).toHaveLength(4);
    expect(find('Bard').subclasses).toHaveLength(8);
    expect(find('Cleric').subclasses).toHaveLength(14);
    expect(find('Druid').subclasses).toHaveLength(7);
    expect(find('Fighter').subclasses).toHaveLength(1);
    expect(find('Paladin').subclasses).toHaveLength(9);
    expect(find('Ranger').subclasses).toHaveLength(8);
    expect(find('Rogue').subclasses).toHaveLength(1);
    expect(find('Sorcerer').subclasses).toHaveLength(8);
    expect(find('Warlock').subclasses).toHaveLength(9);
    expect(find('Wizard').subclasses).toHaveLength(13);
  });

  it('returns subclasses sorted alphabetically within each class', () => {
    const result = extractClassInfo([]);
    for (const entry of result) {
      expect(entry.subclasses).toEqual([...entry.subclasses].sort((a, b) => a.localeCompare(b)));
    }
  });
});

describe('extractListNames', () => {
  it('returns all 11 registry class names (uppercased) with empty spell array', () => {
    const result = extractListNames([]);
    expect(result).toHaveLength(11);

    for (const entry of CLASS_REGISTRY) {
      expect(result).toContain(entry.name.toUpperCase());
    }
  });

  it('merges additional class names from spell data', () => {
    const spells = [
      { availableFor: ['Mystic (Legacy)'] },
    ];
    const result = extractListNames(spells);
    expect(result).toContain('MYSTIC');
    expect(result).toContain('WIZARD');
  });

  it('returns sorted results', () => {
    const result = extractListNames([]);
    expect(result).toEqual([...result].sort());
  });
});
