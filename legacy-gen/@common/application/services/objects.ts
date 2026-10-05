export const hasDefinedValues = <T extends object>(obj: T | undefined | null): boolean => {
  if (obj == null) return false;
  const keys = Object.keys(obj);
  if (keys.length === 0) return false;
  return Object.values(obj).some(value => value !== undefined);
};
