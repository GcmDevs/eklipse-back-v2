export type TipoOrdenDespachoTypeCode = 0 | 1;

export class TipoOrdenDespachoType {
  constructor(private code: TipoOrdenDespachoTypeCode, private forHumans: string) {}

  public getCode(): TipoOrdenDespachoTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const GENERAL = new TipoOrdenDespachoType(0, 'GENERAL');
export const CONSUMO = new TipoOrdenDespachoType(1, 'CONSUMO');

export function tipoOrdenDespachoTypeFactory(
  code: TipoOrdenDespachoTypeCode
): TipoOrdenDespachoType {
  switch (code) {
    case 0:
      return GENERAL;
    case 1:
      return CONSUMO;
  }
}

export const TIPO_ORDEN_DESPACHO_VALUES = [GENERAL, CONSUMO];
