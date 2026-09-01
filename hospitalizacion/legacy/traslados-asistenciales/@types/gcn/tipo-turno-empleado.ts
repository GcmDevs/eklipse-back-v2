export type TipoTurnoEmpleadoCode = 1 | 2 | 3;

export class TipoTurnoEmpleadoType {
  constructor(private code: TipoTurnoEmpleadoCode, private forHumans: string) {}

  public getCode(): TipoTurnoEmpleadoCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const turno_uno = new TipoTurnoEmpleadoType(1, 'TURNO 1');
export const turno_dos = new TipoTurnoEmpleadoType(2, 'TURNO 2');
export const turno_tres = new TipoTurnoEmpleadoType(3, 'TURNO 3');

export function tipoTurnoEmpleadoTypeFactory(code: TipoTurnoEmpleadoCode): TipoTurnoEmpleadoType {
  switch (code) {
    case 1:
      return turno_uno;
    case 2:
      return turno_dos;
    case 3:
      return turno_tres;
  }
}

export const TIPO_TURNO_EMPLEADO = { turno_uno, turno_dos, turno_tres };
export const TIPOS_TURNO_EMPLEADO_VALUES = [turno_uno, turno_dos, turno_tres];
