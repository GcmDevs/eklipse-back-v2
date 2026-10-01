import { EnumOptions } from "@common/domain/types";

export enum TipoMedidaCodigo {
  VOLTAJE = 'VOL',
  CORRIENTE = 'COR',
  FRECUENCIA = 'FRE',
  POTENCIA = 'POT',
  TEMPMIN = 'TMI',
  TEMPMAX = 'TMA',
  REVOLUCIONES = 'REV',
  OTROS = 'OTR',
}

export const TipoMedidaCodigoForHumans: Record<TipoMedidaCodigo, string> = {
  [TipoMedidaCodigo.VOLTAJE]: 'VOLTAJE',
  [TipoMedidaCodigo.CORRIENTE]: 'CORRIENTE',
  [TipoMedidaCodigo.FRECUENCIA]: 'FRECUENCIA',
  [TipoMedidaCodigo.POTENCIA]: 'POTENCIA',
  [TipoMedidaCodigo.TEMPMIN]: 'TEMPERATURA MINIMA',
  [TipoMedidaCodigo.TEMPMAX]: 'TEMPERATURA MAXIMA',
  [TipoMedidaCodigo.REVOLUCIONES]: 'REVOLUCIONES',
  [TipoMedidaCodigo.OTROS]: 'OTROS',
};

export const TIPO_MEDIDA_OPTIONS: EnumOptions<TipoMedidaCodigo>[] =
  Object.values(TipoMedidaCodigo).map((value) => ({
    value,
    option: TipoMedidaCodigoForHumans[value],
  }));
