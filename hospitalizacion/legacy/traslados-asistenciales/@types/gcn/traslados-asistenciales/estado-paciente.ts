export type EstadoPacienteCode = 1 | 2;

export class EstadoPacienteType {
  constructor(
    private _code: EstadoPacienteCode,
    private _forHumans: string
  ) {}

  public getCode(): EstadoPacienteCode {
    return this._code;
  }

  public getForHumans(): string {
    return this._forHumans;
  }
}

export const VIVO = new EstadoPacienteType(1, 'VIVO');
export const MUERTO = new EstadoPacienteType(2, 'MUERTO');

export function estadoPacienteTypeFactory(code: EstadoPacienteCode): EstadoPacienteType {
  switch (code) {
    case 1:
      return VIVO;
    case 2:
      return MUERTO;
    default:
      return VIVO;
  }
}

export const ESTADOS_PACIENTE = { VIVO, MUERTO };
export const ESTADOS_PACIENTE_VALUES = [VIVO, MUERTO];
