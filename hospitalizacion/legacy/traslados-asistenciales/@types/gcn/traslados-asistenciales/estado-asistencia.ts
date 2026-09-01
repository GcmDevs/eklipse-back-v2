export type EstadoAsistenciaTypeCode =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14;

export class EstadoAsistenciaType {
  constructor(
    private _code: EstadoAsistenciaTypeCode,
    private _forHumans: string
  ) {}

  public getCode(): EstadoAsistenciaTypeCode {
    return this._code;
  }

  public getForHumans(): string {
    return this._forHumans;
  }
}

// Estados operativos principales del traslado.
export const CREADO = new EstadoAsistenciaType(1, 'CREADO');
export const ASIGNADO = new EstadoAsistenciaType(2, 'ASIGNADO');
export const ENTREGADO = new EstadoAsistenciaType(3, 'ENTREGADO');
export const RECIBIDO = new EstadoAsistenciaType(4, 'RECIBIDO');
export const EN_CURSO = new EstadoAsistenciaType(5, 'EN CURSO');
export const FINALIZADO = new EstadoAsistenciaType(6, 'FINALIZADO');
export const CANCELADO = new EstadoAsistenciaType(7, 'CANCELADO');

// Eventos/decisiones para historial.
export const REASIGNADO = new EstadoAsistenciaType(8, 'REASIGNADO');
export const APROBADO = new EstadoAsistenciaType(9, 'APROBADO');
export const DEVUELTO = new EstadoAsistenciaType(10, 'DEVUELTO');
export const RECHAZADO = new EstadoAsistenciaType(11, 'RECHAZADO');
export const CANCELACION_SOLICITADA = new EstadoAsistenciaType(12, 'CANCELACION SOLICITADA');
export const CANCELACION_RECHAZADA = new EstadoAsistenciaType(13, 'CANCELACION RECHAZADA');
export const PENDIENTE_RETORNO = new EstadoAsistenciaType(14, 'PENDIENTE RETORNO');

export function estadoAsistenciaTypeFactory(code: EstadoAsistenciaTypeCode): EstadoAsistenciaType {
  switch (code) {
    case 1:
      return CREADO;
    case 2:
      return ASIGNADO;
    case 3:
      return ENTREGADO;
    case 4:
      return RECIBIDO;
    case 5:
      return EN_CURSO;
    case 6:
      return FINALIZADO;
    case 7:
      return CANCELADO;
    case 8:
      return REASIGNADO;
    case 9:
      return APROBADO;
    case 10:
      return DEVUELTO;
    case 11:
      return RECHAZADO;
    case 12:
      return CANCELACION_SOLICITADA;
    case 13:
      return CANCELACION_RECHAZADA;
    case 14:
      return PENDIENTE_RETORNO;
    default:
      return CREADO;
  }
}

export const ESTADOS_ASISTENCIA = {
  CREADO,
  ASIGNADO,
  ENTREGADO,
  RECIBIDO,
  EN_CURSO,
  FINALIZADO,
  CANCELADO,
  REASIGNADO,
  APROBADO,
  DEVUELTO,
  RECHAZADO,
  CANCELACION_SOLICITADA,
  CANCELACION_RECHAZADA,
  PENDIENTE_RETORNO,
};

export const ESTADOS_ASISTENCIA_VALUES = [
  CREADO,
  ASIGNADO,
  ENTREGADO,
  RECIBIDO,
  EN_CURSO,
  FINALIZADO,
  CANCELADO,
  REASIGNADO,
  APROBADO,
  DEVUELTO,
  RECHAZADO,
  CANCELACION_SOLICITADA,
  CANCELACION_RECHAZADA,
  PENDIENTE_RETORNO,
];
