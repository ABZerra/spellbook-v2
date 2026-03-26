import { fetchWithRetry } from './fetchWithRetry.js';

export type SyncStatus = 'idle' | 'syncing' | 'error';

type StatusListener = (status: SyncStatus) => void;

const SYNC_INTERVAL_MS = 30_000;

export class SyncService {
  private userId: string | null = null;
  private sha: string | null = null;
  private dirty = false;
  private pendingCharacters: unknown[] | null = null;
  private status: SyncStatus = 'idle';
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<StatusListener> = new Set();
  private handleBeforeUnload: (() => void) | null = null;

  getStatus(): SyncStatus {
    return this.status;
  }

  onStatusChange(listener: StatusListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setStatus(next: SyncStatus) {
    this.status = next;
    this.listeners.forEach((fn) => fn(next));
  }

  start(userId: string, sha: string | null) {
    this.stop();
    this.userId = userId;
    this.sha = sha;
    this.dirty = false;
    this.pendingCharacters = null;
    this.setStatus('idle');

    this.intervalId = setInterval(() => {
      void this.flush();
    }, SYNC_INTERVAL_MS);

    if (typeof window !== 'undefined') {
      this.handleBeforeUnload = () => {
        if (!this.dirty || !this.userId || !this.pendingCharacters) return;
        const body = JSON.stringify({ characters: this.pendingCharacters, sha: this.sha });
        fetch(`/api/users/${encodeURIComponent(this.userId)}/characters`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      };
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    }
  }

  stop() {
    if (this.handleBeforeUnload && typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
      this.handleBeforeUnload = null;
    }
    // Fire-and-forget flush of any pending data
    void this.flush();
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.userId = null;
    this.dirty = false;
    this.pendingCharacters = null;
    this.setStatus('idle');
  }

  markDirty(characters: unknown[]) {
    this.dirty = true;
    this.pendingCharacters = characters;
  }

  updateSha(sha: string | null) {
    this.sha = sha;
  }

  async flush(): Promise<void> {
    if (!this.dirty || !this.userId || !this.pendingCharacters) return;

    this.dirty = false;
    const characters = this.pendingCharacters;
    this.pendingCharacters = null;

    this.setStatus('syncing');
    try {
      const res = await fetchWithRetry(`/api/users/${encodeURIComponent(this.userId)}/characters`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characters, sha: this.sha }),
      });

      if (!res.ok) {
        throw new Error(`Sync failed: ${res.status}`);
      }

      const body = await res.json() as { ok: boolean; sha: string };
      if (body.sha) {
        this.sha = body.sha;
      }

      this.setStatus('idle');
    } catch {
      this.dirty = true;
      this.pendingCharacters = characters;
      this.setStatus('error');
    }
  }
}
