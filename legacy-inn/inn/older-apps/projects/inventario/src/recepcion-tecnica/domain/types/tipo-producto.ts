export type TipoProductoTypeCode = 1 | 2 | 3;

export class TipoProductoType {
  constructor(private code: TipoProductoTypeCode, private forHumans: string) {}

  public getCode(): TipoProductoTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const MEDICAMENTO = new TipoProductoType(1, 'MEDICAMENTO');
export const DISPOSITIVO = new TipoProductoType(2, 'DISPOSITIVO');
export const REACTIVOS = new TipoProductoType(3, 'REACTIVO');

export function tipoProductoTypeFactory(code: TipoProductoTypeCode): TipoProductoType {
  switch (code) {
    case 1:
      return MEDICAMENTO;
    case 2:
      return DISPOSITIVO;
    case 3:
      return REACTIVOS;
  }
}

export const TIPOS_PRODUCTO_VALUES = [MEDICAMENTO, DISPOSITIVO, REACTIVOS];
