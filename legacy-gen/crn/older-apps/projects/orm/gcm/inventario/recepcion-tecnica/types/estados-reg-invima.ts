export type EstadoRegInvimaTypeCode = 1 | 2 | 3 | 4 | 5;

export class EstadoRegInvimaType {
  constructor(private code: EstadoRegInvimaTypeCode, private forHumans: string) {}

  public getCode(): EstadoRegInvimaTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const VIGENTE = new EstadoRegInvimaType(1, 'VIGENTE');
export const EN_TRAMITE = new EstadoRegInvimaType(2, 'EN TRAMITE');
export const INACTIVO = new EstadoRegInvimaType(3, 'INACTIVO');
export const PERDIDA_FUERZA_EJECUTORIA = new EstadoRegInvimaType(4, 'PERDIDA DE FUERZA EJECUTORIA');
export const VENCIDO = new EstadoRegInvimaType(5, 'VENCIDO');

export function estadoTypeFactory(code: EstadoRegInvimaTypeCode): EstadoRegInvimaType {
  switch (code) {
    case 1:
      return VIGENTE;
    case 2:
      return EN_TRAMITE;
    case 3:
      return INACTIVO;
    case 4:
      return PERDIDA_FUERZA_EJECUTORIA;
    case 5:
      return VENCIDO;
  }
}

export const ESTADOS_REG_INVIMA_VALUES = [
  VIGENTE,
  EN_TRAMITE,
  INACTIVO,
  PERDIDA_FUERZA_EJECUTORIA,
  VENCIDO,
];
