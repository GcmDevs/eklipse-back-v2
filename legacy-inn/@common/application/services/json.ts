export const safeParseJson = <T> (
  raw: string | null | undefined,
  fallback: T,
): T  => {
  if (raw == null || raw === '') {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const unwrapJsonString = (
  value: string,
  maxDepth = 2,
): unknown | undefined => {
  let current: unknown = value;

  for (let i = 0; i < maxDepth; i++) {
    if (typeof current !== 'string') {
      return current;
    }

    try {
      current = JSON.parse(current);
    } catch {
      return undefined;
    }
  }

  return current;
}
