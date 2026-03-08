import type { ApiSpell, SpellsResponse } from '../../shared/api';
import type { CatalogSyncResult, SpellRecord } from '../types';
import { normalizeSpells } from './spellNormalizer';
import { LocalSnapshotProvider } from './localSnapshotProvider';

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (payload && typeof payload === 'object' && 'error' in payload)
      ? String((payload as { error?: string }).error || 'Request failed.')
      : 'Request failed.';
    throw new Error(message);
  }

  return payload as T;
}

export class ProductionProvider extends LocalSnapshotProvider {
  readonly runtime = 'production' as const;

  async listSpells(): Promise<SpellRecord[]> {
    const payload = await requestJson<SpellsResponse>('/api/spells', { method: 'GET' });
    const spells = Array.isArray(payload.spells) ? payload.spells : [];
    return normalizeSpells(spells as ApiSpell[]);
  }

  async syncCatalog(): Promise<CatalogSyncResult> {
    const payload = await requestJson<{ ok?: boolean; syncMeta?: { refreshedAt?: string | null }; count?: number }>('/api/spells/sync', {
      method: 'POST',
    });

    return {
      ok: Boolean(payload.ok ?? true),
      refreshedAt: payload.syncMeta?.refreshedAt || new Date().toISOString(),
    };
  }
}
