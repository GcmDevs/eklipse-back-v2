export type EstadoTypeCode = 1 | 2 | 3 | 4 | 5 | 6;

export class EstadoType {
  constructor(private code: EstadoTypeCode, private forHumans: string) {}

  public getCode(): EstadoTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const PENDIENTE = new EstadoType(1, 'PENDIENTE');
export const EN_PROCESO = new EstadoType(2, 'EN PROCESO');
export const ENTREGADO = new EstadoType(3, 'ENTREGADO');
export const RECIBIDO = new EstadoType(4, 'RECIBIDO');
export const NO_ENTREGADO = new EstadoType(5, 'NO ENTREGADO');
export const NO_RECIBIDO = new EstadoType(6, 'NO RECIBIDO');

export function estadoTypeFactory(code: EstadoTypeCode): EstadoType {
  switch (code) {
    case 1:
      return PENDIENTE;
    case 2:
      return EN_PROCESO;
    case 3:
      return ENTREGADO;
    case 4:
      return RECIBIDO;
    case 5:
      return NO_ENTREGADO;
    case 6:
      return NO_RECIBIDO;
  }
}

export const ESTADOS = { PENDIENTE, ENTREGADO, RECIBIDO, EN_PROCESO, NO_ENTREGADO, NO_RECIBIDO };
export const ESTADOS_VALUES = [
  PENDIENTE,
  ENTREGADO,
  RECIBIDO,
  EN_PROCESO,
  NO_ENTREGADO,
  NO_RECIBIDO,
];
