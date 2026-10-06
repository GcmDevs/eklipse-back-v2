import { ScheduleOrm } from '../orm';
import { removeTimeZone } from '@lgc/die/application/services';

export const validRangeForJornada = (rango: ScheduleOrm, canIgnoreHorario: boolean): boolean => {
  if (canIgnoreHorario) return true;
  const time = removeTimeZone(new Date(new Date().getTime()));
  const endTime = rango.endTime;
  return time >= rango.startTime && time <= endTime;
};
