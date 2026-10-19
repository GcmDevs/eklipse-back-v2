import { CtmType } from '@common/domain/types';

export type RCTSugerenciaCode = 1 | 2 | /* 3 | */ 4 | 5 | 6 | 7;

export class RCTSugerenciaType extends CtmType<RCTSugerenciaCode> {}

export const unidadMedida = new RCTSugerenciaType(1, 'UNIDAD DE MEDIDA (CONCENTRACIÓN)');
export const laboratorio = new RCTSugerenciaType(2, 'LABORATORIO');
/* export const proveedor = new RCTSugerenciaType(3, 'PROVEEDOR'); */
export const presentacion = new RCTSugerenciaType(4, 'PRESENTACION');
export const formaFarmaceutica = new RCTSugerenciaType(5, 'FORMA FARMACEUTICA');
export const transportadora = new RCTSugerenciaType(6, 'TRANSPORTADORA');
export const vidaUtil = new RCTSugerenciaType(7, 'VIDA UTIL');

export function RCTSugerenciaTypeFactory(code: RCTSugerenciaCode): RCTSugerenciaType {
  switch (code) {
    case 1:
      return unidadMedida;
    case 2:
      return laboratorio;
    /*     case 3:
      return proveedor; */
    case 4:
      return presentacion;
    case 5:
      return formaFarmaceutica;
    case 6:
      return transportadora;
    case 7:
      return vidaUtil;
  }
}

export const TIPOS_SUGERENCIAS = {
  unidadMedida,
  laboratorio,
  /*   proveedor, */
  presentacion,
  formaFarmaceutica,
  transportadora,
  vidaUtil,
};

export const TIPOS_SUGERENCIAS_VALUES = [
  unidadMedida,
  laboratorio,
  /*   proveedor, */
  presentacion,
  formaFarmaceutica,
  transportadora,
  vidaUtil,
];
