import type { SpellCatalogProvider } from './provider';
import { LocalSnapshotProvider } from './localSnapshotProvider';
import { ProductionProvider } from './productionProvider';

const runtime = (import.meta.env.VITE_SPELLBOOK_RUNTIME || '').toLowerCase();

export function createProvider(): SpellCatalogProvider {
  if (runtime === 'production') {
    return new ProductionProvider();
  }

  return new LocalSnapshotProvider();
}
