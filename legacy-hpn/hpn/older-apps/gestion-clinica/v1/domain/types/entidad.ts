export type EntidadTypeCode = 1 | 2 | 3;

export class EntidadType {
  constructor(private code: EntidadTypeCode, private forHumans: string) {}

  public getCode(): EntidadTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const SERVICIO = new EntidadType(1, 'SERVICIO');
export const MOTIVO_TRASLADO = new EntidadType(2, 'MOTIVO TRASLADO');
export const VEHICULO = new EntidadType(3, 'VEHICULO');

export function EntidadTypeFactory(code: EntidadTypeCode): EntidadType {
  switch (code) {
    case 1:
      return SERVICIO;
    case 2:
      return MOTIVO_TRASLADO;
    case 3:
      return VEHICULO;
  }
}

export const TIPO_ENTIDADES = { SERVICIO, MOTIVO_TRASLADO, VEHICULO };
export const TIPOS_ENTIDADES_VALUES = [SERVICIO, MOTIVO_TRASLADO, VEHICULO];
