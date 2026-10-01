export type SignoVitalTypeCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export class SignoVitalType {
  constructor(
    private _code: SignoVitalTypeCode,
    private _field: string,
    private _label: string,
    private _unit: string,
    private _placeholder: string,
    private _icon: string,
    private _isNumeric: boolean
  ) {}

  public getCode(): SignoVitalTypeCode {
    return this._code;
  }

  public getField(): string {
    return this._field;
  }

  public getLabel(): string {
    return this._label;
  }

  public getUnit(): string {
    return this._unit;
  }

  public getPlaceholder(): string {
    return this._placeholder;
  }

  public getIcon(): string {
    return this._icon;
  }

  public isNumeric(): boolean {
    return this._isNumeric;
  }
}

// ================================
// CONSTANTES
// ================================
export const TA = new SignoVitalType(1, 'ta', 'T.A.', 'mmHg', '120/80', 'activity', false);
export const FC = new SignoVitalType(2, 'fc', 'F.C.', 'p/min', '80', 'heart-pulse', true);
export const FR = new SignoVitalType(3, 'fr', 'F.R.', 'r/min', '18', 'wind', true);
export const SATO2 = new SignoVitalType(4, 'sato2', 'SatO₂', '%', '98', 'droplets', true);
export const FCF = new SignoVitalType(5, 'fcf', 'F.C.F.', 'p/min', '-', 'baby', true);
export const GLASGOW = new SignoVitalType(6, 'glasgow', 'Glasgow', '/15', '15', 'brain', true);
export const PESO = new SignoVitalType(7, 'peso', 'Peso', 'kg', '70.0', 'scale', true);
export const TALLA = new SignoVitalType(8, 'talla', 'Talla', 'cm', '170', 'ruler', true);
export const TEMPERATURA = new SignoVitalType(9, 'temp', 'Temp', '°C', '36.5', 'thermometer', true);

// ================================
// FACTORY
// ================================
export function signoVitalFactory(code: SignoVitalTypeCode): SignoVitalType {
  switch (code) {
    case 1:
      return TA;
    case 2:
      return FC;
    case 3:
      return FR;
    case 4:
      return SATO2;
    case 5:
      return FCF;
    case 6:
      return GLASGOW;
    case 7:
      return PESO;
    case 8:
      return TALLA;
    case 9:
      return TEMPERATURA;
  }
}

// ================================
// EXPORTS
// ================================
export const SIGNO_VITAL_PRIMARIO_VALUE = {
  TA,
  FC,
  FR,
  SATO2,
  FCF,
  GLASGOW,
  PESO,
  TALLA,
  TEMPERATURA,
};

export const SIGNO_VITAL_PRIMARIO_VALUES = [
  TA,
  FC,
  FR,
  SATO2,
  FCF,
  GLASGOW,
  PESO,
  TALLA,
  TEMPERATURA,
];

export const SIGNO_VITAL_SECUNDARIO_VALUE = {
  TA,
  FC,
  FR,
  SATO2,
  GLASGOW,
};

export const SIGNO_VITAL_SECUNDARIO_VALUES = [TA, FC, FR, SATO2, GLASGOW];
