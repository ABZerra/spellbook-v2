import { describe, expect, it } from 'vitest';
import { getDefaultQueueIntent } from '../pages/preparePresentation';

describe('prepare presentation', () => {
  it('defaults staged spells to replace when there are prepared spells already active', () => {
    expect(getDefaultQueueIntent(3)).toBe('replace');
  });

  it('defaults staged spells to add when nothing is prepared yet', () => {
    expect(getDefaultQueueIntent(0)).toBe('add');
  });
});
