export type MotivoFallidoTypeCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export class MotivoFallidoType {
  constructor(private code: MotivoFallidoTypeCode, private forHumans: string) {}

  public getCode(): MotivoFallidoTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}
export const FALLIDO_PREPARACION = new MotivoFallidoType(1, 'Fallido por mala preparación');
export const FALLIDO_COMIO = new MotivoFallidoType(2, 'Fallido porque el paciente comió');
export const FALLIDO_PERDIO_CITA = new MotivoFallidoType(3, 'Fallido porque perdió la cita');
export const FALLIDO_NO_PERMITIO = new MotivoFallidoType(
  4,
  'Fallido porque el paciente no dejó realizar el estudio'
);
export const FALLIDO_EQUIPO_DANADO = new MotivoFallidoType(5, 'Fallido porque el equipo se dañó');
export const FALLIDO_INESTABLE = new MotivoFallidoType(
  6,
  'Fallido porque el paciente estaba inestable'
);
export const FALLIDO_SALIDA = new MotivoFallidoType(
  7,
  'Fallido porque al paciente le dieron salida'
);
export const FALLIDO_SIN_CAMA = new MotivoFallidoType(8, 'Fallido por no disponibilidad de cama');
export const FALLIDO_SIN_ESPECIALISTA = new MotivoFallidoType(
  9,
  'Fallido porque el especialista no está o se incapacitó'
);
export const FALLIDO_DOC_INCOMPLETA = new MotivoFallidoType(
  10,
  'Fallido por documentación incompleta'
);
export const FALLIDO_SIN_MEDICO = new MotivoFallidoType(
  11,
  'Fallido porque no se encuentra médico'
);
export const FALLIDO_EQUIPOS_DANADOS = new MotivoFallidoType(
  12,
  'Fallido por equipos médicos dañados'
);

export function motivoFallidoTypeFactory(code: MotivoFallidoTypeCode): MotivoFallidoType {
  switch (code) {
    case 1:
      return FALLIDO_PREPARACION;
    case 2:
      return FALLIDO_COMIO;
    case 3:
      return FALLIDO_PERDIO_CITA;
    case 4:
      return FALLIDO_NO_PERMITIO;
    case 5:
      return FALLIDO_EQUIPO_DANADO;
    case 6:
      return FALLIDO_INESTABLE;
    case 7:
      return FALLIDO_SALIDA;
    case 8:
      return FALLIDO_SIN_CAMA;
    case 9:
      return FALLIDO_SIN_ESPECIALISTA;
    case 10:
      return FALLIDO_DOC_INCOMPLETA;
    case 11:
      return FALLIDO_SIN_MEDICO;
    case 12:
      return FALLIDO_EQUIPOS_DANADOS;
    default:
      throw new Error(`MotivoFallidoType no soportado: ${code}`);
  }
}

export const MOTIVOS_FALLIDO_VALUES: MotivoFallidoType[] = [
  FALLIDO_PREPARACION,
  FALLIDO_COMIO,
  FALLIDO_PERDIO_CITA,
  FALLIDO_NO_PERMITIO,
  FALLIDO_EQUIPO_DANADO,
  FALLIDO_INESTABLE,
  FALLIDO_SALIDA,
  FALLIDO_SIN_CAMA,
  FALLIDO_SIN_ESPECIALISTA,
  FALLIDO_DOC_INCOMPLETA,
  FALLIDO_SIN_MEDICO,
  FALLIDO_EQUIPOS_DANADOS,
];

export const MOTIVOS_FALLIDO = {
  FALLIDO_PREPARACION,
  FALLIDO_COMIO,
  FALLIDO_PERDIO_CITA,
  FALLIDO_NO_PERMITIO,
  FALLIDO_EQUIPO_DANADO,
  FALLIDO_INESTABLE,
  FALLIDO_SALIDA,
  FALLIDO_SIN_CAMA,
  FALLIDO_SIN_ESPECIALISTA,
  FALLIDO_DOC_INCOMPLETA,
  FALLIDO_SIN_MEDICO,
  FALLIDO_EQUIPOS_DANADOS,
};
