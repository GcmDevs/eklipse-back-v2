import { BadInputError } from '@common/domain/errors';
import { TimerServices } from '@common/application/services';
import { Id } from '@common/domain/value-objects';
import {
  EstadoActividad,
  ModalidadEjecucionActividad,
  MotivoAnulacionActividad,
  MotivoReprogramacionActividad,
  NaturalezaIntervencionActividad,
  OrigenActividad,
  PrioridadActividad,
  TipoActividad,
} from '@equipos/domain/enums';
import {
  ActividadInmediatedEvent,
  ActividadScheduledEvent,
} from '@equipos/domain/events/actividad-created.event';
import { ReprogramacionActividad } from './reprogramacion-actividad.entity';
import { DomainEquipoEvent } from '@equipos/domain/events';

export class RegistroActividad {
  private reprogramacionesAgregadas: ReprogramacionActividad[] = [];
  private reprogramacionesActualizadas: ReprogramacionActividad[] = [];
  private events: DomainEquipoEvent[] = [];

  private constructor(
    private readonly id: Id,
    private readonly codigo: string,
    private readonly equipoId: Id,
    private readonly formatoId: Id | null,
    private readonly planActividadId: Id | null,
    private readonly tipo: TipoActividad,
    private readonly origen: OrigenActividad,
    private readonly naturalezaIntervencion: NaturalezaIntervencionActividad,

    private readonly modalidadPlanificada: ModalidadEjecucionActividad | null,
    private modalidadEjecutada: ModalidadEjecucionActividad | null,

    private fechaProgramada: Date | null,
    private fechaRealizacion: Date | null,
    private duracionMinutos: number | null,
    private fechaInicio: Date | null,
    private fechaFinalizacion: Date | null,
    private diasDesviacion: number | null,

    private estado: EstadoActividad,
    private prioridad: PrioridadActividad | null,

    private observaciones: string | null,
    private motivoAnulacion: MotivoAnulacionActividad | null,

    private tecnicoResponsableId: number | null,
    private solicitadoPorId: number | null,
    private aprobadoPorId: number | null,
    private fechaAprobacion: Date | null,
    private motivoRechazo: string | null,

    private costoManoObra: number | null,
    private costoRepuestos: number | null,
    private costoTotal: number | null,

    private readonly reprogramaciones: ReprogramacionActividad[],
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static createProgramado(data: {
    codigo: string;
    equipoId: number;
    planActividadId: number;
    tipo: TipoActividad;
    modalidadPlanificada: ModalidadEjecucionActividad;
    fechaProgramada: Date;
    formatoId?: number;
    prioridad?: PrioridadActividad;
  }): RegistroActividad {
    const registroAct = new RegistroActividad(
      new Id(),
      data.codigo,
      new Id(data.equipoId),
      data.formatoId ? new Id(data.formatoId) : null,
      new Id(data.planActividadId),
      data.tipo,
      OrigenActividad.PROGRAMADO,
      NaturalezaIntervencionActividad.PREVENTIVA,
      data.modalidadPlanificada,
      null,
      data.fechaProgramada,
      null,
      null,
      null,
      null,
      null,
      EstadoActividad.PROGRAMADO,
      data.prioridad ?? null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [],
      new Date(),
      new Date()
    );

    registroAct.events.push(
      new ActividadScheduledEvent(data.equipoId, {
        codigo: data.codigo,
        tipo: data.tipo,
        naturaleza: NaturalezaIntervencionActividad.PREVENTIVA,
        planActividadId: data.planActividadId,
        modalidadPlanificada: data.modalidadPlanificada,
        fechaProgramada: data.fechaProgramada,
      })
    );

    return registroAct;
  }

  static createInmediato(
    codigo: string,
    equipoId: number,
    tipo: TipoActividad,
    origen: OrigenActividad,
    naturaleza: NaturalezaIntervencionActividad,
    fechaRealizacion: Date,
    prioridad: PrioridadActividad,
    solicitadoPorId: number,
    fechaInicio?: Date,
    fechaFinalizacion?: Date,
    tecnicoResponsableId?: number,
    observaciones?: string,
    costoManoObra?: number,
    costoRepuestos?: number
  ): RegistroActividad {
    if (origen === OrigenActividad.PROGRAMADO)
      throw new BadInputError('Use createProgramado para actividades programadas');

    RegistroActividad.validateFechasRealizacion(fechaRealizacion, fechaInicio, fechaFinalizacion);

    const duracion = RegistroActividad.calculateDuracionMinutos(fechaInicio, fechaFinalizacion);
    const costoTotal = RegistroActividad.calculateCostoTotal(costoManoObra, costoRepuestos);

    const registroAct = new RegistroActividad(
      new Id(),
      codigo,
      new Id(equipoId),
      null,
      null,
      tipo,
      origen,
      naturaleza,
      null,
      ModalidadEjecucionActividad.INTERNA,
      null,
      fechaRealizacion,
      duracion,
      fechaInicio ?? null,
      fechaFinalizacion ?? null,
      null,
      EstadoActividad.COMPLETADO,
      prioridad,
      observaciones ?? null,
      null,
      tecnicoResponsableId ?? null,
      solicitadoPorId,
      null,
      null,
      null,
      costoManoObra ?? null,
      costoRepuestos ?? null,
      costoTotal,
      [],
      new Date(),
      new Date()
    );

    registroAct.events.push(
      new ActividadInmediatedEvent(equipoId, { codigo, origen, fechaRealizacion })
    );
    return registroAct;
  }

  static rebuild(
    id: number,
    codigo: string,
    equipoId: number,
    formatoId: number | null,
    planActividadId: number | null,
    tipo: TipoActividad,
    origen: OrigenActividad,
    naturaleza: NaturalezaIntervencionActividad,
    modalidadPlanificada: ModalidadEjecucionActividad | null,
    modalidadEjecutada: ModalidadEjecucionActividad | null,
    fechaProgramada: Date | null,
    fechaRealizacion: Date | null,
    duracionMinutos: number | null,
    fechaInicio: Date | null,
    fechaFinalizacion: Date | null,
    diasDesviacion: number | null,
    estado: EstadoActividad,
    prioridad: PrioridadActividad | null,
    observaciones: string | null,
    motivoAnulacion: MotivoAnulacionActividad | null,
    tecnicoResponsableId: number | null,
    solicitadoPorId: number | null,
    aprobadoPorId: number | null,
    fechaAprobacion: Date | null,
    motivoRechazo: string | null,
    costoManoObra: number | null,
    costoRepuestos: number | null,
    costoTotal: number | null,
    reprogramaciones: ReprogramacionActividad[],
    createdAt: Date,
    updatedAt: Date
  ): RegistroActividad {
    return new RegistroActividad(
      new Id(id),
      codigo,
      new Id(equipoId),
      formatoId ? new Id(formatoId) : null,
      planActividadId ? new Id(planActividadId) : null,
      tipo,
      origen,
      naturaleza,
      modalidadPlanificada,
      modalidadEjecutada,
      fechaProgramada,
      fechaRealizacion,
      duracionMinutos,
      fechaInicio,
      fechaFinalizacion,
      diasDesviacion,
      estado,
      prioridad,
      observaciones,
      motivoAnulacion,
      tecnicoResponsableId,
      solicitadoPorId,
      aprobadoPorId,
      fechaAprobacion,
      motivoRechazo,
      costoManoObra,
      costoRepuestos,
      costoTotal,
      reprogramaciones,
      createdAt,
      updatedAt
    );
  }

  complete(data: {
    fechaRealizacion: Date;
    tecnicoResponsableId: number;
    realizadoPorExterno: boolean;
    fechaInicio?: Date;
    fechaFinalizacion?: Date;
    observaciones?: string;
    costoManoObra?: number;
    costoRepuestos?: number;
  }): void {
    this.ensureCanBeCompleted();
    RegistroActividad.validateFechasRealizacion(
      data.fechaRealizacion,
      data.fechaInicio,
      data.fechaFinalizacion
    );

    this.modalidadEjecutada = data.realizadoPorExterno
      ? ModalidadEjecucionActividad.EXTERNA
      : ModalidadEjecucionActividad.INTERNA;

    this.fechaRealizacion = data.fechaRealizacion;
    this.fechaInicio = data.fechaInicio ?? null;
    this.fechaFinalizacion = data.fechaFinalizacion ?? null;
    this.duracionMinutos = RegistroActividad.calculateDuracionMinutos(
      data.fechaInicio,
      data.fechaFinalizacion
    );
    this.diasDesviacion = RegistroActividad.calculateDiasDesviacion(
      this.fechaProgramada,
      data.fechaRealizacion
    );
    this.costoTotal = RegistroActividad.calculateCostoTotal(
      data.costoManoObra,
      data.costoRepuestos
    );
    this.estado = EstadoActividad.COMPLETADO;

    if (data.observaciones !== undefined) this.observaciones = data.observaciones;
    if (data.tecnicoResponsableId !== undefined)
      this.tecnicoResponsableId = data.tecnicoResponsableId;
    if (data.costoManoObra !== undefined) this.costoManoObra = data.costoManoObra;
    if (data.costoRepuestos !== undefined) this.costoRepuestos = data.costoRepuestos;

    const activa = this.reprogramaciones.find(r => r.isActiva());
    if (activa) {
      activa.deactivate();
      this.reprogramacionesActualizadas.push(activa);
    }

    this.updatedAt = new Date();
  }

  check(revisorId: number): void {
    if (this.estado !== EstadoActividad.COMPLETADO)
      throw new BadInputError(
        `Solo se pueden marcar como revisadas actividades completadas. Estado actual: ${this.estado}`
      );
    if (this.aprobadoPorId !== null) throw new BadInputError('Esta actividad ya fue revisada');

    this.aprobadoPorId = revisorId;
    this.fechaAprobacion = new Date();
    this.motivoRechazo = null;
    this.updatedAt = new Date();
  }

  reschedule(
    fechaReprogramada: Date,
    motivo: MotivoReprogramacionActividad,
    motivoDetalle: string
  ): void {
    if (this.estado === EstadoActividad.COMPLETADO)
      throw new BadInputError(`No se puede reprogramar una actividad ${this.estado}`);

    const fechaVigente = this.getFechaVigente();

    if (fechaReprogramada <= fechaVigente)
      throw new BadInputError('La nueva fecha debe ser posterior a la fecha vigente');

    this.reprogramaciones.forEach(reg => {
      if (reg.isActiva()) {
        reg.deactivate();
        this.reprogramacionesActualizadas.push(reg);
      }
    });

    const nuevaReprog = ReprogramacionActividad.create(
      this.planActividadId.getValor,
      this.equipoId.getValor,
      this.id.getValor,
      motivo,
      fechaVigente,
      fechaReprogramada,
      motivoDetalle
    );

    this.estado = EstadoActividad.REPROGRAMADO;
    this.reprogramacionesAgregadas.push(nuevaReprog);
    this.reprogramaciones.push(nuevaReprog);
    this.updatedAt = new Date();
  }

  cancel(motivoAnulacion: MotivoAnulacionActividad, observacion?: string): void {
    if (this.estado === EstadoActividad.COMPLETADO || this.estado === EstadoActividad.ANULADO) {
      throw new BadInputError(`No se puede anular una actividad en estado ${this.estado}`);
    }

    this.estado = EstadoActividad.ANULADO;
    this.motivoAnulacion = motivoAnulacion;
    if (observacion) {
      this.observaciones = observacion;
    }

    this.updatedAt = new Date();
  }

  private getFechaVigente(): Date {
    const activa = this.reprogramaciones.find(reg => reg.isActiva());
    return activa?.getFechaReprogramada ?? this.fechaProgramada;
  }

  updateFechaProgramada(nuevaFecha: Date): void {
    if (this.estado === EstadoActividad.COMPLETADO)
      throw new BadInputError('No se puede actualizar la fecha de un registro completado');
    this.fechaProgramada = nuevaFecha;
    this.updatedAt = new Date();
  }

  ensureCanBeCompleted(): void {
    const bloqueos: Partial<Record<EstadoActividad, string>> = {
      [EstadoActividad.COMPLETADO]: 'La actividad ya esta completada',
      [EstadoActividad.ANULADO]: 'No se puede completar una actividad anulada',
    };
    const msg = bloqueos[this.estado];
    if (msg) throw new BadInputError(msg);

    if (this.origen === OrigenActividad.PROGRAMADO && this.fechaProgramada) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const vigente = new Date(this.getFechaVigente());
      vigente.setHours(0, 0, 0, 0);
      const diasRestantes = Math.ceil((vigente.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      if (diasRestantes > 15)
        throw new BadInputError(
          'La actividad solo puede completarse con un máximo de 15 días de anticipación a la fecha programada'
        );
    }
  }

  private static validateFechasRealizacion(
    fechaRealizacion: Date,
    fechaInicio?: Date,
    fechaFinalizacion?: Date
  ) {
    const today = TimerServices.normalizeDate(new Date());
    if (TimerServices.normalizeDate(fechaRealizacion) > today)
      throw new BadInputError(`La fecha de realizacion no puede ser una fecha futura`);

    if (fechaInicio && fechaInicio !== undefined) {
      const result = TimerServices.isSameDay(fechaRealizacion, fechaInicio);
      if (!result)
        throw new BadInputError('la fecha de realizacion y fecha de inicio deben ser el mismo dia');

      if (fechaFinalizacion && fechaFinalizacion !== undefined) {
        if (fechaFinalizacion <= fechaInicio)
          throw new BadInputError(
            'La fecha de finalizacion no puede ser menor a la fecha de inicio'
          );
      }
    }
  }

  private static calculateDuracionMinutos(fechaInicio: Date, fechaFinalizacion: Date): number {
    if (!fechaInicio || !fechaFinalizacion) return null;
    fechaInicio = new Date(fechaInicio);
    fechaFinalizacion = new Date(fechaFinalizacion);
    if (fechaFinalizacion < fechaInicio) {
      throw new BadInputError('La fecha de finalización no puede ser menor a la fecha de inicio');
    }
    const difMs = fechaFinalizacion.getTime() - fechaInicio.getTime();
    return Math.ceil(difMs / 60000);
  }

  private static calculateCostoTotal(costoManoObra: number, costoRepuestos: number): number {
    if (costoManoObra < 0 || costoRepuestos < 0) {
      throw new BadInputError('Los costos no pueden ser negativos');
    }
    return costoManoObra + costoRepuestos;
  }

  private static calculateDiasDesviacion(fechaProgramada: Date, fechaRealizacion: Date): number {
    if (!fechaProgramada || !fechaRealizacion) return null;
    fechaProgramada = new Date(fechaProgramada);
    fechaRealizacion = new Date(fechaRealizacion);
    const difMs = fechaProgramada.getTime() - fechaRealizacion.getTime();
    return Math.round(difMs / (1000 * 60 * 60 * 24));
  }

  public pullReprogramacionesAgregadas(): ReprogramacionActividad[] {
    const out = [...this.reprogramacionesAgregadas];
    this.reprogramacionesAgregadas = [];
    return out;
  }

  public pullReprogramacionesActualizadas(): ReprogramacionActividad[] {
    const out = [...this.reprogramacionesActualizadas];
    this.reprogramacionesActualizadas = [];
    return out;
  }

  pullEvents(): DomainEquipoEvent[] {
    const _events = [...this.events];
    this.events = [];
    return _events;
  }

  get getId(): Id {
    return this.id;
  }
  get getCodigo(): string {
    return this.codigo;
  }
  get getEquipoId(): Id {
    return this.equipoId;
  }
  get getPlanActividadId(): Id | null {
    return this.planActividadId;
  }
  get getFormatoId(): Id | null {
    return this.formatoId;
  }
  get getTipoActividad(): TipoActividad {
    return this.tipo;
  }
  get getOrigen(): OrigenActividad {
    return this.origen;
  }
  get getNaturalezaIntervencion(): NaturalezaIntervencionActividad {
    return this.naturalezaIntervencion;
  }
  get getEstado(): EstadoActividad {
    return this.estado;
  }
  get getPrioridad(): PrioridadActividad | null {
    return this.prioridad;
  }
  get getModalidadPlanificada(): ModalidadEjecucionActividad | null {
    return this.modalidadPlanificada;
  }
  get getModalidadEjecutada(): ModalidadEjecucionActividad | null {
    return this.modalidadEjecutada;
  }
  get getFechaProgramada(): Date | null {
    return this.fechaProgramada;
  }
  get getFechaRealizacion(): Date | null {
    return this.fechaRealizacion;
  }
  get getFechaInicio(): Date | null {
    return this.fechaInicio;
  }
  get getFechaFinalizacion(): Date | null {
    return this.fechaFinalizacion;
  }
  get getDuracionMinutos(): number | null {
    return this.duracionMinutos;
  }
  get getDiasDesviacion(): number | null {
    return this.diasDesviacion;
  }
  get getTecnicoResponsableId(): number | null {
    return this.tecnicoResponsableId;
  }
  get getSolicitadoPorId(): number | null {
    return this.solicitadoPorId;
  }
  get getAprobadoPorId(): number | null {
    return this.aprobadoPorId;
  }
  get getFechaAprobacion(): Date | null {
    return this.fechaAprobacion;
  }
  get getMotivoRechazo(): string | null {
    return this.motivoRechazo;
  }
  get getObservaciones(): string | null {
    return this.observaciones;
  }
  get getMotivoAnulacion(): MotivoAnulacionActividad | null {
    return this.motivoAnulacion;
  }
  get getCostoManoObra(): number | null {
    return this.costoManoObra;
  }
  get getCostoRepuestos(): number | null {
    return this.costoRepuestos;
  }
  get getCostoTotal(): number | null {
    return this.costoTotal;
  }
  get getReprogramaciones(): ReprogramacionActividad[] {
    return this.reprogramaciones;
  }
  get getCreatedAt(): Date {
    return this.createdAt;
  }
  get getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
