export type AreaRecogidaTypeCode = 1 | 2;

export class AreaRecogidaType {
  constructor(
    private code: AreaRecogidaTypeCode,
    private forHumans: string,
  ) {}

  public getCode(): AreaRecogidaTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const URBANA = new AreaRecogidaType(1, 'Urbana');
export const RURAL = new AreaRecogidaType(2, 'Rural');

export function areaRecogidaTypeFactory(code: AreaRecogidaTypeCode): AreaRecogidaType {
  switch (code) {
    case 1:
      return URBANA;
    case 2:
      return RURAL;
    default:
      throw new Error('Código de area-recogida no válido');
  }
}

export const AREA_RECOGIDA = { URBANA, RURAL };
export const AREAS_RECOGIDA_VALUES = [URBANA, RURAL];
