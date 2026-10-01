import { ScheduleOrm } from '../models/diets';
import { removeTimeZone } from '@common/application/services';

export const validRangeForJornada = (rango: ScheduleOrm, canIgnoreHorario: boolean): boolean => {
  if (canIgnoreHorario) return true;
  const time = removeTimeZone(new Date(new Date().getTime()));
  const endTime = rango.endTime;
  return time >= rango.startTime && time <= endTime;
};
