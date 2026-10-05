import { BadInputError } from '@common/domain/errors';
import { TimerServices, ensureDate } from '@common/application/services';
import { Id } from '@common/domain/value-objects';
import {
  EstadoPlanActividad,
  OrigenInicializacionPlan,
  TipoActividad,
  UnidadTiempo,
} from '@equipos/domain/enums';
import { PeriodoDeTiempo } from '@equipos/domain/value-objects';

export class PlanActividad {
  private constructor(
    private readonly id: Id,
    private tipo: TipoActividad,
    private equipoId: Id,
    private formatoId: Id,
    private estado: EstadoPlanActividad,
    private periodicidad: PeriodoDeTiempo,
    private seRealizaPorExterno: boolean,
    private fechaUltimaEjecucion: Date,
    private fechaProximaEjecucion: Date | null,
    private diasAnticipacionNotificacion: number,
    private origenInicializacion: OrigenInicializacionPlan,
    private fechaInicializacion: Date,
    private observaciones?: string
  ) {}

  static create(
    tipo: TipoActividad,
    formatoId: number,
    periocidad: PeriodoDeTiempo,
    fechaUltimaEjecucion: Date,
    seRealizaPorExterno?: boolean,
    diasAnticipacionNotificacion?: number,
    origenInicializacion?: OrigenInicializacionPlan,
    observaciones?: string
  ): PlanActividad {
    this.validateByTipo(tipo, { formatoId });

    const { origen, fechaBase } = this.buildOrigenInicializacion(
      origenInicializacion,
      fechaUltimaEjecucion
    );

    const fechaProximaEjecucion = this.calculateFechaProximaEjecucion(fechaBase, periocidad);
    const estado = this.calculateEstado(
      fechaUltimaEjecucion,
      periocidad,
      fechaProximaEjecucion,
      diasAnticipacionNotificacion
    );

    return new PlanActividad(
      new Id(),
      tipo,
      null,
      formatoId ? new Id(formatoId) : null,
      estado,
      periocidad,
      seRealizaPorExterno ?? false,
      fechaUltimaEjecucion,
      fechaProximaEjecucion,
      diasAnticipacionNotificacion ?? 30,
      origen,
      new Date(),
      observaciones
    );
  }

  static rebuild(
    id: number,
    tipo: TipoActividad,
    equipoId: number,
    formatoId: number,
    estado: EstadoPlanActividad,
    periodicidad: PeriodoDeTiempo,
    seRealizaPorExterno: boolean | undefined,
    fechaUltimaEjecucion: Date,
    fechaProximaEjecucion: Date | null,
    diasAnticipacionNotificacion: number,
    origenInicializacion: OrigenInicializacionPlan,
    fechaInicializacion: Date,
    observaciones?: string
  ): PlanActividad {
    return new PlanActividad(
      new Id(id),
      tipo,
      new Id(equipoId),
      new Id(formatoId),
      estado,
      periodicidad,
      seRealizaPorExterno,
      ensureDate(fechaUltimaEjecucion),
      ensureDate(fechaProximaEjecucion),
      diasAnticipacionNotificacion,
      origenInicializacion,
      ensureDate(fechaInicializacion),
      observaciones
    );
  }

  private static calculateFechaProximaEjecucion(
    fechaUltimaEjecucion: Date,
    periodicidad: PeriodoDeTiempo
  ): Date | null {
    if (periodicidad?.getValor == null || periodicidad?.getUnidad == null) return null;

    const today = TimerServices.normalizeDate(new Date());

    if (fechaUltimaEjecucion && TimerServices.normalizeDate(fechaUltimaEjecucion) > today) {
      throw new BadInputError('La fecha de la ultima ejecucion no puede ser futura');
    }

    const fechaBase = TimerServices.normalizeDate(fechaUltimaEjecucion ?? today);

    const fechaProx = new Date(fechaBase);

    switch (periodicidad.getUnidad) {
      case UnidadTiempo.SEMANAS:
        fechaProx.setDate(fechaProx.getDate() + periodicidad.getValor * 7);
        break;

      case UnidadTiempo.MESES:
        fechaProx.setMonth(fechaProx.getMonth() + periodicidad.getValor);
        break;

      case UnidadTiempo.ANIOS:
        fechaProx.setFullYear(fechaProx.getFullYear() + periodicidad.getValor);
        break;

      default:
        throw new BadInputError('Unidad de tiempo inválida');
    }

    return fechaProx;
  }

  private static calculateEstado(
    fechaUltimaEjecucion: Date,
    periodicidad: PeriodoDeTiempo,
    fechaProximaEjecucion?: Date,
    diasAnticipacionNotificacion?: number
  ): EstadoPlanActividad {
    if (!fechaUltimaEjecucion || !periodicidad?.getValor) {
      return EstadoPlanActividad.SIN_CONFIGURAR;
    }

    if (!fechaProximaEjecucion) {
      return EstadoPlanActividad.SIN_CONFIGURAR;
    }

    const today = TimerServices.normalizeDate(new Date());
    const fechaProx = TimerServices.normalizeDate(fechaProximaEjecucion);

    if (fechaProx < today) {
      return EstadoPlanActividad.VENCIDO;
    }

    if (diasAnticipacionNotificacion > 0) {
      const fechaAviso = new Date(fechaProx);
      fechaAviso.setDate(fechaAviso.getDate() - diasAnticipacionNotificacion);

      if (today >= fechaAviso && today <= fechaProx) {
        return EstadoPlanActividad.PROXIMO_A_VENCER;
      }
    }

    return EstadoPlanActividad.AL_DIA;
  }

  private updateFechaProximaEjecucion(): void {
    this.fechaProximaEjecucion = PlanActividad.calculateFechaProximaEjecucion(
      this.fechaUltimaEjecucion,
      this.periodicidad
    );
  }

  get getId(): Id {
    return this.id;
  }
  get getTipo(): TipoActividad {
    return this.tipo;
  }
  get getEquipoId(): Id {
    return this.equipoId;
  }
  get getFormatoId(): Id {
    return this.formatoId;
  }
  get getEstado(): EstadoPlanActividad {
    return this.estado;
  }
  get getPeriocidad(): PeriodoDeTiempo {
    return this.periodicidad;
  }
  get getFechaUltimaEjecucion(): Date {
    return this.fechaUltimaEjecucion;
  }
  get getFechaProximaEjecucion(): Date {
    return this.fechaProximaEjecucion;
  }
  get getOrigenInicializacion(): OrigenInicializacionPlan {
    return this.origenInicializacion;
  }
  get getFechaInicializacion(): Date {
    return this.fechaInicializacion;
  }
  get getSeRealizaPorExterno(): boolean {
    return this.seRealizaPorExterno;
  }
  get getdiasAnticipacionNotificacion(): number {
    return this.diasAnticipacionNotificacion;
  }
  get getObservaciones(): string | undefined {
    return this.observaciones;
  }

  update(data: {
    formatoId?: number;
    seRealizaPorExterno?: boolean;
    periocidad?: PeriodoDeTiempo | null;
    fechaUltimaEjecucion?: Date | null;
    origenInicializacion?: OrigenInicializacionPlan;
    diasAnticipacionNotificacion?: number | null;
    observaciones?: string;
  }): void {
    const changePeriodicidad = data.periocidad?.getValor !== undefined && data.periocidad !== null;

    const changeFecha =
      data.fechaUltimaEjecucion !== undefined && data.fechaUltimaEjecucion !== null;

    const changeOrigen = data.origenInicializacion !== null;

    const changeDias =
      data.diasAnticipacionNotificacion !== undefined && data.diasAnticipacionNotificacion !== null;

    if (changePeriodicidad) {
      this.periodicidad = data.periocidad;
    }

    if (changeFecha) {
      this.fechaUltimaEjecucion = data.fechaUltimaEjecucion;
    }

    if (changeDias) {
      this.diasAnticipacionNotificacion = data.diasAnticipacionNotificacion;
    }

    if (data?.observaciones) {
      this.observaciones = data.observaciones;
    }

    if (data.seRealizaPorExterno !== undefined) {
      this.seRealizaPorExterno = data.seRealizaPorExterno;
    }

    if (data.formatoId !== undefined) {
      this.formatoId = data.formatoId !== null ? new Id(data.formatoId) : null;
    }

    if (changeOrigen) {
      const fechaUltimaEjecucion = data?.fechaUltimaEjecucion ?? this.fechaUltimaEjecucion;
      const { origen, fechaBase } = PlanActividad.buildOrigenInicializacion(
        data.origenInicializacion,
        fechaUltimaEjecucion ?? undefined
      );
      this.origenInicializacion = origen;
      this.fechaInicializacion = fechaBase;
    }

    if (changePeriodicidad || changeFecha || changeDias) {
      this.updateFechaProximaEjecucion();

      this.estado = PlanActividad.calculateEstado(
        this.fechaUltimaEjecucion,
        this.periodicidad,
        this.fechaProximaEjecucion,
        this.diasAnticipacionNotificacion
      );
    }
  }

  public updateAfterEjecucion(fechaUltimaEjecucion: Date): void {
    const fechaProx = PlanActividad.calculateFechaProximaEjecucion(
      fechaUltimaEjecucion,
      this.periodicidad
    );

    const estado = PlanActividad.calculateEstado(
      fechaUltimaEjecucion,
      this.periodicidad,
      fechaProx,
      this.diasAnticipacionNotificacion
    );

    this.fechaUltimaEjecucion = fechaUltimaEjecucion;
    this.fechaProximaEjecucion = fechaProx;
    this.estado = estado;
  }

  public deactivate(): void {
    this.estado = EstadoPlanActividad.INACTIVO;
  }

  private static buildOrigenInicializacion(
    origenInicializacion?: OrigenInicializacionPlan,
    fechaUltimaEjecucion?: Date
  ): { origen: OrigenInicializacionPlan; fechaBase: Date } {
    const origen =
      origenInicializacion ??
      (fechaUltimaEjecucion ? OrigenInicializacionPlan.HISTORIAL : OrigenInicializacionPlan.NUEVO);
    const fechaBase = fechaUltimaEjecucion ?? TimerServices.normalizeDate(new Date());

    if (origen === OrigenInicializacionPlan.RESET && fechaUltimaEjecucion) {
      throw new BadInputError('RESET no debe tener fechaUltimaEjecucion');
    }
    if (origen === OrigenInicializacionPlan.HISTORIAL && !fechaUltimaEjecucion) {
      throw new BadInputError('HISTORIAL requiere fechaUltimaEjecucion');
    }

    return { origen, fechaBase };
  }

  private static validateByTipo(tipo: TipoActividad, data: { formatoId?: number }) {
    switch (tipo) {
      case TipoActividad.MANTENIMIENTO:
        break;
      case TipoActividad.CALIBRACION:
        if (tipo === TipoActividad.CALIBRACION && data?.formatoId)
          throw new BadInputError(`No se le puede asignar formato a un plan de calibracion`);
        break;
    }
  }
}
