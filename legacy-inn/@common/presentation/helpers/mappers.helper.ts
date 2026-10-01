export function nullIfAbsent<T>(value: T | null | undefined): T | null {
  return value ?? null;
}
