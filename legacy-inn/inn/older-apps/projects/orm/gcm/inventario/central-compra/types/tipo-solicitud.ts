export type TipoSolicitudTypeCode = 1 | 2 | 3 | 4;

export class TipoSolicitudType {
  constructor(
    private code: TipoSolicitudTypeCode,
    private forHumans: string
  ) {}

  public getCode(): TipoSolicitudTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const ACTIVO = new TipoSolicitudType(1, 'ACTIVO');
export const SERVICIO = new TipoSolicitudType(2, 'SERVICIO');
export const PRODUCTO = new TipoSolicitudType(3, 'PRODUCTO');
export const MEDICAMENTO = new TipoSolicitudType(4, 'MEDICAMENTO');

export function tipoSolicitudTypeFactory(code: TipoSolicitudTypeCode): TipoSolicitudType {
  switch (code) {
    case 1:
      return ACTIVO;
    case 2:
      return SERVICIO;
    case 3:
      return PRODUCTO;
    case 4:
      return MEDICAMENTO;
  }
}

export const CONDICIONES_TRANSPORTE_VALUES = [ACTIVO, SERVICIO, PRODUCTO, MEDICAMENTO];
