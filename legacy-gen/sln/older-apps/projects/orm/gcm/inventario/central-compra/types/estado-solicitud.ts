export type EstadoSolicitudTypeCode = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export class EstadoSolicitudType {
  constructor(private code: EstadoSolicitudTypeCode, private forHumans: string) {}

  public getCode(): EstadoSolicitudTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const REGISTRADO = new EstadoSolicitudType(1, 'REGISTRADO');
export const SOLICITADO = new EstadoSolicitudType(2, 'APROBADO');
export const EN_CONTIZACION = new EstadoSolicitudType(3, 'EN CONTIZACION');
export const APROBADO = new EstadoSolicitudType(4, 'APROBADO');
export const RECIBIDO = new EstadoSolicitudType(5, 'RECIBIDO');
export const PAGADO = new EstadoSolicitudType(6, 'PAGADO');
export const RECHAZADO = new EstadoSolicitudType(7, 'RECHAZADO');

export function estadoSolicitudTypeFactory(code: EstadoSolicitudTypeCode): EstadoSolicitudType {
  switch (code) {
    case 1:
      return REGISTRADO;
    case 2:
      return SOLICITADO;
    case 3:
      return EN_CONTIZACION;
    case 4:
      return APROBADO;
    case 5:
      return RECIBIDO;
    case 6:
      return PAGADO;
    case 7:
      return RECHAZADO;
  }
}

export const TIPOS_SUGERENCIAS_VALUES = [
  SOLICITADO,
  EN_CONTIZACION,
  APROBADO,
  RECIBIDO,
  PAGADO,
  RECHAZADO,
  REGISTRADO,
];
