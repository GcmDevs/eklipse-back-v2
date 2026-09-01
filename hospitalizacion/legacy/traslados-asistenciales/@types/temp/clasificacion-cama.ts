import { CtmType } from '@common/domain/types';

export type ClasificacionCamaCode = 0 | 1 | 2;

const NINGUNO = new CtmType<ClasificacionCamaCode>(0, 'NÍNGUNO');
const HOSPITALIZACION = new CtmType<ClasificacionCamaCode>(1, 'HOSPITALIZACIÓN');
const OBSERVACION = new CtmType<ClasificacionCamaCode>(2, 'OBSERVACIÓN');

export function clasificacionCamaTypeFactory(
  code: ClasificacionCamaCode
): CtmType<ClasificacionCamaCode> {
  switch (code) {
    case 0:
      return NINGUNO;
    case 1:
      return HOSPITALIZACION;
    case 2:
      return OBSERVACION;
  }
}

export const CLASIFICACIONES_CAMA_VALUES = [NINGUNO, HOSPITALIZACION, OBSERVACION];

export const CLASIFICACIONES_CAMA = {
  NINGUNO,
  HOSPITALIZACION,
  OBSERVACION,
};
