export type TipoTrasladoItemTypeCode = 1 | 2 | 3;

export class TipoTrasladoItemType {
  constructor(private code: TipoTrasladoItemTypeCode, private forHumans: string) {}

  public getCode(): TipoTrasladoItemTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const BASICO = new TipoTrasladoItemType(1, 'BASICO');
export const MEDICALIZADO = new TipoTrasladoItemType(2, 'MEDICALIZADO');
export const MEDICALIZADO_NEONATAL = new TipoTrasladoItemType(3, 'MEDICALIZADO NEONATAL');

export function tipoTrasladoItemTypeFactory(code: TipoTrasladoItemTypeCode): TipoTrasladoItemType {
  switch (code) {
    case 1:
      return BASICO;
    case 2:
      return MEDICALIZADO;
    case 3:
      return MEDICALIZADO_NEONATAL;
  }
}

export const TIPOS_TRASLADO_ITEM_VALUES = [BASICO, MEDICALIZADO, MEDICALIZADO_NEONATAL];
export const TIPOS_TRASLADO_ITEM = { BASICO, MEDICALIZADO, MEDICALIZADO_NEONATAL };
