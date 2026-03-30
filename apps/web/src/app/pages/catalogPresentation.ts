import type { CatalogRow } from './catalogViewModel';

interface CatalogRowPresentationInput {
  row: CatalogRow;
  addableLists: string[];
}

export interface CatalogRowPresentation {
  stateLabel: string;
  actionLabel: string;
  disabled: boolean;
  helperText: string;
}

export function getCatalogRowPresentation({
  row,
  addableLists,
}: CatalogRowPresentationInput): CatalogRowPresentation {
  if (row.queued) {
    return {
      stateLabel: 'Queued',
      actionLabel: 'Queued ✓',
      disabled: false,
      helperText: 'Already staged for the next preparation.',
    };
  }

  if (row.markedForReplacement) {
    return {
      stateLabel: 'Replacing',
      actionLabel: 'Replacing \u2713',
      disabled: false,
      helperText: 'Marked for replacement. Click to undo.',
    };
  }

  if (!row.eligible) {
    return {
      stateLabel: 'Off-list',
      actionLabel: 'Off-list',
      disabled: true,
      helperText: 'This spell is outside your active spell lists.',
    };
  }

  if (addableLists.length === 0) {
    return {
      stateLabel: 'Too High',
      actionLabel: 'Too High',
      disabled: true,
      helperText: 'This spell is above every owned list max spell level.',
    };
  }

  if (row.prepared) {
    return {
      stateLabel: 'Prepared',
      actionLabel: 'Prepared \u00b7 Replace',
      disabled: false,
      helperText: 'Prepared now. Click to mark for replacement.',
    };
  }

  return {
    stateLabel: 'Available',
    actionLabel: 'Queue',
    disabled: false,
    helperText: addableLists.length > 1
      ? 'Choose the best list after you stage it.'
      : `Ready for ${addableLists[0]}.`,
  };
}
