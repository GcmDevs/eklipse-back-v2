import { DataScopeService } from "@auth/application/services/data-scope.service";
import { UserScopeContext } from "@auth/domain/interfaces/data-scope.interfaces";
import { TABLE_NAMES } from "@common/application/constants";
import { EntidadTipoAnexo } from "@common/domain/enums";
import { TypeOrmTransactionContext } from "@common/infrastructure/persistence/transactional";
import { BaseSource } from "@common/infrastructure/services";
import { AnexoReader } from "@core/media/application/services/anexo-reader.service";
import { ActividadesDataScopePolicy } from "@equipos/application/policies/actividades-data-scope.policy";
import { PlanActividad, RegistroActividad } from "@equipos/domain/entities";
import { EstadoActividad, NaturalezaIntervencionActividad, OrigenActividad, TipoActividad } from "@equipos/domain/enums";
import { RegistroActividadRead } from "@equipos/domain/read";
import { RegistroActividadRepository, ResumenEstadoRaw } from "@equipos/domain/repositories";
import { PlanActividadMapper, RegistroActividadMapper, ReprogramacionActividadMapper } from "@equipos/infrastructure/mappers";
import { Inject, Injectable } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { PlanActividadOrm, RegistroActividadOrm, ReprogramacionActividadOrm } from "@orm/inn/equipos";
import { Request } from "express";
import { In, IsNull, Not } from "typeorm";


@Injectable()
export class TypeOrmRegistroActividadRepository extends BaseSource
    implements RegistroActividadRepository {
    constructor(
        @Inject(REQUEST) request: Request,
        private readonly dataScope: DataScopeService,
        private readonly actividadesPolicy: ActividadesDataScopePolicy,
        private readonly anexoReader: AnexoReader,
    ) {
        super(request);
    }

    private get repository() {
        const qr = TypeOrmTransactionContext.getQueryRunner();
        return qr
            ? qr.manager.getRepository(RegistroActividadOrm)
            : this.conn.getRepository(RegistroActividadOrm);
    }

    private get planRepository() {
        const qr = TypeOrmTransactionContext.getQueryRunner();
        return qr
            ? qr.manager.getRepository(PlanActividadOrm)
            : this.conn.getRepository(PlanActividadOrm);
    }

    private get reprogramacionRepository() {
        const qr = TypeOrmTransactionContext.getQueryRunner();
        return qr
            ? qr.manager.getRepository(ReprogramacionActividadOrm)
            : this.conn.getRepository(ReprogramacionActividadOrm);
    }

    public async save(regMant: RegistroActividad): Promise<RegistroActividad> {
        const regMantOrm = RegistroActividadMapper.toOrm(regMant);
        const regMantOrmSaved = await this.repository.save(regMantOrm);
        return RegistroActividadMapper.toDomain(regMantOrmSaved);
    }

    public async update(updateRegMant: RegistroActividad): Promise<RegistroActividad> {
        if (!(updateRegMant.getId?.getValor)) return null;
        const updateData = RegistroActividadMapper.toUpdateOrm(updateRegMant);
        await this.repository.save(updateData);

        const reprogramacionesNuevas = updateRegMant.pullReprogramacionesAgregadas();
        const reprogramacionesActualizadas = updateRegMant.pullReprogramacionesActualizadas();

        if (reprogramacionesNuevas.length > 0) {
            const reprogramacionesNuevasOrm = ReprogramacionActividadMapper.toOrmList(reprogramacionesNuevas)
            await this.reprogramacionRepository.save(reprogramacionesNuevasOrm);
        }

        if (reprogramacionesActualizadas.length > 0) {
            const reprogramacionesActualizadasOrm = ReprogramacionActividadMapper.toOrmList(reprogramacionesActualizadas)
            await this.reprogramacionRepository.save(reprogramacionesActualizadasOrm);
        }

        return await this.findById(updateData.id);
    }


    async findById(id: number): Promise<RegistroActividad | null> {
        const orm = await this.baseQuery()
            .where('reg.id = :id', { id })
            .getOne();
        return orm ? RegistroActividadMapper.toDomain(orm) : null;
    }

    async findByIdAndTipo(id: number, tipo: TipoActividad): Promise<RegistroActividad | null> {
        const orm = await this.baseQuery()
            .where('reg.id = :id', { id })
            .andWhere('reg.tipo = :tipo', { tipo: tipo })
            .getOne();
        return orm ? RegistroActividadMapper.toDomain(orm) : null;
    }

    async findAllViewFilter(
        page: number,
        limit: number,
        usuarioCtx: UserScopeContext,
        estado?: EstadoActividad,
        tipo?: TipoActividad,
        naturaleza?: NaturalezaIntervencionActividad,
        equipoId?: number,
        revisado?: boolean,
        fechaInicio?: Date,
        fechaFin?: Date
    ): Promise<[RegistroActividadRead[], number]> {
        let qb = this.baseViewQuery();

        qb = await this.dataScope.apply(
            usuarioCtx,
            qb,
            'reg',
            this.actividadesPolicy,
        );

        if (equipoId) qb.andWhere('equipo.id = :equipoId', { equipoId });
        if (estado) qb.andWhere('reg.estado = :estado', { estado });
        if (naturaleza) qb.andWhere('reg.naturaleza = :naturaleza', { naturaleza });
        if (tipo) qb.andWhere('reg.tipo = :tipo', { tipo: tipo });
        if (fechaInicio && fechaFin) {
            qb.andWhere('reg.fechaProgramada BETWEEN :fi AND :ff', {
                fi: fechaInicio, ff: fechaFin,
            });
        }
        if (revisado !== undefined) {
            qb.andWhere('reg.estado = :estadoCompletado', {
                estadoCompletado: EstadoActividad.COMPLETADO,
            });

            if (revisado) {
                qb.andWhere('reg.aprobadoPorId IS NOT NULL');
            } else {
                qb.andWhere('reg.aprobadoPorId IS NULL');
            }
        }

        qb.addSelect('CASE WHEN reg.fechaRealizacion IS NULL THEN 0 ELSE 1 END', 'ordenPendiente')
            .orderBy('ordenPendiente', 'ASC')
            .addOrderBy('reg.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [orms, count] = await qb.getManyAndCount();
        await this.anexoReader.enrich(orms, EntidadTipoAnexo.REGISTRO_ACTIVIDAD);
        return [RegistroActividadMapper.toViewList(orms), count];
    }

    async updatePlanActividad(plan: PlanActividad): Promise<PlanActividad> {
        const orm = PlanActividadMapper.toUpdateAfterEjecuciontOrm(plan);
        const saved = await this.planRepository.save(orm) as PlanActividadOrm;
        return PlanActividadMapper.toDomain(saved);
    }

    async markPendientes(): Promise<void> {
        const today = new Date();
        await this.repository.createQueryBuilder()
            .update()
            .set({ estado: EstadoActividad.PENDIENTE })
            .where('estado = :estado', { estado: EstadoActividad.PROGRAMADO })
            .andWhere('fechaRealizacion IS NULL')
            .andWhere(`DATEADD(DAY, -(
        SELECT pa.diasAnticipacionNotificacion
        FROM ${TABLE_NAMES.inn.eqp.actividades.planes_actividades} pa
        WHERE pa.OID = planActividadId
      ), fechaProgramada) <= CAST(:today AS DATE)`)
            .andWhere('CAST(fechaProgramada AS DATE) >= CAST(:today AS DATE)')
            .setParameter('today', today)
            .execute();
    }

    async markRetrasados(): Promise<void> {
        await this.repository.createQueryBuilder()
            .update()
            .set({ estado: EstadoActividad.RETRASADO })
            .where('fechaRealizacion IS NULL')
            .andWhere('estado IN (:...estados)', {
                estados: [EstadoActividad.PROGRAMADO, EstadoActividad.PENDIENTE],
            })
            .andWhere('CAST(fechaProgramada AS DATE) < CAST(:today AS DATE)')
            .setParameter('today', new Date())
            .execute();
    }

    async findPlanesParaProgramar(): Promise<PlanActividad[]> {
        const planes = await this.planRepository.find({
            where: {
                periocidad: { valor: Not(IsNull()), unidad: Not(IsNull()) },
                fechaProximaEjecucion: Not(IsNull()),
            },
            relations: ['equipo', 'formato'],
        });

        const validos = await Promise.all(
            planes.map(async plan => {
                const existe = await this.repository.exists({
                    where: {
                        planActividad: { id: plan.id },
                        origen: OrigenActividad.PROGRAMADO,
                        fechaProgramada: plan.fechaProximaEjecucion,
                    },
                });
                return !existe ? plan : null;
            })
        );

        return validos
            .filter((p): p is PlanActividadOrm => p !== null)
            .map(PlanActividadMapper.toDomain);
    }

    async sumaryEstadosByFechas(
        fechaInicio?: Date,
        fechaFin?: Date,
    ): Promise<ResumenEstadoRaw[]> {

        const qb = this.repository
            .createQueryBuilder('reg')
            .select('reg.estado', 'estado')
            .addSelect('COUNT(reg.id)', 'total')
            .where('reg.origen = :origen', {
                origen: OrigenActividad.PROGRAMADO,
            });

        if (fechaInicio && fechaFin) {
            qb.andWhere(
                'reg.fechaProgramada BETWEEN :fi AND :ff',
                {
                    fi: fechaInicio,
                    ff: fechaFin,
                },
            );
        }

        return qb
            .groupBy('reg.estado')
            .orderBy('reg.estado', 'ASC')
            .getRawMany();
    }

    async findViewById(id: number): Promise<RegistroActividadRead | null> {
        const orm = await this.baseViewQuery().where('reg.id = :id', { id }).getOne();
        await this.anexoReader.enrichOne(orm, EntidadTipoAnexo.REGISTRO_ACTIVIDAD);
        await this.anexoReader.enrichOne(orm?.ejecucionExterna, EntidadTipoAnexo.EJECUCION_EXTERNA);
        return orm ? RegistroActividadMapper.toView(orm) : null;
    }

    async findProgramadoPendienteByPlan(planActividadId: number): Promise<RegistroActividad | null> {
        const orm = await this.repository.findOne({
            where: {
                planActividad: { id: planActividadId },
                origen: OrigenActividad.PROGRAMADO,
                fechaRealizacion: IsNull(),
                estado: Not(EstadoActividad.COMPLETADO),
            },
            order: { fechaProgramada: 'DESC' },
        });
        return orm ? RegistroActividadMapper.toDomain(orm) : null;
    }

    public async findPendientesByEquipoId(
        equipoId: number
    ): Promise<RegistroActividad[]> {
        const regActividades = await this.repository.find(
            {
                where: {
                    equipo: { id: equipoId },
                    estado: In([
                        EstadoActividad.PROGRAMADO,
                        EstadoActividad.PENDIENTE,
                        EstadoActividad.REPROGRAMADO,
                        EstadoActividad.RETRASADO
                    ])
                }
            }
        )
        return RegistroActividadMapper.toDomainList(regActividades);
    }

    async saveMany(
        regActividades: RegistroActividad[]
    ): Promise<void> {
        const orms = regActividades.map(reg => RegistroActividadMapper.toUpdateOrm(reg));
        await this.repository.save(orms)
    }

    private baseQuery() {
        return this.repository.createQueryBuilder('reg')
            .leftJoinAndSelect('reg.reprogramaciones', 'reprogramaciones')
            .leftJoin('reg.equipo', 'equipo').addSelect(['equipo.id'])
            .leftJoin('reg.formato', 'formato').addSelect(['formato.id'])
            .leftJoin('reg.planActividad', 'plan').addSelect(['plan.id'])
            .leftJoinAndSelect('reg.asignacionesRecurso', 'asignacionesRecurso');
    }

    private baseViewQuery() {
        return this.repository.createQueryBuilder('reg')
            .leftJoinAndSelect('reg.equipo', 'equipo')
            .leftJoinAndSelect('reg.planActividad', 'planActividad')
            .leftJoinAndSelect('reg.formato', 'formato')
            .leftJoinAndSelect('reg.asignacionesRecurso', 'asignacionesRecurso')
            .leftJoinAndSelect('reg.reprogramaciones', 'reprogramaciones')
            .leftJoinAndSelect('reg.ejecucionExterna', 'ejecucionExterna')
            .leftJoinAndSelect('ejecucionExterna.terceroTecnico', 'tecnico')
            .leftJoinAndSelect('ejecucionExterna.empresaTercero', 'empresaTercero')
    }


    findPlanesAplicanCreacionProgramado(): Promise<PlanActividad[]> {
        throw new Error("Method not implemented.");
    }

    updatePlan(planMantenimiento: PlanActividad): Promise<PlanActividad> {
        return this.updatePlanActividad(planMantenimiento);
    }

    async countByEstadoForCronograma(
        anio: number,
        mes: number,
        tipo: TipoActividad,
    ): Promise<ResumenEstadoRaw[]> {
        return this.repository.createQueryBuilder('reg')
            .select('reg.estado', 'estado')
            .addSelect('COUNT(reg.id)', 'total')
            .where('reg.tipo = :tipo', { tipo })
            .andWhere('YEAR(reg.fechaProgramada) = :anio', { anio })
            .andWhere('MONTH(reg.fechaProgramada) = :mes', { mes })
            .groupBy('reg.estado')
            .orderBy('reg.estado', 'ASC')
            .getRawMany<ResumenEstadoRaw>();
    }

    async findForReporte(filters: {
        fechaInicio?: Date;
        fechaFin?: Date;
        tipo?: TipoActividad;
        estado?: EstadoActividad;
        equipoId?: number;
        naturaleza?: NaturalezaIntervencionActividad;
        page: number;
        limit: number;
    }): Promise<[RegistroActividadRead[], number]> {
        const qb = this.repository
            .createQueryBuilder('reg')
            .leftJoinAndSelect('reg.equipo', 'equipo')
            .leftJoinAndSelect('reg.formato', 'formato')
            .leftJoinAndSelect('reg.planActividad', 'plan')
            .leftJoinAndSelect('reg.reprogramaciones', 'reprogramaciones');

        if (filters.equipoId) qb.andWhere('equipo.id = :equipoId', { equipoId: filters.equipoId });
        if (filters.tipo) qb.andWhere('reg.tipo = :tipo', { tipo: filters.tipo });
        if (filters.estado) qb.andWhere('reg.estado = :estado', { estado: filters.estado });
        if (filters.naturaleza) qb.andWhere('reg.naturaleza = :naturaleza', { naturaleza: filters.naturaleza });

        if (filters.fechaInicio && filters.fechaFin) {
            qb.andWhere('reg.fechaProgramada BETWEEN :fi AND :ff', {
                fi: filters.fechaInicio,
                ff: filters.fechaFin,
            });
        } else if (filters.fechaInicio) {
            qb.andWhere('reg.fechaProgramada >= :fi', { fi: filters.fechaInicio });
        } else if (filters.fechaFin) {
            qb.andWhere('reg.fechaProgramada <= :ff', { ff: filters.fechaFin });
        }

        qb.orderBy('reg.fechaProgramada', 'DESC')
            .addOrderBy('reg.createdAt', 'DESC')
            .skip((filters.page - 1) * filters.limit)
            .take(filters.limit);

        const [orms, count] = await qb.getManyAndCount();
        await this.anexoReader.enrich(orms, EntidadTipoAnexo.REGISTRO_ACTIVIDAD);
        await this.anexoReader.enrich(orms?.map(o => o.ejecucionExterna), EntidadTipoAnexo.EJECUCION_EXTERNA);
        return [RegistroActividadMapper.toViewList(orms), count];
    }

















    delete(id: number): Promise<void> {
        throw new Error("Method not implemented.");
    }
    exists(id: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    findAllView(page: number, limit: number): Promise<[RegistroActividadRead[], number]> {
        throw new Error("Method not implemented.");
    }
}