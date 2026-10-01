export type CondicionTransporteTypeCode = 1 | 2 | 3 | 4;

export class CondicionTransporteType {
  constructor(private code: CondicionTransporteTypeCode, private forHumans: string) {}

  public getCode(): CondicionTransporteTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const MALO = new CondicionTransporteType(1, 'MALO');
export const REGULAR = new CondicionTransporteType(2, 'REGULAR');
export const BUENO = new CondicionTransporteType(3, 'BUENO');
export const EXCELENTE = new CondicionTransporteType(4, 'EXCELENTE');

export function condicionTransporteTypeFactory(
  code: CondicionTransporteTypeCode
): CondicionTransporteType {
  switch (code) {
    case 1:
      return MALO;
    case 2:
      return REGULAR;
    case 3:
      return BUENO;
    case 4:
      return EXCELENTE;
  }
}

export const CONDICIONES_TRANSPORTE_VALUES = [MALO, REGULAR, BUENO, EXCELENTE];
