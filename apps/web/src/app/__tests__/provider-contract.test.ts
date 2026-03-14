import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalSnapshotProvider, resolveSnapshotPath } from '../providers/localSnapshotProvider';
import type { SpellCatalogProvider } from '../providers/provider';

const snapshotPayload = {
  spells: [
    {
      id: 'magic-missile',
      ddbSpellId: '2191',
      name: 'Magic Missile',
      level: 1,
      source: 'Basic Rules (2014)',
      page: '257',
      sourceCitation: 'Basic Rules (2014), pg. 257',
      castingTime: '1 Action',
      rangeArea: '120 ft.',
      components: 'V, S',
      componentsExpanded: 'V, S',
      duration: 'Instantaneous',
      school: 'Evocation',
      attackSave: 'None',
      save: '',
      damageEffect: 'Force',
      description: 'Three glowing darts of magical force strike targets of your choice.',
      atHigherLevels: '',
      spellTags: ['Damage'],
      availableFor: ['Sorcerer (Legacy)', 'Wizard (Legacy)'],
      additionalSpellLists: [],
      notes: '',
      ddbUrl: 'https://www.dndbeyond.com/spells/2191-magic-missile',
    },
    {
      id: 'shield',
      ddbSpellId: '2253',
      name: 'Shield',
      level: 1,
      source: 'Basic Rules (2014)',
      page: '275',
      sourceCitation: 'Basic Rules (2014), pg. 275',
      castingTime: '1 Reaction',
      rangeArea: 'Self',
      components: 'V, S',
      componentsExpanded: 'V, S',
      duration: '1 Round',
      school: 'Abjuration',
      attackSave: 'None',
      save: '',
      damageEffect: 'Warding',
      description: 'An invisible barrier of magical force appears and protects you.',
      atHigherLevels: '',
      spellTags: ['Warding'],
      availableFor: ['Sorcerer (Legacy)', 'Wizard (Legacy)'],
      additionalSpellLists: [],
      notes: '',
      ddbUrl: 'https://www.dndbeyond.com/spells/2253-shield',
    },
    {
      id: 'bless',
      ddbSpellId: '2035',
      name: 'Bless',
      level: 1,
      source: 'Basic Rules (2014)',
      page: '219',
      sourceCitation: 'Basic Rules (2014), pg. 219',
      castingTime: '1 Action',
      rangeArea: '30 ft.',
      components: 'V, S, M',
      componentsExpanded: 'V, S, M (a sprinkling of holy water)',
      duration: 'Concentration 1 Minute',
      school: 'Enchantment',
      attackSave: 'None',
      save: '',
      damageEffect: 'Buff',
      description: 'You bless up to three creatures of your choice within range.',
      atHigherLevels: '',
      spellTags: ['Buff'],
      availableFor: ['Cleric (Legacy)', 'Paladin (Legacy)'],
      additionalSpellLists: ['BARD', 'RANGER'],
      notes: '',
      ddbUrl: 'https://www.dndbeyond.com/spells/2035-bless',
    },
  ],
};

function makeResponse(payload: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => payload,
  } as Response;
}

async function assertProviderContract(provider: SpellCatalogProvider) {
  const spells = await provider.listSpells();
  expect(spells.length).toBeGreaterThan(0);
  expect(spells.find((entry) => entry.id === 'bless')?.additionalSpellLists).toEqual(['BARD', 'RANGER']);

  const profile = await provider.createCharacterProfile({
    id: 'tester',
    name: 'Tester',
    availableLists: ['Wizard'],
  });

  expect(profile.id).toBe('tester');

  const listed = await provider.listCharacterProfiles();
  expect(listed.some((entry) => entry.id === 'tester')).toBe(true);

  profile.nextPreparationQueue = [{ spellId: 'magic-missile', intent: 'add' }];
  const saved = await provider.saveCharacterProfile(profile);
  expect(saved.nextPreparationQueue).toEqual([{ spellId: 'magic-missile', intent: 'add' }]);

  const applied = await provider.applyPlan('tester', [{ spellId: 'magic-missile', assignedList: 'WIZARD', mode: 'normal' } as any]);
  expect(applied.appliedSpellIds).toEqual(['magic-missile']);

  await provider.deleteCharacterProfile('tester');
  const afterDelete = await provider.listCharacterProfiles();
  expect(afterDelete.some((entry) => entry.id === 'tester')).toBe(false);
}

async function assertQueueOnlyRetention(provider: SpellCatalogProvider) {
  const profile = await provider.createCharacterProfile({
    id: 'queue-check',
    name: 'Queue Check',
    availableLists: ['Wizard'],
  });

  profile.preparedSpells = [{ spellId: 'magic-missile', assignedList: 'WIZARD', mode: 'normal' } as any];
  profile.nextPreparationQueue = [
    { spellId: 'shield', intent: 'replace', assignedList: 'WIZARD', replaceTarget: 'magic-missile' },
    { spellId: 'bless', intent: 'queue_only' },
  ];

  await provider.saveCharacterProfile(profile);
  const applied = await provider.applyPlan('queue-check', [{ spellId: 'shield', assignedList: 'WIZARD', mode: 'normal' } as any], [{ spellId: 'bless', intent: 'queue_only' }]);

  expect(applied.profile.preparedSpells).toEqual([{ spellId: 'shield', assignedList: 'WIZARD', mode: 'normal' }]);
  expect(applied.profile.nextPreparationQueue).toEqual([
    { spellId: 'bless', intent: 'queue_only' },
  ]);

  await provider.deleteCharacterProfile('queue-check');
}

describe('provider contract', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('snapshot provider satisfies shared contract', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === '/spells.snapshot.json' || url === '/spellbook-v2/spells.snapshot.json') {
        return makeResponse(snapshotPayload);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new LocalSnapshotProvider();
    await assertProviderContract(provider);
    await assertQueueOnlyRetention(provider);
    expect(fetchMock).toHaveBeenCalledWith(resolveSnapshotPath(import.meta.env.BASE_URL || '/'), { cache: 'no-store' });
  });

  it('fails when the canonical snapshot file is missing instead of falling back to legacy paths', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === '/spells.snapshot.json' || url === '/spellbook-v2/spells.snapshot.json') {
        return makeResponse({}, false);
      }
      throw new Error(`Unexpected URL: ${url}`);
    }));

    const provider = new LocalSnapshotProvider();

    await expect(provider.listSpells()).rejects.toThrow(/Failed to load local spell snapshot/i);
  });

  it('resolves the snapshot path relative to the configured app base path', () => {
    expect(resolveSnapshotPath('/')).toBe('/spells.snapshot.json');
    expect(resolveSnapshotPath('/spellbook-v2/')).toBe('/spellbook-v2/spells.snapshot.json');
  });

  it('persists prepared entries with explicit mode data', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === '/spells.snapshot.json' || url === '/spellbook-v2/spells.snapshot.json') {
        return makeResponse(snapshotPayload);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new LocalSnapshotProvider();
    const profile = await provider.createCharacterProfile({
      id: 'mode-check',
      name: 'Mode Check',
      availableLists: ['Wizard'],
    });

    profile.preparedSpells = [{ spellId: 'shield', assignedList: 'WIZARD', mode: 'always' } as any];
    const saved = await provider.saveCharacterProfile(profile);

    expect(saved.preparedSpells).toEqual([
      { spellId: 'shield', assignedList: 'WIZARD', mode: 'always' },
    ]);

    await provider.deleteCharacterProfile('mode-check');
  });
});
