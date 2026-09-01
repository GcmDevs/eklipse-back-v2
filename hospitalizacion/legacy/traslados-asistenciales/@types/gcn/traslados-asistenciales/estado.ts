export type EstadoTrasladoTypeCode = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export class EstadoTrasladoType {
  constructor(private _code: EstadoTrasladoTypeCode, private _forHumans: string) {}

  public getCode(): EstadoTrasladoTypeCode {
    return this._code;
  }

  public getForHumans(): string {
    return this._forHumans;
  }
}

export const SOLICITADO = new EstadoTrasladoType(1, 'SOLICITADO');
export const ASIGNADO = new EstadoTrasladoType(2, 'ASIGNADO');
export const PENDIENTE_RECEPCION = new EstadoTrasladoType(3, 'PENDIENTE RECEPCIÓN');
export const EN_RUTA = new EstadoTrasladoType(4, 'EN RUTA');
export const RECHAZADO = new EstadoTrasladoType(5, 'RECHAZADO');
export const CANCELADO = new EstadoTrasladoType(6, 'CANCELADO');
export const FINALIZADO = new EstadoTrasladoType(7, 'FINALIZADO');

export function estadoTrasladoTypeFactory(code: EstadoTrasladoTypeCode): EstadoTrasladoType {
  switch (code) {
    case 1:
      return SOLICITADO;
    case 2:
      return ASIGNADO;
    case 3:
      return PENDIENTE_RECEPCION;
    case 4:
      return EN_RUTA;
    case 5:
      return RECHAZADO;
    case 6:
      return CANCELADO;
    case 7:
      return FINALIZADO;
    default:
      return SOLICITADO;
  }
}

export const ESTADOS_TRASLADOS = {
  SOLICITADO,
  ASIGNADO,
  PENDIENTE_RECEPCION,
  EN_RUTA,
  RECHAZADO,
  CANCELADO,
  FINALIZADO,
};
export const ESTADOS_TRASLADOS_VALUES = [
  SOLICITADO,
  ASIGNADO,
  PENDIENTE_RECEPCION,
  EN_RUTA,
  RECHAZADO,
  CANCELADO,
  FINALIZADO,
];
