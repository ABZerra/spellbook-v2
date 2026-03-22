import type { SyncStatus } from '../state/SyncService';

interface SyncIndicatorProps {
  status: SyncStatus;
}

export function SyncIndicator({ status }: SyncIndicatorProps) {
  if (status === 'idle') {
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-text-dim">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Synced
      </span>
    );
  }

  if (status === 'syncing') {
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-text-dim">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
        Syncing...
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-[11px] text-blood">
      <span className="h-1.5 w-1.5 rounded-full bg-blood" />
      Sync error
    </span>
  );
}
