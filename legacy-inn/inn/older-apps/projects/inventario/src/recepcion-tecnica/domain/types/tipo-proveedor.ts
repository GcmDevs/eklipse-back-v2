export type TipoProveedorTypeCode = 1 | 2;

export class TipoProveedorType {
  constructor(
    private code: TipoProveedorTypeCode,
    private forHumans: string
  ) {}

  public getCode(): TipoProveedorTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const TLABORATORIO = new TipoProveedorType(1, 'LABORATORIO');
export const DISTRIBUIDORA = new TipoProveedorType(2, 'DISTRIBUIDORA');

export function tipoProveedorTypeFactory(code: TipoProveedorTypeCode): TipoProveedorType {
  switch (code) {
    case 1:
      return TLABORATORIO;
    case 2:
      return DISTRIBUIDORA;
  }
}

export const TIPOS_PROVEEDOR_VALUES = [TLABORATORIO, DISTRIBUIDORA];
export const TIPOS_PROVEEDOR = { LABORATORIO: TLABORATORIO, DISTRIBUIDORA };
