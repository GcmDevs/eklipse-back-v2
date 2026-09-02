export type AsistenciaTipoCode = 1 | 2;

export class AsistenciaTipoType {
  constructor(
    private _code: AsistenciaTipoCode,
    private _forHumans: string
  ) {}

  public getCode(): AsistenciaTipoCode {
    return this._code;
  }

  public getForHumans(): string {
    return this._forHumans;
  }
}

export const PRIMARIO = new AsistenciaTipoType(1, 'PRIMARIO');
export const SECUNDARIO = new AsistenciaTipoType(2, 'SECUNDARIO');

export function asistenciaTipoFactory(code: AsistenciaTipoCode): AsistenciaTipoType {
  switch (code) {
    case 1:
      return PRIMARIO;
    case 2:
      return SECUNDARIO;
    default:
      return PRIMARIO;
  }
}

export const ASISTENCIA_TIPOS = { PRIMARIO, SECUNDARIO };
export const ASISTENCIA_TIPOS_VALUES = [PRIMARIO, SECUNDARIO];
