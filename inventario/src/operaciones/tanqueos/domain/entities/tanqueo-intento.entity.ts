import { sanitizeIntentoPayload } from '@common/application/helpers';
import { BadInputError } from '@common/domain/errors';
import { Id } from '@common/domain/value-objects';
import { CanalRegistro } from '../enums';
import { EstadoIntentoTanqueo } from '../enums/estados.enum';

export class TanqueoIntento {
  private constructor(
    private readonly id: Id,
    private clienteUuid: string | null,
    private idempotencyKey: string | null,
    private usuarioId: Id,
    private dispositivoId: string | null,
    private canalRegistro: CanalRegistro | null,
    private operacion: string,
    private payload: string,
    private errorCodigo: string | null,
    private errorMensaje: string | null,
    private estado: EstadoIntentoTanqueo,
    private tanqueoId: Id | null,
    private resueltoPorId: Id | null,
    private fechaResolucion: Date | null,
    private fechaIntento: Date,
    private readonly createdAt: Date
  ) {}

  static createFailed(data: {
    usuarioId: number;
    operacion: string;
    payload: unknown;
    clienteUuid?: string | null;
    idempotencyKey?: string | null;
    dispositivoId?: string | null;
    canalRegistro?: CanalRegistro | null;
    errorCodigo?: string | null;
    errorMensaje?: string | null;
  }): TanqueoIntento {
    const now = new Date();
    return new TanqueoIntento(
      new Id(),
      data.clienteUuid ?? null,
      data.idempotencyKey ?? null,
      new Id(data.usuarioId),
      data.dispositivoId ?? null,
      data.canalRegistro ?? null,
      data.operacion,
      sanitizeIntentoPayload(data.payload),
      data.errorCodigo ?? null,
      data.errorMensaje ?? null,
      EstadoIntentoTanqueo.PENDIENTE,
      null,
      null,
      null,
      now,
      now
    );
  }

  static rebuild(
    id: number,
    clienteUuid: string | null,
    idempotencyKey: string | null,
    usuarioId: number,
    dispositivoId: string | null,
    canalRegistro: CanalRegistro | null,
    operacion: string,
    payload: string,
    errorCodigo: string | null,
    errorMensaje: string | null,
    estado: EstadoIntentoTanqueo,
    tanqueoId: number | null,
    resueltoPorId: number | null,
    fechaResolucion: Date | null,
    fechaIntento: Date,
    createdAt: Date
  ): TanqueoIntento {
    return new TanqueoIntento(
      new Id(id),
      clienteUuid,
      idempotencyKey,
      new Id(usuarioId),
      dispositivoId,
      canalRegistro,
      operacion,
      payload,
      errorCodigo,
      errorMensaje,
      estado,
      tanqueoId != null ? new Id(tanqueoId) : null,
      resueltoPorId != null ? new Id(resueltoPorId) : null,
      fechaResolucion,
      fechaIntento,
      createdAt
    );
  }

  markRecuperado(resueltoPorId: number, tanqueoId: number): void {
    this.assertPendiente();
    this.estado = EstadoIntentoTanqueo.RECUPERADO;
    this.tanqueoId = new Id(tanqueoId);
    this.resueltoPorId = new Id(resueltoPorId);
    this.fechaResolucion = new Date();
  }

  private assertPendiente(): void {
    if (this.estado !== EstadoIntentoTanqueo.PENDIENTE) {
      throw new BadInputError(`El intento no está PENDIENTE (estado: ${this.estado})`);
    }
  }

  get getId(): Id {
    return this.id;
  }
  get getClienteUuid(): string | null {
    return this.clienteUuid;
  }
  get getIdempotencyKey(): string | null {
    return this.idempotencyKey;
  }
  get getUsuarioId(): Id {
    return this.usuarioId;
  }
  get getDispositivoId(): string | null {
    return this.dispositivoId;
  }
  get getCanalRegistro(): CanalRegistro | null {
    return this.canalRegistro;
  }
  get getOperacion(): string {
    return this.operacion;
  }
  get getPayload(): string {
    return this.payload;
  }
  get getErrorCodigo(): string | null {
    return this.errorCodigo;
  }
  get getErrorMensaje(): string | null {
    return this.errorMensaje;
  }
  get getEstado(): EstadoIntentoTanqueo {
    return this.estado;
  }
  get getTanqueoId(): Id | null {
    return this.tanqueoId;
  }
  get getResueltoPorId(): Id | null {
    return this.resueltoPorId;
  }
  get getFechaResolucion(): Date | null {
    return this.fechaResolucion;
  }
  get getFechaIntento(): Date {
    return this.fechaIntento;
  }
  get getCreatedAt(): Date {
    return this.createdAt;
  }
}
