import { BadInputError } from '@common/domain/errors';
import { normalizeUppercaseText } from '@common/domain/value-objects';

const NIT_PATTERN = /^[0-9]{5,15}(-[0-9])?$/;

export function normalizeEstacionNit(nit?: string | null): string | null {
  if (nit == null || !nit.trim()) return null;
  const normalized = normalizeUppercaseText(nit.replace(/\s/g, ''));
  if (!NIT_PATTERN.test(normalized)) {
    throw new BadInputError('El NIT de la estación no tiene un formato válido');
  }
  return normalized;
}
