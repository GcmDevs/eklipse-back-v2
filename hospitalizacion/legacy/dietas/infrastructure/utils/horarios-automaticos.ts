import { GcmContextType } from '@common/domain/types';
import { JornadaCode, jornadasDietaTypeFactoryByNameForHumans } from '../../domain/types';
import { ScheduleOrm } from '../orm/schedule.orm';

const DAY = 86400000;
const BOGOTA_OFFSET = 5 * 3600000;
const bogotaDate = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export interface CierreDietaProgramado {
  context: GcmContextType;
  centroId: number;
  horarioId: number;
  jornadaCode: JornadaCode;
  fecha: Date;
  cierre: Date;
  ejecutarEn: Date;
}

export function diaBogota(now: Date): string {
  return bogotaDate.format(now);
}

export function siguienteMedianocheBogota(now: Date): Date {
  return new Date(Date.parse(`${diaBogota(now)}T00:00:00.000Z`) + BOGOTA_OFFSET + DAY);
}

export function crearCierreDieta(
  context: GcmContextType,
  horario: ScheduleOrm,
  dia: string
): CierreDietaProgramado {
  const minutes = horario.endTimeInMinutes;
  const daysBefore = horario.endDaysBeforeNow;
  const jornada = jornadasDietaTypeFactoryByNameForHumans(horario.name?.trim().toUpperCase());
  if (
    !jornada ||
    !Number.isInteger(minutes) ||
    minutes < 0 ||
    minutes >= 1440 ||
    !Number.isInteger(daysBefore)
  ) {
    throw new Error(`Horario de dieta inválido: ${horario.id}`);
  }
  const midnight = Date.parse(`${dia}T00:00:00.000Z`);
  const cierre = new Date(midnight + BOGOTA_OFFSET + minutes * 60000);
  return {
    context,
    centroId: horario.clientId,
    horarioId: horario.id,
    jornadaCode: jornada.getCode(),
    // DIPREVFIN expresa cuántos días antes de la jornada termina su ventana.
    fecha: new Date(midnight + daysBefore * DAY),
    cierre,
    ejecutarEn: new Date(cierre.getTime() + 1000),
  };
}
