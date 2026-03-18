import type { QueueIntent } from '../types';

export function getDefaultQueueIntent(preparedCount: number): QueueIntent {
  return preparedCount > 0 ? 'replace' : 'add';
}
