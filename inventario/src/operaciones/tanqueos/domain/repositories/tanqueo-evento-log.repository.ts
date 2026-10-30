import { TanqueoEventoLog } from '../entities/tanqueo-evento-log.entity';
import { TipoEventoTanqueoLog } from '../enums';

export interface TanqueoEventoLogRepository {
  save(evento: TanqueoEventoLog): Promise<TanqueoEventoLog>;
  existsLimpiezaIntentosInMonth(year: number, month: number): Promise<boolean>;
}
