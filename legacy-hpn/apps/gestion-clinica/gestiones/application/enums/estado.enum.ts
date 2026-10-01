export enum Estado {
  ASIGNADA = 1,
  EN_PROCESO = 2,
  CERRADA = 3,
}

export enum EstadoForHumans {
  ASIGNADA = 'ASIGNADA',
  EN_PROCESO = 'EN PROCESO',
  CERRADA = 'CERRADA',
}

export const ESTADO_SUGGESTIONS = [
  { value: Estado.ASIGNADA, option: EstadoForHumans.ASIGNADA },
  { value: Estado.EN_PROCESO, option: EstadoForHumans.EN_PROCESO },
  { value: Estado.CERRADA, option: EstadoForHumans.CERRADA },
];
