export type TipoRiesgoTypeCode = 1 | 2 | 3 | 4;

export class TipoRiesgoType {
  constructor(
    private code: TipoRiesgoTypeCode,
    private forHumans: string
  ) {}

  public getCode(): TipoRiesgoTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const I = new TipoRiesgoType(1, 'I');
export const IIA = new TipoRiesgoType(2, 'IIA');
export const IIB = new TipoRiesgoType(3, 'IIB');
export const III = new TipoRiesgoType(4, 'III');

export function tipoRiesgoTypeFactory(code: TipoRiesgoTypeCode): TipoRiesgoType {
  switch (code) {
    case 1:
      return I;
    case 2:
      return IIA;
    case 3:
      return IIB;
    case 4:
      return III;
  }
}

export const TIPOS_RIESGO_VALUES = [I, IIA, IIB, III];
