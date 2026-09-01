export type TipoTrasladoTypeCode = 1 | 2;

export class TipoTrasladoType {
  constructor(private code: TipoTrasladoTypeCode, private forHumans: string) {}

  public getCode(): TipoTrasladoTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const SIMPLE = new TipoTrasladoType(1, 'SIMPLE');
export const REDONDO = new TipoTrasladoType(2, 'REDONDO');

export function tipoTrasladoTypeFactory(code: TipoTrasladoTypeCode): TipoTrasladoType {
  switch (code) {
    case 1:
      return SIMPLE;
    case 2:
      return REDONDO;
  }
}

export const TIPOS_TRASLADO_VALUES = [SIMPLE, REDONDO];
export const TIPOS_TRASLADO = { SIMPLE, REDONDO };
