export type GrupoSanguineoTypeCode =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export class GrupoSanguineoType {
  constructor(
    private code: GrupoSanguineoTypeCode,
    private forHumans: string
  ) { }

  public getCode(): GrupoSanguineoTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

// Instancias
export const O_POSITIVO = new GrupoSanguineoType(1, 'O+');
export const O_NEGATIVO = new GrupoSanguineoType(2, 'O-');
export const A_POSITIVO = new GrupoSanguineoType(3, 'A+');
export const A_NEGATIVO = new GrupoSanguineoType(4, 'A-');
export const B_POSITIVO = new GrupoSanguineoType(5, 'B+');
export const B_NEGATIVO = new GrupoSanguineoType(6, 'B-');
export const AB_POSITIVO = new GrupoSanguineoType(7, 'AB+');
export const AB_NEGATIVO = new GrupoSanguineoType(8, 'AB-');

// Factory
export function grupoSanguineoFactory(code: GrupoSanguineoTypeCode): GrupoSanguineoType {
  switch (code) {
    case 1: return O_POSITIVO;
    case 2: return O_NEGATIVO;
    case 3: return A_POSITIVO;
    case 4: return A_NEGATIVO;
    case 5: return B_POSITIVO;
    case 6: return B_NEGATIVO;
    case 7: return AB_POSITIVO;
    case 8: return AB_NEGATIVO;
  }
}

// Collections
export const GRUPOS_SANGUINEOS_VALUES = [
  O_POSITIVO,
  O_NEGATIVO,
  A_POSITIVO,
  A_NEGATIVO,
  B_POSITIVO,
  B_NEGATIVO,
  AB_POSITIVO,
  AB_NEGATIVO,
];

export const GRUPOS_SANGUINEOS = {
  O_POSITIVO,
  O_NEGATIVO,
  A_POSITIVO,
  A_NEGATIVO,
  B_POSITIVO,
  B_NEGATIVO,
  AB_POSITIVO,
  AB_NEGATIVO,
};