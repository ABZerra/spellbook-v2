import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncService } from '../SyncService';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SyncService', () => {
  let service: SyncService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    service = new SyncService();
  });

  afterEach(() => {
    service.stop();
    vi.useRealTimers();
  });

  it('starts with idle status', () => {
    expect(service.getStatus()).toBe('idle');
  });

  it('does not sync when not dirty', async () => {
    service.start('alice', 'sha-1');
    await vi.advanceTimersByTimeAsync(35000);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('syncs when dirty after interval', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, sha: 'new-sha' }),
    });

    const characters = [{ id: 'gandalf', name: 'Gandalf' }];
    service.start('alice', 'sha-1');
    service.markDirty(characters);

    await vi.advanceTimersByTimeAsync(35000);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/users/alice/characters',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ characters, sha: 'sha-1' }),
      }),
    );
    expect(service.getStatus()).toBe('idle');
  });

  it('sets error status on sync failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    service.start('alice', 'sha-1');
    service.markDirty([]);

    await vi.advanceTimersByTimeAsync(35000);

    expect(service.getStatus()).toBe('error');
  });
});
