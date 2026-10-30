import { Cronograma } from "@inn/activos/identificacion/domain/entities";
import { EstadoCronograma, TipoActividad } from "@inn/activos/identificacion/domain/enums";
import { CronogramaRead } from "@inn/activos/identificacion/domain/read";

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
    findByPeriodo(
        anio: number,
        mes: number,
        tipo: TipoActividad,
    ): Promise<Cronograma | null>;
    findAllView(filters: CronogramaFilters): Promise<CronogramaRead[]>;
}