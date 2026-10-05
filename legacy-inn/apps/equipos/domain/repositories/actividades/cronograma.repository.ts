import { Cronograma } from '@equipos/domain/entities';
import { EstadoCronograma, TipoActividad } from '@equipos/domain/enums';
import { CronogramaRead } from '@equipos/domain/read';

export interface CronogramaFilters {
  anio?: number;
  mes?: number;
  tipo?: TipoActividad;
  estado?: EstadoCronograma;
}

export interface CronogramaRepository {
  save(cronograma: Cronograma): Promise<CronogramaRead>;
  update(cronograma: Cronograma): Promise<CronogramaRead>;
  findById(id: number): Promise<Cronograma | null>;
  findViewById(id: number): Promise<CronogramaRead | null>;
  findByPeriodo(anio: number, mes: number, tipo: TipoActividad): Promise<Cronograma | null>;
  findAllView(filters: CronogramaFilters): Promise<CronogramaRead[]>;
}
