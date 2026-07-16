import { CtmType } from '@common/domain/types';

export type SeguimientoEstadoCode = 1 | 2 | 3 | 4;

const SIN_CAMBIO = new CtmType<SeguimientoEstadoCode>(1, 'Sin cambio');
const BARRERA_RESUELTA_PARCIALMENTE = new CtmType<SeguimientoEstadoCode>(
  2,
  'Barrera resuelta parcialmente'
);
const BARRERA_RESUELTA_EGRESO_48H = new CtmType<SeguimientoEstadoCode>(
  3,
  'Barrera resuelta - egreso en <48h'
);
const NUEVA_BARRERA = new CtmType<SeguimientoEstadoCode>(4, 'Nueva barrera identificada');

export function seguimientoEstadoTypeFactory(
  code: SeguimientoEstadoCode
): CtmType<SeguimientoEstadoCode> {
  switch (code) {
    case 1:
      return SIN_CAMBIO;
    case 2:
      return BARRERA_RESUELTA_PARCIALMENTE;
    case 3:
      return BARRERA_RESUELTA_EGRESO_48H;
    case 4:
      return NUEVA_BARRERA;
  }
}

export const SEGUIMIENTO_ESTADO_VALUES = [
  SIN_CAMBIO,
  BARRERA_RESUELTA_PARCIALMENTE,
  BARRERA_RESUELTA_EGRESO_48H,
  NUEVA_BARRERA,
];

export const SEGUIMIENTO_ESTADO = {
  SIN_CAMBIO,
  BARRERA_RESUELTA_PARCIALMENTE,
  BARRERA_RESUELTA_EGRESO_48H,
  NUEVA_BARRERA,
};
