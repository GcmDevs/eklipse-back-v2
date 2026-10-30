import { GcmContexts } from '@common/application/constants';
import { BadInputError } from '@common/domain/errors';
import { GcmContextType, REAL_SEDES, RealSedeContextCode } from '@common/domain/types';
import { TenantOverrideContext } from '@common/infrastructure/persistence/transactional';

function assertRealSedeOperativa(contexto: GcmContextType): void {
  if (!REAL_SEDES.some(sede => sede.getCode() === contexto.getCode())) {
    throw new BadInputError('ctx no corresponde a una sede operativa válida');
  }
}

export function resolveSedeDestinoFromCtxHeader(
  contextoSesion: GcmContexts
): RealSedeContextCode | null {
  const override = TenantOverrideContext.getContexto();
  if (!override) {
    return null;
  }
  assertRealSedeOperativa(override);
  const code = override.getCode();
  if (code === contextoSesion) {
    throw new BadInputError('ctx no debe enviarse cuando la operación es en la sede de la sesión');
  }
  return code as RealSedeContextCode;
}

export function resolveContextoOperativoTransversal(
  contextoSesion: GcmContextType,
  ctxHeader?: GcmContextType
): GcmContextType {
  const contexto = ctxHeader ?? contextoSesion;
  assertRealSedeOperativa(contexto);
  return contexto;
}
