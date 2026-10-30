import { ADMIN_AUTHORITY } from '@common/application/constants';
import { BadInputError, ForbiddenAccessError } from '@common/domain/errors';
import { GcmContextType, REAL_SEDES } from '@common/domain/types';
import { fetchAuthsByUser, getUser } from '@common/infrastructure/services';

export function assertTenantCtxHeaderAllowed(
  tenant: GcmContextType,
  requiredDirectAuthority?: string
): void {
  const session = getUser().context;

  if (!REAL_SEDES.some(sede => sede.getCode() === tenant.getCode())) {
    throw new BadInputError('ctx no corresponde a una sede operativa válida');
  }

  if (tenant.getCode() === session.getCode()) {
    throw new BadInputError('ctx no debe enviarse cuando la operación es en la sede de la sesión');
  }

  if (!requiredDirectAuthority) {
    return;
  }
}

export async function assertTenantCtxHeaderAllowedAsync(
  tenant: GcmContextType,
  requiredDirectAuthority?: string
): Promise<void> {
  assertTenantCtxHeaderAllowed(tenant, undefined);
  if (requiredDirectAuthority) {
    await assertDirectAuthority(requiredDirectAuthority);
  }
}

export async function assertDirectAuthority(authority: string): Promise<void> {
  const user = getUser();
  const userAuthorities = await fetchAuthsByUser({ id: user.id, ctx: user.context });
  const codes = userAuthorities.onlyCodes;
  if (codes.includes(ADMIN_AUTHORITY) || codes.includes(authority)) {
    return;
  }
  throw new ForbiddenAccessError('No tiene permisos para operar en la sede indicada por ctx');
}
