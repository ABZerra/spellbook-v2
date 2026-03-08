import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalSnapshotProvider } from '../providers/localSnapshotProvider';
import { ProductionProvider } from '../providers/productionProvider';
import type { SpellCatalogProvider } from '../providers/provider';

const snapshotPayload = {
  spells: [
    { id: 'magic-missile', name: 'Magic Missile', level: 1, source: ['Wizard'], spellList: ['Wizard'], castingTime: '1 Action', save: '' },
    { id: 'shield', name: 'Shield', level: 1, source: ['Wizard'], spellList: ['Wizard'], castingTime: 'Reaction', save: '' },
    { id: 'bless', name: 'Bless', level: 1, source: ['Cleric'], spellList: ['Cleric'], castingTime: '1 Action', save: '' },
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

  const applied = await provider.applyPlan('tester', ['magic-missile']);
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

  profile.preparedSpellIds = ['magic-missile'];
  profile.nextPreparationQueue = [
    { spellId: 'shield', intent: 'replace', replaceTarget: 'magic-missile' },
    { spellId: 'bless', intent: 'queue_only' },
  ];

  await provider.saveCharacterProfile(profile);
  const applied = await provider.applyPlan('queue-check', ['shield'], [{ spellId: 'bless', intent: 'queue_only' }]);

  expect(applied.profile.preparedSpellIds).toEqual(['shield']);
  expect(applied.profile.nextPreparationQueue).toEqual([
    { spellId: 'bless', intent: 'queue_only' },
  ]);

  await provider.deleteCharacterProfile('queue-check');
}

describe('provider contract', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('local provider satisfies shared contract', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === '/spells.snapshot.json' || url === '/spells.json') {
        return makeResponse(snapshotPayload);
      }
      throw new Error(`Unexpected URL: ${url}`);
    }));

    const provider = new LocalSnapshotProvider();
    await assertProviderContract(provider);
    await assertQueueOnlyRetention(provider);
  });

  it('production provider satisfies shared contract', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (url === '/api/spells') {
        return makeResponse({ count: snapshotPayload.spells.length, spells: snapshotPayload.spells });
      }
      if (url === '/api/spells/sync' && init?.method === 'POST') {
        return makeResponse({ ok: true, syncMeta: { refreshedAt: '2026-03-07T00:00:00.000Z' } });
      }
      throw new Error(`Unexpected URL: ${url}`);
    }));

    const provider = new ProductionProvider();
    await assertProviderContract(provider);
    await assertQueueOnlyRetention(provider);
    const sync = await provider.syncCatalog();
    expect(sync.ok).toBe(true);
  });
});
