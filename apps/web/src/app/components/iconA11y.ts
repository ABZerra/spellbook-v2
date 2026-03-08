export function assertIconLabel(label: string): string {
  const normalized = String(label || '').trim();
  if (!normalized) {
    throw new Error('Icon label is required for accessibility.');
  }
  return normalized;
}
