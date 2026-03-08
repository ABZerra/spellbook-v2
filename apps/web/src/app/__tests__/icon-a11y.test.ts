import { describe, expect, it } from 'vitest';
import { assertIconLabel } from '../components/iconA11y';

describe('icon accessibility', () => {
  it('requires a non-empty label for icon usage', () => {
    expect(() => assertIconLabel('')).toThrow(/required/i);
    expect(assertIconLabel('Prepare spell')).toBe('Prepare spell');
  });
});
