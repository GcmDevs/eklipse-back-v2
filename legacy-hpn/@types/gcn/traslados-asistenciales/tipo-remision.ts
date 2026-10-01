export type TipoRemisionTypeCode = 1 | 2 | 3 | 4 | 5 | 6 | 99;

export class TipoRemisionType {
  constructor(
    private _code: TipoRemisionTypeCode,
    private _forHumans: string
  ) {}

  public getCode(): TipoRemisionTypeCode {
    return this._code;
  }

  public getForHumans(): string {
    return this._forHumans;
  }
}

// ================================
// CONSTANTES
// ================================
export const REMISION_EPS = new TipoRemisionType(1, 'REMISION EPS');
export const CONTRATRANSFERENCIA = new TipoRemisionType(2, 'CONTRATRANSFERENCIA');
export const REFERENCIA_IPS = new TipoRemisionType(3, 'REFERENCIA IPS');

export const ENFERMEDAD_GENERAL = new TipoRemisionType(4, 'ENFERMEDAD GENERAL');
export const ACCIDENTE_LABORAL = new TipoRemisionType(5, 'ACCIDENTE LABORAL');
export const ACCIDENTE_TRANSITO = new TipoRemisionType(6, 'ACCIDENTE DE TRANSITO');
export const OTRO = new TipoRemisionType(99, 'OTRO');

// ================================
// FACTORY
// ================================
export function tipoRemisionFactory(code: TipoRemisionTypeCode): TipoRemisionType {
  switch (code) {
    case 1:
      return REMISION_EPS;
    case 2:
      return CONTRATRANSFERENCIA;
    case 3:
      return REFERENCIA_IPS;
    case 4:
      return ENFERMEDAD_GENERAL;
    case 5:
      return ACCIDENTE_LABORAL;
    case 6:
      return ACCIDENTE_TRANSITO;
    case 99:
      return OTRO;
    default:
      throw new Error('Motivo de traslado no válido');
  }
}

// ================================
// EXPORTS
// ================================
export const TIPO_REMISIONES = {
  REMISION_EPS,
  CONTRATRANSFERENCIA,
  REFERENCIA_IPS,
  OTRO,
};

export const TIPO_REMISIONES_VALUES = [REMISION_EPS, CONTRATRANSFERENCIA, REFERENCIA_IPS, OTRO];

export const MOTIVO_TRASLADO_PRIM_VALUE = {
  ENFERMEDAD_GENERAL,
  ACCIDENTE_LABORAL,
  ACCIDENTE_TRANSITO,
  OTRO,
};

export const MOTIVO_TRASLADO_PRIM_VALUES = [
  ENFERMEDAD_GENERAL,
  ACCIDENTE_LABORAL,
  ACCIDENTE_TRANSITO,
  OTRO,
];
