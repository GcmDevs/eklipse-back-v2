import { CtmType } from '@common/domain/types';

export type EstadoIngresoCode = 1 | 2 | 3 | 4 | 5;

const REGISTRADO = new CtmType<EstadoIngresoCode>(1, 'REGISTRADO');
const FACTURADO = new CtmType<EstadoIngresoCode>(2, 'FACTURADO');
const ANULADO = new CtmType<EstadoIngresoCode>(3, 'ANULADO');
const BLOQUEADO = new CtmType<EstadoIngresoCode>(4, 'BLOQUEADO');
const CIERRE_ADMINISTRATIVO = new CtmType<EstadoIngresoCode>(5, 'CIERRE ADMINISTRATIVO');

export function estadoIngresoFactory(code: EstadoIngresoCode): CtmType<EstadoIngresoCode> {
  switch (code) {
    case 1:
      return REGISTRADO;
    case 2:
      return FACTURADO;
    case 3:
      return ANULADO;
    case 4:
      return BLOQUEADO;
    case 5:
      return CIERRE_ADMINISTRATIVO;
  }
}

export const ESTADO_INGRESO_VALUES = [
  REGISTRADO,
  FACTURADO,
  ANULADO,
  BLOQUEADO,
  CIERRE_ADMINISTRATIVO,
];

export const ESTADO_INGRESO = {
  REGISTRADO,
  FACTURADO,
  ANULADO,
  BLOQUEADO,
  CIERRE_ADMINISTRATIVO,
};
