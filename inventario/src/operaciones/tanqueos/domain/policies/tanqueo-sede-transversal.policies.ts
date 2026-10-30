import { GcmContexts } from '@common/application/constants';
import { BadInputError, ForbiddenAccessError } from '@common/domain/errors';
import { REAL_SEDES, RealSedeContextCode } from '@common/domain/types';
import { TipoRegistroTanqueo } from '../enums';

export interface RegistroTanqueoSedePlan {
  esTransversal: boolean;
  sedeEfectiva: GcmContexts;
}

export function resolveRegistroTanqueoSede(input: {
  contextoSesion: GcmContexts;
  sedeDestino?: RealSedeContextCode | null;
  hasRegistrarTransversal: boolean;
  tipoRegistro: TipoRegistroTanqueo;
  conductorRealOid?: number | null;
}): RegistroTanqueoSedePlan {
  const sedeEnviada = input.sedeDestino ?? null;

  if (sedeEnviada != null) {
    if (!REAL_SEDES.some(sede => sede.getCode() === sedeEnviada)) {
      throw new BadInputError('ctx no corresponde a una sede válida para registro de tanqueos');
    }
    if (sedeEnviada === input.contextoSesion) {
      throw new BadInputError(
        'ctx no debe enviarse cuando el registro es en la sede de la sesión'
      );
    }
    if (!input.hasRegistrarTransversal) {
      throw new ForbiddenAccessError('No tiene permisos para registrar tanqueos en otra sede');
    }
    if (input.tipoRegistro !== TipoRegistroTanqueo.COORDINADOR || input.conductorRealOid == null) {
      throw new BadInputError(
        'El registro transversal requiere tipoRegistro COORDINADOR y conductorRealOid'
      );
    }
    return { esTransversal: true, sedeEfectiva: sedeEnviada };
  }

  if (input.tipoRegistro === TipoRegistroTanqueo.COORDINADOR && input.conductorRealOid == null) {
    throw new BadInputError('CONDUCTORREALOID es obligatorio cuando TIPOREGISTRO es COORDINADOR');
  }

  return { esTransversal: false, sedeEfectiva: input.contextoSesion };
}

export function conductorIdParaValidacionSede(input: {
  tipoRegistro: TipoRegistroTanqueo;
  conductorRealOid?: number | null;
  registradoPorId: number;
}): number {
  if (input.tipoRegistro === TipoRegistroTanqueo.COORDINADOR) {
    return input.conductorRealOid as number;
  }
  if (input.conductorRealOid != null) {
    return input.conductorRealOid;
  }
  return input.registradoPorId;
}
