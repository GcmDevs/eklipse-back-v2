export type DieJorEstadoCode = 1 | 2 | 3;

export class DieJorEstadoType {
  constructor(
    private code: DieJorEstadoCode,
    private forHumans: string
  ) {}

  public getCode(): DieJorEstadoCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const SOLICITADA = new DieJorEstadoType(1, 'SOLICITADA');
export const ENVIADA = new DieJorEstadoType(2, 'ENVIADA');
export const RECIBIDA = new DieJorEstadoType(3, 'RECIBIDA');

export function dieJorEstadoTypeFactory(code: DieJorEstadoCode): DieJorEstadoType {
  switch (code) {
    case 1:
      return SOLICITADA;
    case 2:
      return ENVIADA;
    case 3:
      return RECIBIDA;
  }
}

export const ESTADOS_JORNADA = { SOLICITADA, ENVIADA, RECIBIDA };

export const ESTADOS_JORNADA_VALUES = [SOLICITADA, ENVIADA, RECIBIDA];
