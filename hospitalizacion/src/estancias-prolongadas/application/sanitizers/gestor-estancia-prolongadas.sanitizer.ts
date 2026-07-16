const EMPTY_VALUES = new Set(['', 'null', 'undefined']);

function normalizeKeySegment(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part : `${part.charAt(0).toUpperCase()}${part.slice(1)}`))
    .join('');
}

export function sanitizeGestorEstanciaProlongadasKey(key: string) {
  const normalized = key.replace(/[^a-zA-Z0-9]+/g, '_').replace(/([a-z])([A-Z])/g, '$1_$2');

  return normalizeKeySegment(normalized);
}

export function sanitizeGestorEstanciaProlongadasValue(value: unknown): unknown {
  if (value === undefined || value === null) return null;

  if (Array.isArray(value)) {
    const normalized = value
      .map(item => sanitizeGestorEstanciaProlongadasValue(item))
      .filter(item => item !== null);

    if (!normalized.length) return null;
    if (normalized.every(item => typeof item === 'string')) {
      return normalized[0];
    }

    return normalized;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return EMPTY_VALUES.has(trimmed.toLowerCase()) ? null : trimmed;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  return value;
}
