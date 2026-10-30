import { Cronograma } from "@inn/activos/identificacion/domain/entities";
import { CronogramaRead } from "@inn/activos/identificacion/domain/read";
import { CronogramaOrm } from "@inn/orm/inn/activos/equipos";


export class CronogramaMapper {
    static toOrm(domain: Cronograma): CronogramaOrm {
        const orm = new CronogramaOrm();

        orm.id = domain.getId.getValor ?? undefined;
        orm.anio = domain.getAnio;
        orm.mes = domain.getMes;
        orm.tipo = domain.getTipo;
        orm.estado = domain.getEstado;
        orm.metaCumplimientoPct = domain.getMetaCumplimientoPct;
        orm.creadoPorId = domain.getCreadoPorId;
        orm.notas = domain.getNotas;
        orm.createdAt = domain.getCreatedAt;
        orm.updatedAt = domain.getUpdatedAt;

        return orm;
    }

    static toDomain(orm: CronogramaOrm): Cronograma {
        return Cronograma.rebuild(
            orm.id,
            orm.anio,
            orm.mes,
            orm.tipo,
            orm.estado,
            orm.metaCumplimientoPct,
            orm.creadoPorId,
            orm.notas,
            orm.createdAt,
            orm.updatedAt,
        );
    }

    static toView(
        orm: CronogramaOrm,
    ): CronogramaRead {
        return {
            id: orm.id,
            anio: orm.anio,
            mes: orm.mes,
            tipo: orm.tipo,
            estado: orm.estado,
            metaCumplimientoPct: orm.metaCumplimientoPct,
            creadoPorId: orm.creadoPorId,
            notas: orm.notas,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        };
    }

    static toDomainList(
        ormList: CronogramaOrm[],
    ): Cronograma[] {
        return ormList.map(this.toDomain);
    }

    static toViewList(
        ormList: CronogramaOrm[],
    ): CronogramaRead[] {
        return ormList.map(this.toView);
    }
}