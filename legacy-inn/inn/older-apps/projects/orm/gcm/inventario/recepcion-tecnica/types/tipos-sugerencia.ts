export type TipoSugerenciaTypeCode = 1 | 2 | 3 | 4 | 5 | 6;

export class TipoSugerenciaType {
  constructor(
    private code: TipoSugerenciaTypeCode,
    private forHumans: string
  ) {}

  public getCode(): TipoSugerenciaTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const UNIDAD_MEDIDA = new TipoSugerenciaType(1, 'UNIDAD DE MEDIDA');
export const LABORATORIO = new TipoSugerenciaType(2, 'LABORATORIO');
export const PROVEEDOR = new TipoSugerenciaType(3, 'PROVEEDOR');
export const PRESENTACION = new TipoSugerenciaType(4, 'PRESENTACION');
export const FORMA_FARMACEUTICA = new TipoSugerenciaType(5, 'FORMA FARMACEUTICA');
export const TRANSPORTADORA = new TipoSugerenciaType(6, 'TRANSPORTADORA');

export function tiposSugerenciaTypeFactory(code: TipoSugerenciaTypeCode): TipoSugerenciaType {
  switch (code) {
    case 1:
      return UNIDAD_MEDIDA;
    case 2:
      return LABORATORIO;
    case 3:
      return PROVEEDOR;
    case 4:
      return PRESENTACION;
    case 5:
      return FORMA_FARMACEUTICA;
    case 6:
      return TRANSPORTADORA;
  }
}

export const TIPOS_SUGERENCIAS_VALUES = [
  UNIDAD_MEDIDA,
  LABORATORIO,
  PROVEEDOR,
  PRESENTACION,
  FORMA_FARMACEUTICA,
  TRANSPORTADORA,
];
