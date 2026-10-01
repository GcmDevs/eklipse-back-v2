import { CtmType } from '@common/domain/types';

export type BloqueoCamaCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

const AISLAMIENTO = new CtmType<BloqueoCamaCode>(1, 'AISLAMIENTO');
const INTERVENCION = new CtmType<BloqueoCamaCode>(2, 'INTERVENCION');
const CONTACTO = new CtmType<BloqueoCamaCode>(3, 'CONTACTO');
const PROTECTOR = new CtmType<BloqueoCamaCode>(4, 'PROTECTOR');
const GOTAS = new CtmType<BloqueoCamaCode>(5, 'GOTAS');
const AEROSOL = new CtmType<BloqueoCamaCode>(6, 'AEROSOL');
const VECTORES = new CtmType<BloqueoCamaCode>(7, 'VECTORES');
const BIOMEDICINA = new CtmType<BloqueoCamaCode>(8, 'BIOMEDICINA');
const AMBIENTAL = new CtmType<BloqueoCamaCode>(9, 'AMBIENTAL');
const INFRAESTRUCTUTA = new CtmType<BloqueoCamaCode>(10, 'INFRAESTRUCTUTA');

export function bloqueoCamaTypeFactory(code: BloqueoCamaCode): CtmType<BloqueoCamaCode> {
  switch (code) {
    case 1:
      return AISLAMIENTO;
    case 2:
      return INTERVENCION;
    case 3:
      return CONTACTO;
    case 4:
      return PROTECTOR;
    case 5:
      return GOTAS;
    case 6:
      return AEROSOL;
    case 7:
      return VECTORES;
    case 8:
      return BIOMEDICINA;
    case 9:
      return AMBIENTAL;
    case 10:
      return INFRAESTRUCTUTA;
  }
}

export const BLOQUEOS_CAMA_VALUES = [
  AISLAMIENTO,
  INTERVENCION,
  CONTACTO,
  PROTECTOR,
  GOTAS,
  AEROSOL,
  VECTORES,
  BIOMEDICINA,
  AMBIENTAL,
  INFRAESTRUCTUTA,
];

export const BLOQUEOS_CAMA = {
  AISLAMIENTO,
  INTERVENCION,
  CONTACTO,
  PROTECTOR,
  GOTAS,
  AEROSOL,
  VECTORES,
  BIOMEDICINA,
  AMBIENTAL,
  INFRAESTRUCTUTA,
};
