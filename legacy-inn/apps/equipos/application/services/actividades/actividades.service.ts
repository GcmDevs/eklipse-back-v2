import { buildUserScope } from '@auth/application/helpers/user-scope.helper';
import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { getUser } from '@common/infrastructure/services';
import { CONSECUTIVOS_CODES, ConsecutivoService } from '@core/consecutivos/application';
import { AnexoWriter } from '@core/media/application/services/anexos-writer.service';
import { AddAnexosDto } from '@core/media/presentation/dto';
import { TerceroService } from '@core/terceros/application/services';
import { generateCorrelationId } from '@equipos/application/helpers';
import { CreateRegistroActividadDefaultType } from '@equipos/application/types/create-registro-mant-inicial.type';
import { AsignacionRecursoActividad, EjecucionExterna, RegistroActividad } from '@equipos/domain/entities';
import { EstadoActividad, ModalidadEjecucionActividad, MotivoAnulacionActividad, NaturalezaIntervencionActividad, OrigenActividad, TipoActividad, TipoEjecutorExterno } from '@equipos/domain/enums';
import { DomainEquipoEvent } from '@equipos/domain/events';
import { RegistroActividadRead } from '@equipos/domain/read';
import { ASIGNACION_RECURSO_ACTIVIDAD_REPOSITORY, AsignacionRecursoActividadRepository, EJECUCION_EXTERNA_REPOSITORY, EjecucionExternaRepository, EQUIPOS_REPOSITORY, EquiposRepository, REGISTRO_ACTIVIDAD_REPOSITORY, RegistroActividadRepository } from '@equipos/domain/repositories';
import { AssingRecursoActividadDto, CompleteActividadProgramadaDto, CreateRegistroActividadDto, CreateReprogramacionActividadDto, EjecucionExternaEmbebidaDto, FilterRegistroActividadDto, MotivoFinalizacionAsignacionActividadDto } from '@equipos/presentation/dto';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { RolTercero } from '@orm/cor';
import { EstadoRegistroDilg } from 'apps/motor-formatos/domain';
import { RecursoService } from './recursos.service';
import { REGISTRO_DILG_VALIDATOR_SERVICE, RegistroDilgService } from './registo-dilg.across.service';


@Injectable()
export class ActividadesService {
    constructor(
        @Inject(REGISTRO_ACTIVIDAD_REPOSITORY)
        private readonly regActividadRepository: RegistroActividadRepository,
        @Inject(EQUIPOS_REPOSITORY)
        private readonly equipoRepository: EquiposRepository,
        private readonly consecutivosService: ConsecutivoService,
        private readonly tercerosService: TerceroService,
        @Inject(ASIGNACION_RECURSO_ACTIVIDAD_REPOSITORY)
        private readonly asignacionRecursoRepository: AsignacionRecursoActividadRepository,
        @Inject(EJECUCION_EXTERNA_REPOSITORY)
        private readonly ejecucionExternaRepository: EjecucionExternaRepository,
        private readonly anexoWriter: AnexoWriter,
        private readonly recursoService: RecursoService,
        @Optional() @Inject(REGISTRO_DILG_VALIDATOR_SERVICE)
        private readonly regDilgService: RegistroDilgService | null,
        @Inject(TRANSACTION_MANAGER)
        private readonly txManager: TransactionManager,
    ) { }


    public async createInmediato(
        { equipoId, anexos: anexosInline, ...createRegData }: CreateRegistroActividadDto,
    ): Promise<RegistroActividadRead> {
        if (createRegData.origen === OrigenActividad.PROGRAMADO)
            throw new BadInputError('Las actividades programadas no se crean por este flujo');

        const equipo = await this.equipoRepository.findById(equipoId);
        if (!equipo) throw new ResourceNotFoundError(`Equipo con id: ${equipoId} no encontrado`);

        equipo.ensureNotDeBaja();
        const aggregates: Array<{ pullEvents(): DomainEquipoEvent[] }> = [];
        const regActSaved = await this.txManager.transactional(async () => {
            const codigo = await this.buildCodigoActividad(createRegData.tipo, createRegData.naturaleza);
            const usuarioTecnicoId = getUser().id;
            const regActividad = RegistroActividad.createInmediato(
                codigo,
                equipoId,
                createRegData.tipo,
                createRegData.origen,
                createRegData.naturaleza,
                createRegData.fechaRealizacion,
                createRegData.prioridad,
                createRegData?.solicitadoPorId,
                createRegData.fechaInicio,
                createRegData.fechaFinalizacion,
                usuarioTecnicoId,
                createRegData?.observaciones,
                createRegData.costoManoObra,
                createRegData.costoRepuestos
            );
            const saved = await this.regActividadRepository.save(regActividad);
            if (anexosInline?.length) {
                await this.anexoWriter.attachToRegistroActividad(saved.getId.getValor, anexosInline);
            }
            aggregates.push(regActividad);
            return saved;
        }, aggregates);
        return this.regActividadRepository.findViewById(regActSaved.getId.getValor);
    }

    public async completeProgramado(
        registroId: number,
        { equipoId, tipo, anexos: anexosRegistroInline, ejecucionExterna, ...completeData }: CompleteActividadProgramadaDto,
    ): Promise<RegistroActividadRead> {
        const [equipo, regActividad] = await Promise.all([
            this.equipoRepository.findById(equipoId),
            this.regActividadRepository.findByIdAndTipo(registroId, tipo),
        ]);

        if (!equipo) throw new ResourceNotFoundError(`Equipo con id: ${equipoId} no encontrado`);
        if (!regActividad) throw new ResourceNotFoundError(`Registro con id: ${registroId} no encontrado`);
        if (regActividad.getEquipoId.getValor !== equipoId)
            throw new BadInputError(`El registro ${registroId} no pertenece al equipo ${equipoId}`);

        equipo.ensureNotDeBaja();
        const requiredExterno = regActividad.getModalidadPlanificada === ModalidadEjecucionActividad.EXTERNA;
        const planActividad = equipo.getPlan(regActividad.getTipoActividad);
        const planHasFormato = !!planActividad?.getFormatoId?.getValor;

        if (requiredExterno && !ejecucionExterna)
            throw new BadInputError(
                'Esta actividad requiere ejecución externa. Debe enviar el objeto ejecucionExterna.');

        if (!requiredExterno && ejecucionExterna && !ejecucionExterna.esExcepcional)
            throw new BadInputError(
                'Esta actividad no está planificada como externa. ' +
                'Para registrar un ejecutor externo debe incluir esExcepcional=true y motivoExcepcional.');

        const esEjecucionExterna = requiredExterno || !!ejecucionExterna;
        if (planHasFormato && !esEjecucionExterna) {
            await this.ensureFormatoCompletadoParaCierre(registroId);
        }

        const aggregates: Array<{ pullEvents(): DomainEquipoEvent[] }> = [];
        const correlationId = generateCorrelationId();
        const regProgSaved = await this.txManager.transactional(async () => {
            const usuarioTecnicoResponsable = getUser();
            regActividad.complete({
                fechaRealizacion: completeData.fechaRealizacion,
                tecnicoResponsableId: usuarioTecnicoResponsable.id,
                fechaInicio: completeData.fechaInicio,
                realizadoPorExterno: esEjecucionExterna,
                fechaFinalizacion: completeData.fechaFinalizacion,
                observaciones: completeData?.observaciones,
                costoManoObra: completeData?.costoManoObra,
                costoRepuestos: completeData?.costoRepuestos,
            });

            const saved = await this.regActividadRepository.save(regActividad);
            const savedId = saved.getId.getValor;
            if (anexosRegistroInline?.length) {
                await this.anexoWriter.attachToRegistroActividad(savedId, anexosRegistroInline);
            }

            if (esEjecucionExterna && ejecucionExterna) {
                await this.registerEjecucionExterna(regActividad, ejecucionExterna);
            }

            aggregates.push(regActividad);
            if (regActividad.getPlanActividadId && planActividad) {
                planActividad.updateAfterEjecucion(completeData.fechaRealizacion);
                await this.regActividadRepository.updatePlan(planActividad);
                if (planActividad.getFechaProximaEjecucion) {
                    const nuevaProxActividad = await this.createRegistroProgramadoDefault({
                        equipoId,
                        formatoId: planActividad.getFormatoId?.getValor,
                        esRealizaPorExterno: planActividad.getSeRealizaPorExterno ?? false,
                        planActividadId: planActividad.getId.getValor,
                        tipo: regActividad.getTipoActividad,
                        fechaPrograma: planActividad.getFechaProximaEjecucion
                    });
                    aggregates.push(nuevaProxActividad);
                }
            }

            return saved
        }, aggregates, correlationId);
        return await this.regActividadRepository.findViewById(regProgSaved.getId.getValor);
    }

    private async registerEjecucionExterna(
        registro: RegistroActividad,
        data: EjecucionExternaEmbebidaDto,
    ): Promise<EjecucionExterna> {
        const registroId = registro.getId.getValor;
        const exist = await this.ejecucionExternaRepository
            .existsByRegActividadId(registroId);
        if (exist)
            throw new BadInputError(`El registro ${registroId} ya tiene una ejecución externa registrada`);

        const requiereExterno = registro.getModalidadPlanificada === ModalidadEjecucionActividad.EXTERNA;
        if (!requiereExterno && !data.esExcepcional)
            throw new BadInputError(
                'Esta actividad no está planificada como externa. ' +
                'Debe incluir esExcepcional=true e indicar el motivo.');

        const { empresa, tecnico } = await this.resolveEjecutor(data);
        if (!data.esExcepcional && (data.motivoExcepcional || data.motivoExcepcionalDetalle)) {
            throw new BadInputError(`Si no es excepcional no se debe mandar motivo excepcional o detalles`);
        }

        return this.txManager.transactional(async () => {
            const ejecucion = EjecucionExterna.create({
                registroActividadId: registroId,
                tipoEjecutor: data.tipoEjecutor,
                fechaEjecucion: data.fechaEjecucion,
                tecnicoNombre: tecnico.nombre,
                terceroTecnicoId: tecnico.id,
                empresaTerceroId: empresa?.id,
                empresaNombreSnapshot: empresa?.nombre,
                observaciones: data.observaciones,
                esExcepcional: data.esExcepcional ?? false,
                motivoExcepcional: data.motivoExcepcional,
                motivoExcepcionalDetalle: data.motivoExcepcionalDetalle,
            });
            const savedEE = await this.ejecucionExternaRepository.save(ejecucion);

            if (data.anexos?.length) {
                await this.anexoWriter.attachToEjecucionExterna(savedEE.getId.getValor, data.anexos);
            }
            return savedEE
        });
    }

    async check(registroId: number): Promise<RegistroActividadRead> {
        const registro = await this.regActividadRepository.findById(registroId);
        if (!registro)
            throw new ResourceNotFoundError(`Registro con id: ${registroId} no encontrado`);

        await this.txManager.transactional(async () => {
            const aprobadorId = getUser().id;
            registro.check(aprobadorId);
            await this.regActividadRepository.update(registro);
        });
        return this.regActividadRepository.findViewById(registroId);
    }

    async reschedule(
        registroId: number,
        { equipoId, tipo, ...data }: CreateReprogramacionActividadDto,
    ): Promise<RegistroActividadRead> {
        const [equipo, registro] = await Promise.all([
            this.equipoRepository.findById(equipoId),
            this.regActividadRepository.findByIdAndTipo(registroId, tipo),
        ]);

        if (!equipo) throw new ResourceNotFoundError(`Equipo con id: ${equipoId} no encontrado`);
        if (!registro) throw new ResourceNotFoundError(`Registro con id: ${registroId} no encontrado`);
        if (registro.getEquipoId.getValor !== equipoId)
            throw new BadInputError(`El registro ${registroId} no pertenece al equipo ${equipoId}`);

        equipo.ensureNotDeBaja();
        registro.reschedule(data.fechaReprogramada, data.motivo, data?.motivoDetalle);

        return this.txManager.transactional(async () => {
            const updated = await this.regActividadRepository.update(registro);
            return await this.regActividadRepository.findViewById(updated.getId.getValor);
        });
    }

    async createRegistroProgramadoDefault(data: CreateRegistroActividadDefaultType):
        Promise<RegistroActividad> {
        const esRealizaPorExterno = data?.esRealizaPorExterno ?? false,

            modalidadPlanificada = esRealizaPorExterno
                ? ModalidadEjecucionActividad.EXTERNA
                : ModalidadEjecucionActividad.INTERNA;

        const codigo = await this.buildCodigoActividad(data.tipo, NaturalezaIntervencionActividad.PREVENTIVA);
        const regActDefault = RegistroActividad.createProgramado({
            codigo: codigo,
            equipoId: data.equipoId,
            planActividadId: data.planActividadId,
            tipo: data.tipo,
            modalidadPlanificada,
            fechaProgramada: data.fechaPrograma,
            formatoId: data?.formatoId,
        });

        return this.txManager.transactional(async () => {
            await this.regActividadRepository.save(regActDefault);
            return regActDefault;
        });
    }

    public async updateRegistroProgramado(
        planActividadId: number,
        nuevaFecha: Date,
    ): Promise<void> {
        const registroPendiente = await this.regActividadRepository
            .findProgramadoPendienteByPlan(planActividadId);

        if (!registroPendiente) return;

        registroPendiente.updateFechaProgramada(nuevaFecha);
        await this.regActividadRepository.save(registroPendiente);
    }

    public async addAnexosRegistro(
        registroId: number,
        dto: AddAnexosDto,
    ): Promise<RegistroActividadRead> {
        const registro = await this.regActividadRepository.findById(registroId);
        if (!registro)
            throw new ResourceNotFoundError(`Registro con id: ${registroId} no encontrado`);

        await this.txManager.transactional(async () => {
            await this.anexoWriter.attachToRegistroActividad(registroId, dto.anexos);
        });
        return this.regActividadRepository.findViewById(registroId);
    }

    public async addAnexosEjecucionExterna(
        registroId: number,
        dto: AddAnexosDto,
    ): Promise<void> {
        const ejecucion = await this.ejecucionExternaRepository.findByRegActividadId(registroId);
        if (!ejecucion)
            throw new ResourceNotFoundError(
                `No existe ejecución externa para el registro ${registroId}`,
            );
        const ejecucionId = ejecucion.getId.getValor;

        await this.txManager.transactional(async () => {
            await this.anexoWriter.attachToEjecucionExterna(ejecucionId, dto.anexos);
        });
    }

    public async getOneById(id: number): Promise<RegistroActividadRead> {
        const regActividadFound = await this.regActividadRepository.findViewById(id);
        if (!regActividadFound) throw new ResourceNotFoundError(`registro actividad no encontrado`)

        return regActividadFound
    }

    async getAll(
        filtersData: FilterRegistroActividadDto,
    ): Promise<[RegistroActividadRead[], number]> {
        if (
            filtersData.revisado !== undefined &&
            filtersData.estado !== undefined &&
            filtersData.estado !== EstadoActividad.COMPLETADO) {
            throw new BadInputError(
                'Para filtrar por revisado, estado debe ser COMPLETADO u omitirse',
            );
        }
        const [registros, count] = await this.regActividadRepository.findAllViewFilter(
            filtersData.page,
            filtersData.limit,
            buildUserScope(),
            filtersData.estado,
            filtersData.tipo,
            filtersData.naturaleza,
            filtersData.equipoId,
            filtersData.revisado,
            filtersData.fechaInicio,
            filtersData.fechaFin,
        );
        return [registros, count];
    }

    public async cancelPendientesByEquipo(
        equipoId: number,
        motivo: MotivoAnulacionActividad,
    ): Promise<void> {
        const regsActividad =
            await this.regActividadRepository
                .findPendientesByEquipoId(equipoId);

        const observacion = this.buildObservacionByMotivo(motivo);
        regsActividad.forEach(reg => {
            reg.cancel(motivo, observacion);
        });

        await this.regActividadRepository.saveMany(regsActividad);
    }

    async assingRecurso(
        id: number,
        data: AssingRecursoActividadDto
    ): Promise<RegistroActividadRead> {
        const [regAct, recurso] = await Promise.all([
            this.regActividadRepository.findById(id),
            this.recursoService.findById(data.recursoId),
        ]);

        if (!regAct)
            throw new ResourceNotFoundError(`Actividad con id: ${id} no encontrado`);
        if (!recurso)
            throw new ResourceNotFoundError(`Recurso con id: ${data.recursoId} no encontrado`);
        if (!recurso.isActivo)
            throw new BadInputError('No se puede asignar un recurso inactivo a una actividad');
        if (
            regAct.getEstado === EstadoActividad.COMPLETADO ||
            regAct.getEstado === EstadoActividad.ANULADO
        ) throw new BadInputError(
            `No se puede asignar recurso a una actividad en estado ${regAct.getEstado}`,
        );

        return this.txManager.transactional(async () => {
            const asignacionActiva = await this.asignacionRecursoRepository
                .findActivaByActividad(id);

            const usuarioAsignadorId = getUser().id;
            if (asignacionActiva) {
                if (asignacionActiva.getRecursoId.getValor === data.recursoId)
                    throw new BadInputError(
                        'El recurso indicado ya esta asignado a esta actividad',
                    );

                if (!data.motivoCambio) {
                    throw new BadInputError(
                        'Para reemplazar el recurso debe indicar el motivo del cambio',
                    );
                }
                asignacionActiva.finalize({
                    finalizadoPorId: usuarioAsignadorId,
                    motivoFinalizacion: data.motivoCambio.motivo,
                    motivoFinalizacionDetalle: data.motivoCambio.detalle,
                });
                await this.asignacionRecursoRepository.update(asignacionActiva);
            }

            const nueva = AsignacionRecursoActividad.create({
                actividadId: id,
                recursoId: data.recursoId,
                asignadoPorId: usuarioAsignadorId,
                motivoAsignacion: data.motivoAsignacion.motivo,
                motivoAsignacionDetalle: data.motivoAsignacion.detalle,
                observaciones: data.observaciones,
            });
            await this.asignacionRecursoRepository.save(nueva);

            return this.regActividadRepository.findViewById(id);
        });
    }

    async removeRecurso(id: number, data: MotivoFinalizacionAsignacionActividadDto):
        Promise<RegistroActividadRead> {
        const asignacionActiva = await this.asignacionRecursoRepository
            .findActivaByActividad(id);

        if (!asignacionActiva)
            throw new ResourceNotFoundError(
                `La actividad ${id} no tiene un recurso asignado`,
            );

        return this.txManager.transactional(async () => {
            const usuarioFinalizadorId = getUser().id;
            asignacionActiva.finalize({
                finalizadoPorId: usuarioFinalizadorId,
                motivoFinalizacion: data.motivo,
                motivoFinalizacionDetalle: data.detalle,
            });
            await this.asignacionRecursoRepository.update(asignacionActiva);
            return this.regActividadRepository.findViewById(id);
        });
    }

    public async getHistorialRecursos(id: number) {
        const registro = await this.regActividadRepository.findById(id);
        if (!registro)
            throw new ResourceNotFoundError(`Actividad con id: ${id} no encontrado`);
        return await this.asignacionRecursoRepository.findAllViewByActividad(id);
    }

    async findById(id: number, options = new FindThrowOptions()): Promise<RegistroActividad | null> {
        const found = await this.regActividadRepository.findById(id);
        if (!found && options.throwIfNotFound)
            throw new ResourceNotFoundError(`Registro con id: ${id} no encontrado`);
        return found;
    }

    private async ensureFormatoCompletadoParaCierre(regActividadId: number): Promise<void> {
        if (!this.regDilgService) {
            return;
        }
        const regDilg = await this.regDilgService.findEstadoByRegActividadId(regActividadId);
        if (!regDilg)
            throw new BadInputError(
                'Esta actividad requiere formato diligenciado. ' +
                'Diligencie el formato y márquelo como completado antes de cerrar la actividad.',
            );

        if (regDilg.estado !== EstadoRegistroDilg.COMPLETADO)
            throw new BadInputError(
                `El formato está en estado "${regDilg.estado}". ` +
                'Debe completar el formato antes de cerrar la actividad.',
            );
    }

    private buildObservacionByMotivo(
        motivo: MotivoAnulacionActividad,
    ): string {
        switch (motivo) {
            case MotivoAnulacionActividad.BAJA_DEFINITIVA:
                return 'Actividad anulada por baja definitiva del equipo';

            case MotivoAnulacionActividad.BAJA_INDEFINIDA:
                return 'Actividad anulada por baja indefinida o bodega';

            default:
                return 'Actividad anulada';
        }
    }

    private async buildCodigoActividad(
        tipo: TipoActividad,
        naturaleza: NaturalezaIntervencionActividad,
    ): Promise<string> {
        const tipoPrefix = {
            [TipoActividad.MANTENIMIENTO]:
                CONSECUTIVOS_CODES.REG_ACTIVIDAD.MANT,

            [TipoActividad.CALIBRACION]:
                CONSECUTIVOS_CODES.REG_ACTIVIDAD.CALIB,
        };

        const naturalezaPrefix = {
            [NaturalezaIntervencionActividad.PREVENTIVA]:
                CONSECUTIVOS_CODES.REG_ACTIVIDAD.NATURALEZA.PREVENTIVA,

            [NaturalezaIntervencionActividad.CORRECTIVA]:
                CONSECUTIVOS_CODES.REG_ACTIVIDAD.NATURALEZA.CORRECTIVA,

            [NaturalezaIntervencionActividad.PREDICTIVA]:
                CONSECUTIVOS_CODES.REG_ACTIVIDAD.NATURALEZA.PREDICTIVA,
        };

        const conCod = `${tipoPrefix[tipo]}-${naturalezaPrefix[naturaleza]}`;
        return await this.consecutivosService.generate(conCod);
    }

    private async resolveEjecutor(data: EjecucionExternaEmbebidaDto) {
        switch (data.tipoEjecutor) {

            case TipoEjecutorExterno.EMPRESA_CON_TECNICO: {
                if (!data.empresaTerceroId || !data.terceroTecnicoId) {
                    throw new BadInputError('Faltan datos del ejecutor');
                }

                const [empresa, tecnico] = await Promise.all([
                    this.tercerosService.findByIdAndRol(data.empresaTerceroId, RolTercero.ORGANIZACION),
                    this.tercerosService.findByIdAndRol(data.terceroTecnicoId, RolTercero.TECNICO),
                ]);

                return { empresa, tecnico };
            }

            case TipoEjecutorExterno.TECNICO_INDEPENDIENTE: {
                if (!data.terceroTecnicoId) {
                    throw new BadInputError('Falta técnico');
                }

                const tecnico = await this.tercerosService.findByIdAndRol(
                    data.terceroTecnicoId,
                    RolTercero.TECNICO,
                );

                return { empresa: null, tecnico };
            }
        }
    }
}