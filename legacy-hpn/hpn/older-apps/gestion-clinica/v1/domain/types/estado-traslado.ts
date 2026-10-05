export type EstadoTrasladoTypeCode = 0 | 1 | 2 | 3 | 4;

export class EstadoTrasladoType {
  constructor(
    private code: EstadoTrasladoTypeCode,
    private forHumans: string
  ) {}

  public getCode(): EstadoTrasladoTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const PENDIENTE = new EstadoTrasladoType(0, 'PENDIENTE');
export const ASIGNADO = new EstadoTrasladoType(1, 'ASIGNADO');
export const INICIADO = new EstadoTrasladoType(2, 'INICIADO');
export const FINALIZADO = new EstadoTrasladoType(3, 'FINALIZADO');
export const CANCELADO = new EstadoTrasladoType(4, 'CANCELADO');

export function estadoTrasladoTypeFactory(code: EstadoTrasladoTypeCode): EstadoTrasladoType {
  switch (code) {
    case 0:
      return PENDIENTE;
    case 1:
      return ASIGNADO;
    case 2:
      return INICIADO;
    case 3:
      return FINALIZADO;
    case 4:
      return CANCELADO;
  }
}

export const ESTADOS_TRASLADO = { PENDIENTE, ASIGNADO, INICIADO, FINALIZADO, CANCELADO };
export const ESTADOS_TRASLADO_VALUES = [PENDIENTE, ASIGNADO, INICIADO, FINALIZADO, CANCELADO];
