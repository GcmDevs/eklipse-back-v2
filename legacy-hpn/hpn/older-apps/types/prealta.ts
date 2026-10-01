import { CtmType } from '@common/domain/types';

export type PrealtaCode = 1 | 2 | 3 | 4 | 5;

const EGRESO_A_DOMICILIO = new CtmType<PrealtaCode>(1, 'EGRESO A DOMICILIO');
const EGRESO_A_DOMICILIO_AMBULANCIA = new CtmType<PrealtaCode>(
  2,
  'EGRESO A DOMICILIO EN AMBULANCIA'
);
const EGRESO_A_PAD = new CtmType<PrealtaCode>(3, 'EGRESO A PAD');
const REMISION = new CtmType<PrealtaCode>(4, 'REMISION');
const HOSPI_CASA = new CtmType<PrealtaCode>(5, 'HOSPI CASA');

export function prealtaTypeFactory(code: PrealtaCode): CtmType<PrealtaCode> {
  switch (code) {
    case 1:
      return EGRESO_A_DOMICILIO;
    case 2:
      return EGRESO_A_DOMICILIO_AMBULANCIA;
    case 3:
      return EGRESO_A_PAD;
    case 4:
      return REMISION;
    case 5:
      return HOSPI_CASA;
  }
}

export const PREALTA_VALUES = [
  EGRESO_A_DOMICILIO,
  EGRESO_A_DOMICILIO_AMBULANCIA,
  EGRESO_A_PAD,
  REMISION,
  HOSPI_CASA,
];

export const PREALTA = {
  EGRESO_A_DOMICILIO,
  EGRESO_A_DOMICILIO_AMBULANCIA,
  EGRESO_A_PAD,
  REMISION,
  HOSPI_CASA,
};
