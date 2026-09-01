export type CodigoCupsTypeCode = 1 | 2 | 3 | 4;

export class CodigoCupsType {
  constructor(
    private _code: CodigoCupsTypeCode,
    private _forHumans: string
  ) {}

  public getCode(): CodigoCupsTypeCode {
    return this._code;
  }

  public getForHumans(): string {
    return this._forHumans;
  }
}

// ================================
// CONSTANTES
// ================================
export const CODIGO_T01 = new CodigoCupsType(1, '601T01');
export const CODIGO_T02 = new CodigoCupsType(2, '601T02');
export const CODIGO_T03 = new CodigoCupsType(3, '602T01');
export const CODIGO_T04 = new CodigoCupsType(4, '602T02');

// ================================
// FACTORY
// ================================
export function codigoCupsFactory(code: CodigoCupsTypeCode): CodigoCupsType {
  switch (code) {
    case 1:
      return CODIGO_T01;
    case 2:
      return CODIGO_T02;
    case 3:
      return CODIGO_T03;
    case 4:
      return CODIGO_T04;
    default:
      throw new Error('Codigo no encontrado');
  }
}

// ================================
// EXPORTS
// ================================
export const CODIGOS_CUPS = {
  CODIGO_T01,
  CODIGO_T02,
  CODIGO_T03,
  CODIGO_T04,
};

export const CODIGOS_CUPS_VALUES = [CODIGO_T01, CODIGO_T02, CODIGO_T03, CODIGO_T04];
