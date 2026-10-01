export type EstadoTypeCode = 1 | 2 | 3 | 4;

export class EstadoType {
  constructor(
    private code: EstadoTypeCode,
    private forHumans: string
  ) {}

  public getCode(): EstadoTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const ASIGNADA = new EstadoType(1, 'ASIGNADA');
export const EN_PROCESO = new EstadoType(2, 'EN PROCESO');
export const CERRADA = new EstadoType(3, 'CERRADA');
export const CANCELADA = new EstadoType(4, 'CANCELADA');

export function estadoTypeFactory(code: EstadoTypeCode): EstadoType {
  switch (code) {
    case 1:
      return ASIGNADA;
    case 2:
      return EN_PROCESO;
    case 3:
      return CERRADA;
    case 4:
      return CANCELADA;
  }
}

export const TIPOS_ESTADO_VALUES = [ASIGNADA, EN_PROCESO, CERRADA, CANCELADA];
export const TIPOS_ESTADO_VITAL = { ASIGNADA, EN_PROCESO, CERRADA, CANCELADA };
