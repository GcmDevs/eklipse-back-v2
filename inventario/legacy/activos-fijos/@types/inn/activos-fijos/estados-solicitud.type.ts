import { DEFAULT_TYPE, CtmType } from '@common/domain/types';

export type EstadoAfnItemSolSerTecCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export class EstadoAfnItemSolSerTecType extends CtmType<EstadoAfnItemSolSerTecCode> {}

const REGISTRADA = new EstadoAfnItemSolSerTecType(1, 'REGISTRADA');
const ASIGNADA = new EstadoAfnItemSolSerTecType(2, 'ASIGNADA');
const INICIADA = new EstadoAfnItemSolSerTecType(3, 'INICIADA');
const FINALIZADA = new EstadoAfnItemSolSerTecType(4, 'FINALIZADA');
const APROBADA = new EstadoAfnItemSolSerTecType(5, 'APROBADA');
const RECHAZADA = new EstadoAfnItemSolSerTecType(6, 'RECHAZADA');
const REASIGNADA = new EstadoAfnItemSolSerTecType(7, 'REASIGNADA');
const ERRADA = new EstadoAfnItemSolSerTecType(8, 'ERRADA');

export function estadoAfnItemSolSerTecTypeFactory(
  code: EstadoAfnItemSolSerTecCode,
  thowErr = true
): EstadoAfnItemSolSerTecType {
  switch (code) {
    case 1:
      return REGISTRADA;
    case 2:
      return ASIGNADA;
    case 3:
      return INICIADA;
    case 4:
      return FINALIZADA;
    case 5:
      return APROBADA;
    case 6:
      return RECHAZADA;
    case 7:
      return REASIGNADA;
    case 8:
      return ERRADA;
    default: {
      if ([null, undefined].indexOf(code) >= 0) return null;
      else if (thowErr) throw new Error('No existe tipo de servicio tecnico con este codigo');
      else return DEFAULT_TYPE;
    }
  }
}

export const ESTADO_AFNITEM_SOL_SER_TEC_VALUES = [
  REGISTRADA,
  ASIGNADA,
  INICIADA,
  FINALIZADA,
  APROBADA,
  RECHAZADA,
  REASIGNADA,
  ERRADA,
];

export const ESTADO_AFNITEM_SOL_SER_TEC = {
  REGISTRADA,
  ASIGNADA,
  INICIADA,
  FINALIZADA,
  APROBADA,
  RECHAZADA,
  REASIGNADA,
  ERRADA,
};
