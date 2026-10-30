import { BadInputError, ConflictError } from '@common/domain/errors';
import { Id } from '@common/domain/value-objects';
import { CausaCierreTurno, EstadoTurno, OrigenTurno } from '../enums';

export class TurnoFlota {
  private constructor(
    private readonly id: Id,
    private vehiculoId: Id,
    private responsableId: Id,
    private fechaInicio: Date,
    private fechaFin: Date | undefined,
    private estado: EstadoTurno,
    private origen: OrigenTurno,
    private causaCierre: CausaCierreTurno | undefined,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static createInicio(vehiculoId: number, responsableId: number): TurnoFlota {
    const now = new Date();
    return new TurnoFlota(
      new Id(),
      new Id(vehiculoId),
      new Id(responsableId),
      now,
      undefined,
      EstadoTurno.ACTIVO,
      OrigenTurno.INICIO,
      undefined,
      now,
      now,
    );
  }

  static createRecepcion(
    vehiculoId: number,
    responsableId: number,
    origen: OrigenTurno.RECEPCION | OrigenTurno.RECEPCION_EXCEPCIONAL,
  ): TurnoFlota {
    const now = new Date();
    return new TurnoFlota(
      new Id(),
      new Id(vehiculoId),
      new Id(responsableId),
      now,
      undefined,
      EstadoTurno.ACTIVO,
      origen,
      undefined,
      now,
      now,
    );
  }

  static rebuild(
    id: number,
    vehiculoId: number,
    responsableId: number,
    fechaInicio: Date,
    fechaFin: Date | undefined,
    estado: EstadoTurno,
    origen: OrigenTurno,
    causaCierre: CausaCierreTurno | undefined,
    createdAt: Date,
    updatedAt: Date,
  ): TurnoFlota {
    return new TurnoFlota(
      new Id(id),
      new Id(vehiculoId),
      new Id(responsableId),
      fechaInicio,
      fechaFin,
      estado,
      origen,
      causaCierre,
      createdAt,
      updatedAt,
    );
  }

  /** Un usuario no puede tener un segundo turno mientras tenga uno ACTIVO o ENTREGADO. */
  static assertSinTurnoVigente(turnoActual?: TurnoFlota | null, mensaje = 'Ya tienes un turno abierto'): void {
    if (turnoActual) throw new ConflictError(mensaje);
  }

  assertActivo(): void {
    if (this.estado !== EstadoTurno.ACTIVO) {
      throw new BadInputError('El turno no está activo');
    }
  }

  assertResponsable(usuarioId: number): void {
    if (this.responsableId.getValor !== usuarioId) {
      throw new BadInputError('Solo el responsable del turno puede realizar esta acción');
    }
  }

  marcarEntregado(): void {
    this.estado = EstadoTurno.ENTREGADO;
    this.updatedAt = new Date();
  }

  cerrar(causa: CausaCierreTurno): void {
    this.estado = EstadoTurno.CERRADO;
    this.causaCierre = causa;
    this.fechaFin = new Date();
    this.updatedAt = new Date();
  }

  transferir(nuevoResponsableId: number, now: Date): void {
    if (this.estado !== EstadoTurno.ACTIVO) {
      throw new BadInputError('Solo se transfiere un turno activo');
    }
    this.responsableId = new Id(nuevoResponsableId);
    this.updatedAt = now;
  }

  get getId(): Id { return this.id; }
  get getVehiculoId(): Id { return this.vehiculoId; }
  get getResponsableId(): Id { return this.responsableId; }
  get getFechaInicio(): Date { return this.fechaInicio; }
  get getFechaFin(): Date | undefined { return this.fechaFin; }
  get getEstado(): EstadoTurno { return this.estado; }
  get getOrigen(): OrigenTurno { return this.origen; }
  get getCausaCierre(): CausaCierreTurno | undefined { return this.causaCierre; }
  get getCreatedAt(): Date { return this.createdAt; }
  get getUpdatedAt(): Date { return this.updatedAt; }
}
