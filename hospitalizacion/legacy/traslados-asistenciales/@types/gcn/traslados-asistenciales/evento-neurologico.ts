export type CondicionClinicaCode = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export class CondicionClinicaType {
  constructor(
    private _code: CondicionClinicaCode,
    private _forHumans: string
  ) {}

  public getCode(): CondicionClinicaCode {
    return this._code;
  }

  public getForHumans(): string {
    return this._forHumans;
  }
}

export const HIPOGLUCEMIA = new CondicionClinicaType(1, 'HIPOGLUCEMIA');

export const HIPOXEMIA = new CondicionClinicaType(2, 'HIPOXEMIA');

export const ARRITMIA_BAJO_GASTO = new CondicionClinicaType(3, 'ARRITMIA DE BAJO GASTO');

export const PARALISIS_DE_TODD = new CondicionClinicaType(4, 'PARÁLISIS DE TODD');

export const CRISIS_HIPERTENSIVA = new CondicionClinicaType(5, 'CRISIS HIPERTENSIVA');

export const ICTUS_ISQUEMICO = new CondicionClinicaType(6, 'ICTUS ISQUÉMICO');

export const ACCIDENTE_CEREBROVASCULAR = new CondicionClinicaType(7, 'ACCIDENTE CEREBROVASCULAR');

export function condicionClinicaTypeFactory(code: CondicionClinicaCode): CondicionClinicaType {
  switch (code) {
    case 1:
      return HIPOGLUCEMIA;

    case 2:
      return HIPOXEMIA;

    case 3:
      return ARRITMIA_BAJO_GASTO;

    case 4:
      return PARALISIS_DE_TODD;

    case 5:
      return CRISIS_HIPERTENSIVA;

    case 6:
      return ICTUS_ISQUEMICO;

    case 7:
      return ACCIDENTE_CEREBROVASCULAR;

    default:
      return HIPOGLUCEMIA;
  }
}

export const CONDICIONES_CLINICAS = {
  HIPOGLUCEMIA,
  HIPOXEMIA,
  ARRITMIA_BAJO_GASTO,
  PARALISIS_DE_TODD,
  CRISIS_HIPERTENSIVA,
  ICTUS_ISQUEMICO,
  ACCIDENTE_CEREBROVASCULAR,
};

export const CONDICIONES_CLINICAS_VALUES = [
  HIPOGLUCEMIA,
  HIPOXEMIA,
  ARRITMIA_BAJO_GASTO,
  PARALISIS_DE_TODD,
  CRISIS_HIPERTENSIVA,
  ICTUS_ISQUEMICO,
  ACCIDENTE_CEREBROVASCULAR,
];

export const CONDICIONES_CLINICAS_CODES = [
  HIPOGLUCEMIA.getCode(),
  HIPOXEMIA.getCode(),
  ARRITMIA_BAJO_GASTO.getCode(),
  PARALISIS_DE_TODD.getCode(),
  CRISIS_HIPERTENSIVA.getCode(),
  ICTUS_ISQUEMICO.getCode(),
  ACCIDENTE_CEREBROVASCULAR.getCode(),
];
