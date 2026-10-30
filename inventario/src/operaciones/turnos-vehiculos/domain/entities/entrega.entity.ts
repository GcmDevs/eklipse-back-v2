import { BadInputError } from '@common/domain/errors';
import { Id } from '@common/domain/value-objects';
import {
  calcCierreAutomaticoEn,
  calcHabilitaExcepcionalEn,
  calcLimiteInicioRecepcion,
  isBeforeDeadline,
  isPastDeadline,
} from '../policies/entrega-deadlines.policy';
import { CausaCierreEntrega, EstadoEntrega } from '../enums';

export class EntregaFlota {
  private constructor(
    private readonly id: Id,
    private vehiculoId: Id,
    private turnoSalienteId: Id,
    private turnoEntranteId: Id | undefined,
    private plantillaId: Id,
    private estado: EstadoEntrega,
    private causaCierre: CausaCierreEntrega | undefined,
    private fechaEntrega: Date | undefined,
    private limiteInicioRecepcion: Date | undefined,
    private habilitaExcepcionalEn: Date,
    private cierreAutomaticoEn: Date,
    private fechaCierre: Date | undefined,
    private lanzadaPorId: Id | undefined,
    private extendido: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static createAbierta(
    vehiculoId: number,
    turnoSalienteId: number,
    plantillaId: number,
    turnoInicio: Date,
  ): EntregaFlota {
    const now = new Date();
    return new EntregaFlota(
      new Id(),
      new Id(vehiculoId),
      new Id(turnoSalienteId),
      undefined,
      new Id(plantillaId),
      EstadoEntrega.ABIERTA,
      undefined,
      undefined,
      undefined,
      calcHabilitaExcepcionalEn(turnoInicio),
      calcCierreAutomaticoEn(turnoInicio),
      undefined,
      undefined,
      false,
      now,
      now,
    );
  }

  static rebuild(
    id: number,
    vehiculoId: number,
    turnoSalienteId: number,
    turnoEntranteId: number | undefined,
    plantillaId: number,
    estado: EstadoEntrega,
    causaCierre: CausaCierreEntrega | undefined,
    fechaEntrega: Date | undefined,
    limiteInicioRecepcion: Date | undefined,
    habilitaExcepcionalEn: Date,
    cierreAutomaticoEn: Date,
    fechaCierre: Date | undefined,
    createdAt: Date,
    updatedAt: Date,
    lanzadaPorId?: number,
    extendido = false,
  ): EntregaFlota {
    return new EntregaFlota(
      new Id(id),
      new Id(vehiculoId),
      new Id(turnoSalienteId),
      turnoEntranteId ? new Id(turnoEntranteId) : undefined,
      new Id(plantillaId),
      estado,
      causaCierre,
      fechaEntrega,
      limiteInicioRecepcion,
      habilitaExcepcionalEn,
      cierreAutomaticoEn,
      fechaCierre,
      lanzadaPorId ? new Id(lanzadaPorId) : undefined,
      extendido,
      createdAt,
      updatedAt,
    );
  }

  assertAbierta(): void {
    if (this.estado !== EstadoEntrega.ABIERTA) {
      throw new BadInputError('El proceso de entrega no está abierto');
    }
  }

  lanzarEntrega(now: Date, lanzadaPorId?: number): void {
    this.assertAbierta();
    if (isPastDeadline(now, this.cierreAutomaticoEn)) {
      throw new BadInputError('El plazo para lanzar la entrega ha vencido');
    }
    this.fechaEntrega = now;
    this.limiteInicioRecepcion = calcLimiteInicioRecepcion(now);
    if (lanzadaPorId) this.lanzadaPorId = new Id(lanzadaPorId);
    this.updatedAt = now;
  }

  puedeRecibirNormal(now: Date): boolean {
    return (
      this.estado === EstadoEntrega.ABIERTA &&
      !!this.fechaEntrega &&
      !this.turnoEntranteId &&
      !!this.limiteInicioRecepcion &&
      isBeforeDeadline(now, this.limiteInicioRecepcion)
    );
  }

  puedeRecibirExcepcional(now: Date): boolean {
    return (
      this.estado === EstadoEntrega.ABIERTA &&
      !this.fechaEntrega &&
      !this.turnoEntranteId &&
      now.getTime() >= this.habilitaExcepcionalEn.getTime() &&
      isBeforeDeadline(now, this.cierreAutomaticoEn)
    );
  }

  vincularTurnoEntrante(turnoEntranteId: number): void {
    this.turnoEntranteId = new Id(turnoEntranteId);
    this.updatedAt = new Date();
  }

  cerrar(causa: CausaCierreEntrega, now: Date = new Date()): void {
    if (this.estado === EstadoEntrega.CERRADA) return;
    this.estado = EstadoEntrega.CERRADA;
    this.causaCierre = causa;
    this.fechaCierre = now;
    this.updatedAt = now;
  }

  get getId(): Id { return this.id; }
  get getVehiculoId(): Id { return this.vehiculoId; }
  get getTurnoSalienteId(): Id { return this.turnoSalienteId; }
  get getTurnoEntranteId(): Id | undefined { return this.turnoEntranteId; }
  get getPlantillaId(): Id { return this.plantillaId; }
  get getEstado(): EstadoEntrega { return this.estado; }
  get getCausaCierre(): CausaCierreEntrega | undefined { return this.causaCierre; }
  get getFechaEntrega(): Date | undefined { return this.fechaEntrega; }
  get getLimiteInicioRecepcion(): Date | undefined { return this.limiteInicioRecepcion; }
  get getHabilitaExcepcionalEn(): Date { return this.habilitaExcepcionalEn; }
  get getCierreAutomaticoEn(): Date { return this.cierreAutomaticoEn; }
  get getFechaCierre(): Date | undefined { return this.fechaCierre; }
  get getCreatedAt(): Date { return this.createdAt; }
  get getUpdatedAt(): Date { return this.updatedAt; }
  get getLanzadaPorId(): Id | undefined { return this.lanzadaPorId; }
  get getExtendido(): boolean { return this.extendido; }

  extenderPlazo(minutos: number, now: Date): Date {
    if (this.extendido) throw new BadInputError('El plazo ya fue extendido una vez');
    const vigente = this.limiteInicioRecepcion ?? this.cierreAutomaticoEn;
    if (now.getTime() >= vigente.getTime()) {
      throw new BadInputError('No se puede extender un plazo ya vencido');
    }
    if (this.limiteInicioRecepcion) {
      this.limiteInicioRecepcion = new Date(this.limiteInicioRecepcion.getTime() + minutos * 60_000);
      this.extendido = true;
      this.updatedAt = now;
      return this.limiteInicioRecepcion;
    }
    this.cierreAutomaticoEn = new Date(this.cierreAutomaticoEn.getTime() + minutos * 60_000);
    this.habilitaExcepcionalEn = new Date(this.habilitaExcepcionalEn.getTime() + minutos * 60_000);
    this.extendido = true;
    this.updatedAt = now;
    return this.cierreAutomaticoEn;
  }
}
