export function normalizeUppercaseText(value?: string | null): string {
  return value?.trim().replace(/\s+/g, ' ').toUpperCase() ?? '';
}

export function normalizeOptionalUppercaseText(
  value?: string | null,
): string | null {
  if (value == null) return null;
  return normalizeUppercaseText(value) || null;
}
