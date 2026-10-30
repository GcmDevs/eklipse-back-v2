const MS_12H_10M = 12 * 60 * 60 * 1000 + 10 * 60 * 1000;
const MS_13H = 13 * 60 * 60 * 1000;
const MS_1H = 60 * 60 * 1000;
const MS_30M = 30 * 60 * 1000;
const MS_5H = 5 * 60 * 60 * 1000;

export function calcHabilitaExcepcionalEn(turnoInicio: Date): Date {
  return new Date(turnoInicio.getTime() + MS_12H_10M);
}

export function calcCierreAutomaticoEn(turnoInicio: Date): Date {
  return new Date(turnoInicio.getTime() + MS_13H);
}

export function calcLimiteInicioRecepcion(fechaEntrega: Date): Date {
  return new Date(fechaEntrega.getTime() + MS_1H);
}

export function calcLimiteEdicionRecepcion(recepcionInicio: Date): Date {
  return new Date(recepcionInicio.getTime() + MS_30M);
}

export function calcFechaLimiteDotacion(fechaInicio: Date): Date {
  return new Date(fechaInicio.getTime() + MS_5H);
}

export function isBeforeDeadline(now: Date, deadline: Date): boolean {
  return now.getTime() < deadline.getTime();
}

export function isPastDeadline(now: Date, deadline: Date): boolean {
  return now.getTime() >= deadline.getTime();
}
