export enum Importancia {
  BAJA = 1,
  MEDIA = 2,
  ALTA = 3,
  CRITICA = 4,
}

export enum ImportanciaForHumans {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA',
}

export const IMPORTANCIA_SUGGESTIONS = [
  { value: Importancia.BAJA, option: ImportanciaForHumans.BAJA },
  { value: Importancia.MEDIA, option: ImportanciaForHumans.MEDIA },
  { value: Importancia.ALTA, option: ImportanciaForHumans.ALTA },
  { value: Importancia.CRITICA, option: ImportanciaForHumans.CRITICA },
];
