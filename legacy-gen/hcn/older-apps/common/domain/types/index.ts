export class GcmType<T> {
  constructor(
    private code: T,
    private forHumans: string
  ) {}

  public getCode(): T {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export type PrioridadCode = 1 | 2 | 3 | 4;

const BAJA = new GcmType<PrioridadCode>(1, 'BAJA');
const MEDIA = new GcmType<PrioridadCode>(2, 'MEDIA');
const ALTA = new GcmType<PrioridadCode>(3, 'ALTA');
const CRITICA = new GcmType<PrioridadCode>(4, 'CRITICA');

export function prioridadFactory(code: PrioridadCode): GcmType<PrioridadCode> {
  switch (code) {
    case 1:
      return BAJA;
    case 2:
      return MEDIA;
    case 3:
      return ALTA;
    case 4:
      return CRITICA;
  }
}

export const PRIORIDAD_VALUES = [BAJA, MEDIA, ALTA, CRITICA];

export const PRIORIDADES = { BAJA, MEDIA, ALTA, CRITICA };
