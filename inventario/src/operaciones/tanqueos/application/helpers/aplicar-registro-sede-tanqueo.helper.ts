import { GcmContexts } from '@common/application/constants';
import { BadInputError } from '@common/domain/errors';
import { RealSedeContextCode } from '@common/domain/types';
import { TipoRegistroTanqueo } from '@inn/operaciones/tanqueos/domain/enums';
import {
  conductorIdParaValidacionSede,
  resolveRegistroTanqueoSede,
  RegistroTanqueoSedePlan,
} from '@inn/operaciones/tanqueos/domain/policies/tanqueo-sede-transversal.policies';
import { assertUsuarioExisteEnSede } from './assert-usuario-en-sede.helper';

export interface ItemRegistroSedeTanqueo {
  tipoRegistro?: TipoRegistroTanqueo;
  conductorRealOid?: number | null;
}

export async function aplicarRegistroSedeTanqueo(input: {
  contextoSesion: GcmContexts;
  sedeDestino?: RealSedeContextCode | null;
  hasRegistrarTransversal: boolean;
  registradoPorId: number;
  items: ItemRegistroSedeTanqueo[];
}): Promise<RegistroTanqueoSedePlan> {
  const primerItem = input.items[0];
  const tipoRegistro = primerItem?.tipoRegistro ?? TipoRegistroTanqueo.CONDUCTOR;

  const plan = resolveRegistroTanqueoSede({
    contextoSesion: input.contextoSesion,
    sedeDestino: input.sedeDestino,
    hasRegistrarTransversal: input.hasRegistrarTransversal,
    tipoRegistro: input.sedeDestino != null ? TipoRegistroTanqueo.COORDINADOR : tipoRegistro,
    conductorRealOid:
      input.sedeDestino != null ? primerItem?.conductorRealOid ?? null : primerItem?.conductorRealOid,
  });

  for (const item of input.items) {
    const tipo = item.tipoRegistro ?? TipoRegistroTanqueo.CONDUCTOR;
    if (input.sedeDestino != null) {
      if (tipo !== TipoRegistroTanqueo.COORDINADOR || item.conductorRealOid == null) {
        throw new BadInputError(
          'El registro transversal requiere tipoRegistro COORDINADOR y conductorRealOid en cada ítem'
        );
      }
    }
    const conductorId = conductorIdParaValidacionSede({
      tipoRegistro: tipo,
      conductorRealOid: item.conductorRealOid,
      registradoPorId: input.registradoPorId,
    });
    await assertUsuarioExisteEnSede(conductorId, plan.sedeEfectiva);
  }

  return plan;
}
