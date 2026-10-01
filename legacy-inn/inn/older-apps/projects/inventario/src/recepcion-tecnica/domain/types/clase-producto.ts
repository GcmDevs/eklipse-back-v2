export type ClaseProductoTypeCode = 0 | 1;

export class ClaseProductoType {
  constructor(private code: ClaseProductoTypeCode, private forHumans: string) {}

  public getCode(): ClaseProductoTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const PRODUCTOS = new ClaseProductoType(0, 'PRODUCTOS');
export const SERVICIOS = new ClaseProductoType(1, 'SERVICIOS');

export function claseProductoTypeFactory(code: ClaseProductoTypeCode): ClaseProductoType {
  switch (code) {
    case 0:
      return PRODUCTOS;
    case 1:
      return SERVICIOS;
  }
}

export const CLASES_PRODUCTO_VALUES = [PRODUCTOS, SERVICIOS];
