export type DietaExtraCode = '27' | '28' | '29';

export class DietaExtraType {
  constructor(private code: DietaExtraCode, private forHumans: string) {}

  public getCode(): DietaExtraCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const MERI_NORMAL = new DietaExtraType('27', 'MERIENDA NORMAL');
export const MERI_HIPOGLUCIDA = new DietaExtraType('28', 'MERIENDA HIPOGLUCIDA');
export const DIET_FAMILIAR = new DietaExtraType('29', 'DIETA PARA FAMILIAR');

export function dietasExtraTypeFactory(code: DietaExtraCode): DietaExtraType {
  switch (code) {
    case '27':
      return MERI_NORMAL;
    case '28':
      return MERI_HIPOGLUCIDA;
    case '29':
      return DIET_FAMILIAR;
  }
}

export const DIETAS_EXTRA = { MERI_HIPOGLUCIDA, MERI_NORMAL, DIET_FAMILIAR };

export const DIETAS_EXTRA_VALUES = [MERI_HIPOGLUCIDA, MERI_NORMAL, DIET_FAMILIAR];
