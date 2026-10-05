export type MotivoCancelacionTrasladoTypeCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export class MotivoCancelacionTrasladoType {
  constructor(
    private code: MotivoCancelacionTrasladoTypeCode,
    private forHumans: string
  ) {}

  public getCode(): MotivoCancelacionTrasladoTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const cambio_condicion = new MotivoCancelacionTrasladoType(
  1,
  'CAMBIO EN LA CONDICIÓN DEL PACIENTE'
);
export const codicion_climatica = new MotivoCancelacionTrasladoType(
  2,
  'CONDICIONES CLIMÁTICAS ADVERSAS'
);
export const disponibilidad = new MotivoCancelacionTrasladoType(3, 'DISPONIBILIDAD DE RECURSOS');
export const cambio_planeacion_medica = new MotivoCancelacionTrasladoType(
  4,
  'CAMBIOS EN LA PLANIFICACIÓN MÉDICA'
);
export const problema_logistico = new MotivoCancelacionTrasladoType(5, 'PROBLEMAS LOGÍSTICOS');
export const solicitud_paciente_familiar = new MotivoCancelacionTrasladoType(
  6,
  'SOLICITUD DEL PACIENTE O FAMILIARES'
);
export const conflicto_admi_financiero = new MotivoCancelacionTrasladoType(
  7,
  'CONFLICTOS ADMINISTRATIVOS O FINANCIEROS'
);
export const seguridad = new MotivoCancelacionTrasladoType(
  8,
  'SEGURIDAD DEL PACIENTE O DEL PERSONAL'
);
export const emergencia_inesperada = new MotivoCancelacionTrasladoType(
  9,
  'EMERGENCIAS INESPERADAS'
);
export const error = new MotivoCancelacionTrasladoType(
  10,
  'ERRORES EN LA SOLICITUD O COORDINACIÓN'
);

export function motivoCancelacionTrasladoTypeFactory(
  code: MotivoCancelacionTrasladoTypeCode
): MotivoCancelacionTrasladoType {
  switch (code) {
    case 1:
      return cambio_condicion;
    case 2:
      return codicion_climatica;
    case 3:
      return disponibilidad;
    case 4:
      return cambio_planeacion_medica;
    case 5:
      return problema_logistico;
    case 6:
      return solicitud_paciente_familiar;
    case 7:
      return conflicto_admi_financiero;
    case 8:
      return seguridad;
    case 9:
      return emergencia_inesperada;
    case 10:
      return error;
  }
}

export const MOTIVOS_CANCELACION_TRASLADO = {
  cambio_condicion,
  codicion_climatica,
  disponibilidad,
  cambio_planeacion_medica,
  problema_logistico,
  solicitud_paciente_familiar,
  conflicto_admi_financiero,
  seguridad,
  emergencia_inesperada,
  error,
};

export const MOTIVOS_CANCELACION_TRASLADO_VALUES = [
  cambio_condicion,
  codicion_climatica,
  disponibilidad,
  cambio_planeacion_medica,
  problema_logistico,
  solicitud_paciente_familiar,
  conflicto_admi_financiero,
  seguridad,
  emergencia_inesperada,
  error,
];
