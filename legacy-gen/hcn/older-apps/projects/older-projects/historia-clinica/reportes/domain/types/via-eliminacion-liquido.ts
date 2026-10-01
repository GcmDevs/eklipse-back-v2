export type ViaEliminacionLiquidosTypeCode =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 98
  | 99;

export class ViaEliminacionLiquidosType {
  constructor(private code: ViaEliminacionLiquidosTypeCode, private forHumans: string) {}

  public getCode(): ViaEliminacionLiquidosTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const SONDA_VESICAL = new ViaEliminacionLiquidosType(0, 'SONDA VESICAL');
export const DIARREA = new ViaEliminacionLiquidosType(1, 'DIARREA');
export const EMESIS = new ViaEliminacionLiquidosType(2, 'EMESIS');
export const SONDA_GASTRICA = new ViaEliminacionLiquidosType(3, 'SONDA GASTRICA');
export const DREN_PENROSE = new ViaEliminacionLiquidosType(4, 'DREN PENROSE');
export const HEMOVAC = new ViaEliminacionLiquidosType(5, 'HEMOVAC');
export const OTROS_DRENES = new ViaEliminacionLiquidosType(6, 'OTROS DRENES');
export const TUBO_EN_T = new ViaEliminacionLiquidosType(7, 'TUBO EN T');
export const TUBO_A_TORAX = new ViaEliminacionLiquidosType(8, 'TUBO A TORAX');
export const VENTRICULOSTOMIA = new ViaEliminacionLiquidosType(9, 'VENTRICULOSTOMIA');
export const BOLSA_RECOLECTORA = new ViaEliminacionLiquidosType(10, 'BOLSA RECOLECTORA');
export const IRRIGACION_VESICAL = new ViaEliminacionLiquidosType(11, 'IRRIGACION VESICAL');
export const ESPONTANEO = new ViaEliminacionLiquidosType(12, 'ESPONTANEO');
export const CATETER_PERCUTANEO = new ViaEliminacionLiquidosType(13, 'CATETER PERCUTANEO');
export const ULTRAFILTRADO = new ViaEliminacionLiquidosType(14, 'ULTRAFILTRADO');
export const ORAL = new ViaEliminacionLiquidosType(15, 'ORAL');
export const OTRAS = new ViaEliminacionLiquidosType(98, 'OTRAS');
export const TODAS_LAS_VIAS = new ViaEliminacionLiquidosType(99, 'TODAS LAS VIAS');

export function viaEliminacionLiquidosTypeFactory(
  code: ViaEliminacionLiquidosTypeCode
): ViaEliminacionLiquidosType {
  switch (code) {
    case 0:
      return SONDA_VESICAL;
    case 1:
      return DIARREA;
    case 2:
      return EMESIS;
    case 3:
      return SONDA_GASTRICA;
    case 4:
      return DREN_PENROSE;
    case 5:
      return HEMOVAC;
    case 6:
      return OTROS_DRENES;
    case 7:
      return TUBO_EN_T;
    case 8:
      return TUBO_A_TORAX;
    case 9:
      return VENTRICULOSTOMIA;
    case 10:
      return BOLSA_RECOLECTORA;
    case 11:
      return IRRIGACION_VESICAL;
    case 12:
      return ESPONTANEO;
    case 13:
      return CATETER_PERCUTANEO;
    case 14:
      return ULTRAFILTRADO;
    case 15:
      return ORAL;
    case 98:
      return OTRAS;
    case 99:
      return TODAS_LAS_VIAS;
  }
}

export const ESTADOS_DIETA_VALUES = [
  SONDA_VESICAL,
  DIARREA,
  EMESIS,
  SONDA_GASTRICA,
  DREN_PENROSE,
  HEMOVAC,
  OTROS_DRENES,
  TUBO_EN_T,
  TUBO_A_TORAX,
  VENTRICULOSTOMIA,
  BOLSA_RECOLECTORA,
  IRRIGACION_VESICAL,
  ESPONTANEO,
  CATETER_PERCUTANEO,
  ULTRAFILTRADO,
  ORAL,
  OTRAS,
  TODAS_LAS_VIAS,
];
