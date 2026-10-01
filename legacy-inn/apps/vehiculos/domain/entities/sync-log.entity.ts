import { BadInputError } from '@common/domain/errors';
import { Id, normalizeUppercaseText } from '@common/domain/value-objects';
import { ResultadoSync } from '../enums';

export class SyncLog {
  private constructor(
    private readonly id: Id,
    private readonly clienteUuid: string,
    private readonly tanqueoId: Id | null,
    private readonly usuarioId: Id,
    private readonly dispositivoId: string,
    private readonly operacion: string,
    private resultado: ResultadoSync,
    private detalles: string | null,
    private errorMensaje: string | null,
    private duracionMs: number | null,
    private readonly createdAt: Date
  ) {}

  static create(
    clienteUuid: string,
    tanqueoId: number | null,
    usuarioId: number,
    dispositivoId: string,
    resultado: ResultadoSync,
    detalles?: string | null,
    errorMensaje?: string | null,
    duracionMs?: number | null
  ): SyncLog {
    if (!dispositivoId || dispositivoId.trim().length === 0) {
      throw new BadInputError('El dispositivoId es requerido');
    }

    return new SyncLog(
      new Id(),
      clienteUuid,
      tanqueoId != null ? new Id(tanqueoId) : null,
      new Id(usuarioId),
      dispositivoId,
      'SINCRONIZAR_LOTE_TANQUEO', // fijo por ahora; si mañana logueas otros casos de uso, esto pasa a parámetro
      resultado,
      detalles ? normalizeUppercaseText(detalles) : null,
      errorMensaje ? normalizeUppercaseText(errorMensaje) : null,
      duracionMs ?? null,
      new Date()
    );
  }

  static rebuild(
    id: number,
    clienteUuid: string,
    tanqueoId: number | null,
    usuarioId: number,
    dispositivoId: string,
    operacion: string,
    resultado: ResultadoSync,
    detalles: string | null,
    errorMensaje: string | null,
    duracionMs: number | null,
    createdAt: Date
  ): SyncLog {
    return new SyncLog(
      new Id(id),
      clienteUuid,
      tanqueoId != null ? new Id(tanqueoId) : null,
      new Id(usuarioId),
      dispositivoId,
      operacion,
      resultado,
      detalles,
      errorMensaje,
      duracionMs,
      createdAt
    );
  }

  isExitoso(): boolean {
    return this.resultado === ResultadoSync.OK;
  }
  isDuplicado(): boolean {
    return this.resultado === ResultadoSync.DUPLICADO;
  }
  isError(): boolean {
    return this.resultado === ResultadoSync.ERROR;
  }

  get getId(): Id {
    return this.id;
  }
  get getClienteUuid(): string {
    return this.clienteUuid;
  }
  get getTanqueoId(): Id | null {
    return this.tanqueoId;
  }
  get getUsuarioId(): Id {
    return this.usuarioId;
  }
  get getDispositivoId(): string {
    return this.dispositivoId;
  }
  get getOperacion(): string {
    return this.operacion;
  }
  get getResultado(): ResultadoSync {
    return this.resultado;
  }
  get getDetalles(): string | null {
    return this.detalles;
  }
  get getErrorMensaje(): string | null {
    return this.errorMensaje;
  }
  get getDuracionMs(): number | null {
    return this.duracionMs;
  }
  get getCreatedAt(): Date {
    return this.createdAt;
  }
}
