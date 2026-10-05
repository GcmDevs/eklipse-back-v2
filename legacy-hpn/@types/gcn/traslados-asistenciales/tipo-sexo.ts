export type TipoSexoTypeCode = 1 | 2;

export class TipoSexoType {
  constructor(
    private code: TipoSexoTypeCode,
    private forHumans: string
  ) {}

  public getCode(): TipoSexoTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const MASCULINO = new TipoSexoType(1, 'MASCULINO');

export const FEMENINO = new TipoSexoType(2, 'FEMENINO');

export function tipoSexoTypeFactory(code: TipoSexoTypeCode): TipoSexoType {
  switch (code) {
    case 1:
      return MASCULINO;
    case 2:
      return FEMENINO;
  }
}

export const TIPO_SEXO = { MASCULINO, FEMENINO };
export const TIPOS_SEXO_VALUES = [MASCULINO, FEMENINO];
