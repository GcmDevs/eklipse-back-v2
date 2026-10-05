export type UbicacionPacienteTypeCode = 1 | 2 | 3 | 4;

export class UbicacionPacienteType {
  constructor(
    private code: UbicacionPacienteTypeCode,
    private forHumans: string
  ) {}

  public getCode(): UbicacionPacienteTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const EN_HOSPITALIZACION = new UbicacionPacienteType(1, 'HOSPITALIZACIÓN');
export const UCI = new UbicacionPacienteType(2, 'UCI');
export const URGENCIA = new UbicacionPacienteType(3, 'URGENCIAS');
export const CIRUGIA = new UbicacionPacienteType(4, 'CIRUGÍA');

export function estadoPacienteTypeFactory(code: UbicacionPacienteTypeCode): UbicacionPacienteType {
  switch (code) {
    case 1:
      return EN_HOSPITALIZACION;
    case 2:
      return UCI;
    case 3:
      return URGENCIA;
    case 4:
      return CIRUGIA;
  }
}

export const UBICACION_PACIENTE_VALUES = [EN_HOSPITALIZACION, UCI, URGENCIA, CIRUGIA];
