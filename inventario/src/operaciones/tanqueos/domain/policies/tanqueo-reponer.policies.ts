import { ForbiddenAccessError } from '@common/domain/errors';
import { TipoRegistroTanqueo } from '../enums';

export function requiresReponerPermission(input: {
  tipoRegistro?: TipoRegistroTanqueo | null;
  conductorRealOid?: number | null;
}): boolean {
  if (input.tipoRegistro === TipoRegistroTanqueo.COORDINADOR) return true;
  if (input.conductorRealOid != null) return true;
  return false;
}

export function assertReponerAuthorityIfRequired(
  hasReponerAuthority: boolean,
  input: {
    tipoRegistro?: TipoRegistroTanqueo | null;
    conductorRealOid?: number | null;
  }
): void {
  if (!requiresReponerPermission(input)) return;
  if (!hasReponerAuthority) {
    throw new ForbiddenAccessError('No tiene permisos para esta operación');
  }
}

/** @deprecated Use requiresReponerPermission */
export const requiresPermisoReponer = requiresReponerPermission;
