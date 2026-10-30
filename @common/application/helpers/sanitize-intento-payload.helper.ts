const SECRET_KEY_PATTERNS = [
  /authorization/i,
  /^(?:access|refresh|id)[_-]?token$/i,
  /token/i,
  /password/i,
  /passwd/i,
  /secret/i,
  /jwt/i,
  /api[_-]?key/i,
  /client[_-]?secret/i,
  /credential/i,
  /cookie/i,
  /set-cookie/i,
  /private[_-]?key/i,
];

const SECRET_VALUE_PATTERNS = [
  /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi,
  /\bBasic\s+[A-Za-z0-9+/=]+/gi,
  /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
];

const REDACTED = '[REDACTED]';
const CIRCULAR_REFERENCE = '[Circular]';
const MAX_DEPTH = 50;

export function sanitizeIntentoPayload(payload: unknown): string {
  const seen = new WeakSet<object>();

  const sanitize = (value: unknown, depth: number): unknown => {
    if (depth > MAX_DEPTH) return '[MaxDepthExceeded]';

    if (typeof value === 'string') {
      return SECRET_VALUE_PATTERNS.reduce(
        (result, pattern) => result.replace(pattern, REDACTED),
        value
      );
    }

    if (value === null || typeof value === 'boolean' || typeof value === 'number') {
      return value;
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (
      typeof value === 'undefined' ||
      typeof value === 'function' ||
      typeof value === 'symbol'
    ) {
      return undefined;
    }

    if (typeof value !== 'object') return value;

    if (seen.has(value)) return CIRCULAR_REFERENCE;
    seen.add(value);

    try {
      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value.toISOString();
      }

      if (value instanceof Error) {
        return {
          name: value.name,
          message: sanitize(value.message, depth + 1),
        };
      }

      if (Array.isArray(value)) {
        return value.map((item) => {
          try {
            return sanitize(item, depth + 1) ?? null;
          } catch {
            return '[Unserializable]';
          }
        });
      }

      const output: Record<string, unknown> = {};

      for (const key of Object.keys(value)) {
        if (SECRET_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
          output[key] = REDACTED;
          continue;
        }

        try {
          const item = sanitize((value as Record<string, unknown>)[key], depth + 1);

          if (item !== undefined) {
            output[key] = item;
          }
        } catch {
          output[key] = '[Unserializable]';
        }
      }

      return output;
    } finally {
      seen.delete(value);
    }
  };

  try {
    const sanitized = sanitize(payload, 0);
    return JSON.stringify(sanitized ?? {}) ?? '{}';
  } catch {
    return '{}';
  }
}
