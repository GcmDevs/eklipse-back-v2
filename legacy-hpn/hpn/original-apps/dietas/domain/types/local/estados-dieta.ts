export type DieEstadoCode = 1 | 2 | 3;

export class DieEstadoType {
  constructor(
    private code: DieEstadoCode,
    private forHumans: string
  ) {}

  public getCode(): DieEstadoCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const PENDIENTE = new DieEstadoType(1, 'PENDIENTE');
export const ENTREGADO = new DieEstadoType(2, 'ENTREGADA');
export const DEVUELTO = new DieEstadoType(3, 'DEVUELTA');

export function dieEstadoTypeFactory(code: DieEstadoCode): DieEstadoType {
  switch (code) {
    case 1:
      return PENDIENTE;
    case 2:
      return ENTREGADO;
    case 3:
      return DEVUELTO;
  }
}

export const ESTADOS_DIETA = { PENDIENTE, ENTREGADO, DEVUELTO };

export const ESTADOS_DIETA_VALUES = [PENDIENTE, ENTREGADO, DEVUELTO];
