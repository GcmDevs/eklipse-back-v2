export type MotivoCancelacionTypeCode = 1 | 2 | 3 | 4 | 5;

export class MotivoCancelacionType {
  constructor(private code: MotivoCancelacionTypeCode, private forHumans: string) {}

  public getCode(): MotivoCancelacionTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const error_solicitud = new MotivoCancelacionType(1, 'ERROR DE LA SOLICITUD');
export const cambio_tratamiento = new MotivoCancelacionType(2, 'CAMBIO DE TRATAMIENTO');
export const suspencion_orden_medica = new MotivoCancelacionType(3, 'SUSPENCIÓN DE ORDEN MEDICA');
export const salida_paciente = new MotivoCancelacionType(4, 'SALIDA DEL PACIENTE');
export const fallecimiento = new MotivoCancelacionType(5, 'FALLECIMIENTO');

export function motivoCancelacionTypeFactory(
  code: MotivoCancelacionTypeCode
): MotivoCancelacionType {
  switch (code) {
    case 1:
      return error_solicitud;
    case 2:
      return cambio_tratamiento;
    case 3:
      return suspencion_orden_medica;
    case 4:
      return salida_paciente;
    case 5:
      return fallecimiento;
  }
}

export const MOTIVOS_CANCELACION = {
  error_solicitud,
  cambio_tratamiento,
  suspencion_orden_medica,
  salida_paciente,
  fallecimiento,
};

export const MOTIVOS_CANCELACION_VALUES = [
  error_solicitud,
  cambio_tratamiento,
  suspencion_orden_medica,
  salida_paciente,
  fallecimiento,
];
