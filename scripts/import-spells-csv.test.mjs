import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getRepoRoot, mapRow } from './import-spells-csv.mjs';

test('mapRow converts D&D Beyond CSV headers into the app snapshot schema', () => {
  const spell = mapRow({
    'DDB Spell ID': '1989',
    'Spell ID': 'acid-splash',
    Name: 'Acid Splash',
    Level: '0',
    Source: 'Basic Rules (2014)',
    Page: '211',
    'Source Citation': 'Basic Rules (2014), pg. 211',
    'Casting Time': '1 Action',
    'Range/Area': '60 ft.',
    Components: 'V, S',
    'Components [expanded]': 'V, S',
    Duration: 'Instantaneous',
    School: 'Conjuration',
    'Attack/Save': 'DEX Save',
    Save: 'Dex',
    'Damage/Effect': 'Acid',
    Notes: '',
    Description: 'You hurl a bubble of acid.',
    'At Higher Levels': '',
    'Spell Tags': 'Damage',
    'Available For': 'Sorcerer (Legacy), Wizard (Legacy), Artificer (Legacy)',
    'DDB URL': 'https://www.dndbeyond.com/spells/1989-acid-splash',
  }, 0);

  assert.deepEqual(spell, {
    id: 'acid-splash',
    ddbSpellId: '1989',
    name: 'Acid Splash',
    level: 0,
    source: 'Basic Rules (2014)',
    page: '211',
    sourceCitation: 'Basic Rules (2014), pg. 211',
    save: 'Dex',
    castingTime: '1 Action',
    notes: '',
    description: 'You hurl a bubble of acid.',
    school: 'Conjuration',
    duration: 'Instantaneous',
    rangeArea: '60 ft.',
    attackSave: 'DEX Save',
    damageEffect: 'Acid',
    atHigherLevels: '',
    components: 'V, S',
    componentsExpanded: 'V, S',
    spellTags: ['Damage'],
    availableFor: ['Sorcerer (Legacy)', 'Wizard (Legacy)', 'Artificer (Legacy)'],
    ddbUrl: 'https://www.dndbeyond.com/spells/1989-acid-splash',
  });
});

test('getRepoRoot resolves the repository root from the importer module url', () => {
  const expected = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  assert.equal(getRepoRoot(), expected);
});
