export type TipoProfesionalCode = 1 | 4 | 5;

export class TipoProfesionalType {
  constructor(
    private code: TipoProfesionalCode,
    private forHumans: string
  ) {}

  public getCode(): TipoProfesionalCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const MEDICOF = new TipoProfesionalType(1, 'MEDICO');
export const ENFERMERO = new TipoProfesionalType(4, 'ENFERMERO');
export const TERAPEUTA = new TipoProfesionalType(5, 'TERAPEUTA');

export function tipoProfesionalTypeFactory(code: TipoProfesionalCode): TipoProfesionalType {
  switch (code) {
    case 1:
      return MEDICOF;
    case 4:
      return ENFERMERO;
    case 5:
      return TERAPEUTA;
  }
}

export const TIPO_PROFESIONAL = { MEDICOF, ENFERMERA: ENFERMERO, TERAPEUTA: TERAPEUTA };
export const TIPOS_PROFESIONAL_VALUES = [MEDICOF, ENFERMERO, TERAPEUTA];
