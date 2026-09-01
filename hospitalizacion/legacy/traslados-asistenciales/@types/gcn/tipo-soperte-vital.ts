export type TipoSoporteVitalTypeCode = 1 | 2 | 3 | 4 | 5;

export class TipoSoporteVitalType {
  constructor(
    private code: TipoSoporteVitalTypeCode,
    private forHumans: string
  ) { }

  public getCode(): TipoSoporteVitalTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const MONITOR = new TipoSoporteVitalType(1, 'MONITOR');
export const BOMBA = new TipoSoporteVitalType(2, 'BOMBA INFUCIÓN');
export const VENTILADOR_MECANICO = new TipoSoporteVitalType(3, 'VENTILADOR MECANICO');
export const OXIGENO = new TipoSoporteVitalType(4, 'OXIGENO');
export const INCUBADORA = new TipoSoporteVitalType(5, 'INCUBADORA');

export function tipoSoportesVitalesTypeFactory(
  code: TipoSoporteVitalTypeCode
): TipoSoporteVitalType {
  switch (code) {
    case 1:
      return MONITOR;
    case 2:
      return BOMBA;
    case 3:
      return VENTILADOR_MECANICO;
    case 4:
      return OXIGENO;
    case 5:
      return INCUBADORA;

  }
}

export const TIPOS_SOPORTE_VITAL_VALUES = [
  MONITOR,
  BOMBA,
  VENTILADOR_MECANICO,
  OXIGENO,
  INCUBADORA,
];
export const TIPOS_SOPORTE_VITAL_VALUES_ASISTENCIAL = [
  MONITOR,
  BOMBA,
  VENTILADOR_MECANICO,
  OXIGENO,
  INCUBADORA,
];
