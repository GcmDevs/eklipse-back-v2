import { CtmType } from '@common/domain/types';

export type ClasificacionCamaCode = 0 | 1 | 2;

export class ClasificacionCamaType extends CtmType<ClasificacionCamaCode> {}

const NINGUNO = new ClasificacionCamaType(0, 'NÍNGUNO');
const HOSPITALIZACION = new ClasificacionCamaType(1, 'HOSPITALIZACIÓN');
const OBSERVACION = new ClasificacionCamaType(2, 'OBSERVACIÓN');

export function clasificacionCamaTypeFactory(code: ClasificacionCamaCode): ClasificacionCamaType {
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

export const CLASIFICACIONES_CAMA = { NINGUNO, HOSPITALIZACION, OBSERVACION };
