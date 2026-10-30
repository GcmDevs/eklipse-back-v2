import { Id, normalizeUppercaseText } from '@common/domain/value-objects';
import { EstadoOdometro, TipoEventoTanqueoLog } from '../enums';

export class TanqueoEventoLog {
  private constructor(
    private readonly id: Id,
    private readonly tipoEvento: TipoEventoTanqueoLog,
    private readonly activoId: Id | null,
    private readonly cantidad: number | null,
    private readonly estadoAnterior: string | null,
    private readonly estadoNuevo: string | null,
    private readonly observacion: string | null,
    private readonly usuarioId: Id,
    private readonly createdAt: Date
  ) {}

  static createLimpiezaIntentos(usuarioId: number, cantidad: number, observacion?: string): TanqueoEventoLog {
    return new TanqueoEventoLog(
      new Id(),
      TipoEventoTanqueoLog.LIMPIEZA_INTENTOS,
      null,
      cantidad,
      null,
      null,
      observacion ? normalizeUppercaseText(observacion) : null,
      new Id(usuarioId),
      new Date()
    );
  }

  static createCambioEstadoOdometro(input: {
    activoId: number;
    usuarioId: number;
    estadoAnterior: EstadoOdometro;
    estadoNuevo: EstadoOdometro;
    observacion?: string | null;
  }): TanqueoEventoLog {
    return new TanqueoEventoLog(
      new Id(),
      TipoEventoTanqueoLog.CAMBIO_ESTADO_ODOMETRO,
      new Id(input.activoId),
      null,
      input.estadoAnterior,
      input.estadoNuevo,
      input.observacion ? normalizeUppercaseText(input.observacion) : null,
      new Id(input.usuarioId),
      new Date()
    );
  }

  static createAjusteOdometro(input: {
    activoId: number;
    usuarioId: number;
    observacion: string;
  }): TanqueoEventoLog {
    return new TanqueoEventoLog(
      new Id(),
      TipoEventoTanqueoLog.AJUSTE_ODOMETRO,
      new Id(input.activoId),
      null,
      null,
      null,
      normalizeUppercaseText(input.observacion),
      new Id(input.usuarioId),
      new Date()
    );
  }

  static rebuild(
    id: number,
    tipoEvento: TipoEventoTanqueoLog,
    activoId: number | null,
    cantidad: number | null,
    estadoAnterior: string | null,
    estadoNuevo: string | null,
    observacion: string | null,
    usuarioId: number,
    createdAt: Date
  ): TanqueoEventoLog {
    return new TanqueoEventoLog(
      new Id(id),
      tipoEvento,
      activoId != null ? new Id(activoId) : null,
      cantidad,
      estadoAnterior,
      estadoNuevo,
      observacion,
      new Id(usuarioId),
      createdAt
    );
  }

  get getId(): Id {
    return this.id;
  }
  get getTipoEvento(): TipoEventoTanqueoLog {
    return this.tipoEvento;
  }
  get getActivoId(): Id | null {
    return this.activoId;
  }
  get getCantidad(): number | null {
    return this.cantidad;
  }
  get getEstadoAnterior(): string | null {
    return this.estadoAnterior;
  }
  get getEstadoNuevo(): string | null {
    return this.estadoNuevo;
  }
  get getObservacion(): string | null {
    return this.observacion;
  }
  get getUsuarioId(): Id {
    return this.usuarioId;
  }
  get getCreatedAt(): Date {
    return this.createdAt;
  }
}
