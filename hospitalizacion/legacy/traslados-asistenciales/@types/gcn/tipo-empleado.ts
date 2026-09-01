export type TipoEmpleadoCode = 1 | 2 | 3;

export class TipoEmpleadoType {
  constructor(private code: TipoEmpleadoCode, private forHumans: string) {}

  public getCode(): TipoEmpleadoCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const MEDICO = new TipoEmpleadoType(1, 'MEDICO');
export const AUXILIAR = new TipoEmpleadoType(2, 'AUXILIAR');
export const CONDUCTOR = new TipoEmpleadoType(3, 'CONDUCTOR');

export function tipoEmpleadoTypeFactory(code: TipoEmpleadoCode): TipoEmpleadoType {
  switch (code) {
    case 1:
      return MEDICO;
    case 2:
      return AUXILIAR;
    case 3:
      return CONDUCTOR;
  }
}

export const TIPOS_EMPLEADO = { MEDICO, AUXILIAR, CONDUCTOR };
export const TIPOS_EMPLEADO_VALUES = [MEDICO, AUXILIAR, CONDUCTOR];
