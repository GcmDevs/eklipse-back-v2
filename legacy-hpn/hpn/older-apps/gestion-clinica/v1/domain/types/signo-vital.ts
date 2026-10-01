export type SignoVitalTypeCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export class SignoVitalType {
  constructor(
    private code: SignoVitalTypeCode,
    private forHumans: string,
    private unidadMedida: string
  ) {}

  public getCode(): SignoVitalTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }

  public getUnidadMedidas(): string {
    return this.unidadMedida;
  }
}

export const TA = new SignoVitalType(1, 'TA', 'MMGH');
export const FC = new SignoVitalType(2, 'FC', 'P/MIN');
export const FCF = new SignoVitalType(3, 'FCF', 'P/MIN');
export const FR = new SignoVitalType(4, 'FR', 'R/MIN');
export const SATO2 = new SignoVitalType(5, 'SATO2', '');
export const GLASGOW = new SignoVitalType(6, 'GLASGOW', '');
export const TEMP = new SignoVitalType(7, 'TEMP', '°C');
export const PESO = new SignoVitalType(8, 'PESO', 'KG');
export const TALLA = new SignoVitalType(9, 'TALLA', 'CM ');

export function signoVitalesTypeFactory(code: SignoVitalTypeCode): SignoVitalType {
  switch (code) {
    case 1:
      return TA;
    case 2:
      return FC;
    case 3:
      return FCF;
    case 4:
      return FR;
    case 5:
      return SATO2;
    case 6:
      return GLASGOW;
    case 7:
      return TEMP;
    case 8:
      return PESO;
    case 9:
      return TALLA;
  }
}

export const SIGNOS_VISTALES = {
  TA,
  FC,
  FCF,
  FR,
  SATO2,
  GLASGOW,
  TEMP,
  PESO,
  TALLA,
};

export const SIGNOS_VISTALES_VALUES = [TA, FC, FCF, FR, SATO2, GLASGOW, TEMP, PESO, TALLA];
