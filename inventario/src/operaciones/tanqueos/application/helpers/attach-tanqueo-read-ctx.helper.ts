import { TenantOverrideContext } from '@common/infrastructure/persistence/transactional';
import { getUser } from '@common/infrastructure/services';
import { TanqueoDetalleRead, TanqueoRead } from '@inn/operaciones/tanqueos/domain/reads';

function sedeNumericaEfectiva(): number {
  const ctx = TenantOverrideContext.getContexto() ?? getUser().context;
  return ctx.getNumericCode();
}

export function attachTanqueoReadCtx<T extends TanqueoRead>(read: T): T {
  read.ctx = sedeNumericaEfectiva();
  return read;
}

export function attachTanqueoReadCtxList(reads: TanqueoRead[]): TanqueoRead[] {
  const numeric = sedeNumericaEfectiva();
  for (const read of reads) {
    if (read.ctx == null) {
      read.ctx = numeric;
    }
  }
  return reads;
}

export function attachTanqueoDetalleReadCtx(read: TanqueoDetalleRead): TanqueoDetalleRead {
  return attachTanqueoReadCtx(read);
}
