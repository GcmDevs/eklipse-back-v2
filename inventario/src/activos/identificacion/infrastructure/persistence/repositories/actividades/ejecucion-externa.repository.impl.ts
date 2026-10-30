import { TypeOrmTransactionContext } from "@common/infrastructure/persistence/transactional";
import { BaseSource } from "@common/infrastructure/services";
import { AnexoReader } from "@inn/core/media/application/services/anexo-reader.service";
import { EjecucionExterna } from "@inn/activos/identificacion/domain/entities";
import { EjecucionExternaRepository } from "@inn/activos/identificacion/domain/repositories";
import { EjecucionExternaMapper } from "@inn/activos/identificacion/infrastructure/mappers";
import { Inject, Injectable } from "@nestjs/common";
import { EjecucionExternaOrm } from "@inn/orm/inn/activos/equipos";

@Injectable()
export class TypeOrmEjecucionExternaRepository
    extends BaseSource
    implements EjecucionExternaRepository {

    private get repository() {
        const qr = TypeOrmTransactionContext.getQueryRunner();
        return qr
            ? qr.manager.getRepository(EjecucionExternaOrm)
            : this.conn.getRepository(EjecucionExternaOrm);
    }

    async save(domain: EjecucionExterna): Promise<EjecucionExterna> {
        const orm = EjecucionExternaMapper.toOrm(domain);
        const saved = await this.repository.save(orm);
        return EjecucionExternaMapper.toDomain(saved);
    }

    async findByRegActividadId(registroActividadId: number): Promise<EjecucionExterna | null> {
        const orm = await this.repository.findOne({
            where: { registroActividadId },
        });
        return orm ? EjecucionExternaMapper.toDomain(orm) : null;
    }

    async existsByRegActividadId(registroActividadId: number): Promise<boolean> {
        return this.repository.exists({ where: { registroActividadId } });
    }
}