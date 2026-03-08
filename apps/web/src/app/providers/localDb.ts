import type { CharacterProfile } from '../types';

const DB_NAME = 'spellbook';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

type LocalState = {
  characters: CharacterProfile[];
};

const DEFAULT_STATE: LocalState = {
  characters: [],
};

function cloneState(state: LocalState): LocalState {
  return JSON.parse(JSON.stringify(state));
}

async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB.'));
  });
}

async function runWithStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = run(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed.'));
  });
}

class MemoryStateDb {
  private state = cloneState(DEFAULT_STATE);

  async readState(): Promise<LocalState> {
    return cloneState(this.state);
  }

  async writeState(nextState: LocalState): Promise<void> {
    this.state = cloneState(nextState);
  }
}

class IndexedDbStateDb {
  async readState(): Promise<LocalState> {
    const raw = await runWithStore<unknown>('readonly', (store) => store.get('state'));
    if (!raw || typeof raw !== 'object') return cloneState(DEFAULT_STATE);

    const maybeCharacters = (raw as { characters?: unknown }).characters;
    if (!Array.isArray(maybeCharacters)) {
      return cloneState(DEFAULT_STATE);
    }

    return {
      characters: maybeCharacters as CharacterProfile[],
    };
  }

  async writeState(nextState: LocalState): Promise<void> {
    await runWithStore('readwrite', (store) => store.put(nextState, 'state'));
  }
}

function hasIndexedDbSupport(): boolean {
  return typeof indexedDB !== 'undefined';
}

export type StateDb = MemoryStateDb | IndexedDbStateDb;

export function createStateDb(): StateDb {
  if (hasIndexedDbSupport()) {
    return new IndexedDbStateDb();
  }
  return new MemoryStateDb();
}
