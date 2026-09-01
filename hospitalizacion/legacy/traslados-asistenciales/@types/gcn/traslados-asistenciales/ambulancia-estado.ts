export type AmbulanciaEstadoCode = 1 | 2;

export class AmbulanciaEstadoType {
  constructor(
    private _code: AmbulanciaEstadoCode,
    private _forHumans: string
  ) { }

  public getCode(): AmbulanciaEstadoCode {
    return this._code;
  }

  public getForHumans(): string {
    return this._forHumans;
  }
}

export const ACTIVA = new AmbulanciaEstadoType(1, 'ACTIVA');
export const INACTIVA = new AmbulanciaEstadoType(2, 'INACTIVA');

export function ambulanciaEstadoTypeFactory(code: AmbulanciaEstadoCode): AmbulanciaEstadoType {
  switch (code) {
    case 1: return ACTIVA;
    case 2: return INACTIVA;
    default: return ACTIVA;
  }
}

export const AMBULANCIA_ESTADOS = { ACTIVA, INACTIVA };
export const AMBULANCIA_ESTADOS_VALUES = [ACTIVA, INACTIVA];
