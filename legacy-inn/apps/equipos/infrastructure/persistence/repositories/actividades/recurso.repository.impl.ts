import { DataScopeService } from "@auth/application/services/data-scope.service";
import { UserScopeContext } from "@auth/domain/interfaces/data-scope.interfaces";
import { TypeOrmTransactionContext } from "@common/infrastructure/persistence/transactional";
import { BaseSource } from "@common/infrastructure/services";
import { RecursosDataScopePolicy } from "@equipos/application/policies/recursos-data-scope.policy";
import { AsignacionRecursoUsuario, Recurso } from "@equipos/domain/entities";
import { RecursoAsignacionTecnicoRead, RecursoRead } from "@equipos/domain/read";
import { RecursoRepository } from "@equipos/domain/repositories";
import { RecursoMapper } from "@equipos/infrastructure/mappers";
import { Inject, Injectable } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { AsignacionRecursoUsuarioOrm } from "@orm/inn/equipos/pool-recursos/asignacion-usuario-recurso.orm";
import { RecursoOrm } from "@orm/inn/equipos/pool-recursos/recurso.orm";
import { Request } from "express";

@Injectable()
export class TypeOrmRecursoRepository extends BaseSource implements RecursoRepository {
    constructor(
        @Inject(REQUEST) request: Request,
        private readonly dataScope: DataScopeService,
        private readonly recursosPolicy: RecursosDataScopePolicy,
    ) {
        super(request);
    }
    private get repository() {
        const qr = TypeOrmTransactionContext.getQueryRunner();
        return qr
            ? qr.manager.getRepository(RecursoOrm)
            : this.conn.getRepository(RecursoOrm);
    }

    private get asignacionRepository() {
        const qr = TypeOrmTransactionContext.getQueryRunner();
        return qr
            ? qr.manager.getRepository(AsignacionRecursoUsuarioOrm)
            : this.conn.getRepository(AsignacionRecursoUsuarioOrm);
    }

    async save(recurso: Recurso): Promise<RecursoRead> {
        const orm = RecursoMapper.toOrm(recurso);
        const saved = await this.repository.save(orm);
        return RecursoMapper.toView(saved)
    }

    async update(recurso: Recurso): Promise<RecursoRead> {
        const orm = RecursoMapper.toOrm(recurso);
        const updated = await this.repository.save(orm);
        return RecursoMapper.toView(updated);
    }

    async findById(id: number): Promise<Recurso | null> {
        const orm = await this.repository.findOne({
            where: { id },
            relations: ['asignaciones'],
            order: { asignaciones: { fechaInicio: 'DESC' } },
        });
        return orm ? RecursoMapper.toDomain(orm) : null;
    }

    async findViewById(id: number): Promise<RecursoRead | null> {
        const orm = await this.repository.findOne({
            where: { id },
            relations: ['asignaciones'],
            order: { asignaciones: { fechaInicio: 'DESC' } },
        });
        return orm ? RecursoMapper.toView(orm) : null;
    }

    async findAllView(usuarioCtx: UserScopeContext): Promise<RecursoRead[]> {
        let qb = this.repository.createQueryBuilder('recurso')
            .leftJoinAndSelect('recurso.asignaciones', 'asignaciones');

        qb = await this.dataScope.apply(
            usuarioCtx,
            qb,
            'recurso',
            this.recursosPolicy,
        );

        const founds = await qb
            .orderBy('recurso.nombre', 'ASC')
            .getMany();

        return RecursoMapper.toViewList(founds);
    }


    async findAsignacionActivaByUsuarioId(
        usuarioId: number,
    ): Promise<AsignacionRecursoUsuario | null> {
        const found = await this.asignacionRepository.findOne({
            where: {
                usuarioId,
                activa: true,
            },
        });

        if (!found) return null;
        return RecursoMapper.asignacionTecnicoToDomain(found);
    }

    async findHistorialAsignaciones(
        recursoId: number,
    ): Promise<RecursoAsignacionTecnicoRead[]> {
        const historial =
            await this.asignacionRepository.find({
                where: { recursoId },
                relations: { usuario: true },
                order: { fechaInicio: 'DESC' },
            });

        return RecursoMapper.asignacionTecnicoToViewList(historial);
    }
}
