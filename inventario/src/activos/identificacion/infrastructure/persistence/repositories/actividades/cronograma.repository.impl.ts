import { TypeOrmTransactionContext } from "@common/infrastructure/persistence/transactional";
import { BaseSource } from "@common/infrastructure/services";
import { Cronograma } from "@inn/activos/identificacion/domain/entities";
import { TipoActividad } from "@inn/activos/identificacion/domain/enums";
import { CronogramaRead } from "@inn/activos/identificacion/domain/read";
import { CronogramaRepository, CronogramaFilters } from "@inn/activos/identificacion/domain/repositories";
import { CronogramaMapper } from "@inn/activos/identificacion/infrastructure/mappers";
import { Injectable } from "@nestjs/common";
import { CronogramaOrm } from "@inn/orm/inn/activos/equipos";

@Injectable()
export class TypeOrmCronogramaRepository
    extends BaseSource
    implements CronogramaRepository {
 
    private get repository() {
        const qr = TypeOrmTransactionContext.getQueryRunner();
        return qr
            ? qr.manager.getRepository(CronogramaOrm)
            : this.conn.getRepository(CronogramaOrm);
    }
 
    async save(cronograma: Cronograma): Promise<CronogramaRead> {
        const orm = CronogramaMapper.toOrm(cronograma);
        const saved = await this.repository.save(orm);
        return CronogramaMapper.toView(saved);
    }
 
    async update(cronograma: Cronograma): Promise<CronogramaRead> {
        const orm = CronogramaMapper.toOrm(cronograma);
        await this.repository.save(orm);
        return this.findViewById(cronograma.getId.getValor);
    }
 
    async findById(id: number): Promise<Cronograma | null> {
        const orm = await this.repository.findOne({
            where: { id }
        });
        return orm ? CronogramaMapper.toDomain(orm) : null;
    }

    async findViewById(id: number): Promise<CronogramaRead | null> {
        const orm = await this.repository.findOne({
            where: { id }
        });
        return orm ? CronogramaMapper.toView(orm) : null;
    }
 
    async findByPeriodo(
        anio: number,
        mes: number,
        tipo: TipoActividad,
    ): Promise<Cronograma | null> {
        const orm = await this.repository.findOne({
            where: { anio, mes, tipo },
        });
        return orm ? CronogramaMapper.toDomain(orm) : null;
    }
 
    async findAllView(filters: CronogramaFilters): Promise<CronogramaRead[]> {
        const qb = this.repository.createQueryBuilder('c')
 
        if (filters.anio)   qb.andWhere('c.anio = :anio',     { anio: filters.anio });
        if (filters.mes)    qb.andWhere('c.mes = :mes',        { mes: filters.mes });
        if (filters.tipo)   qb.andWhere('c.tipo = :tipo',      { tipo: filters.tipo });
        if (filters.estado) qb.andWhere('c.estado = :estado',  { estado: filters.estado });
 
        qb.orderBy('c.anio', 'DESC').addOrderBy('c.mes', 'DESC');
 
        const orms = await qb.getMany();
        return CronogramaMapper.toViewList(orms)
    }
 
 
}
 