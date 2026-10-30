import { BadInputError } from '@common/domain/errors';
import { Id } from '@common/domain/value-objects';
import { EstadoNovedadDotacion } from '../enums';

export class DotacionNovedad {
  private constructor(
    private readonly id: Id,
    private dotacionId: Id,
    private itemKey: string,
    private estado: EstadoNovedadDotacion,
    private cantidadEsperada: number | undefined,
    private cantidadEncontrada: number | undefined,
    private diferencia: number | undefined,
    private fechaVencRegistrada: string | undefined,
    private fechaVencObservada: string | undefined,
    private observacion: string,
    private resueltaPorId: Id | undefined,
    private fechaResolucion: Date | undefined,
    private observacionResolucion: string | undefined,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static createAbierta(
    dotacionId: number,
    itemKey: string,
    data: {
      cantidadEsperada?: number;
      cantidadEncontrada?: number;
      fechaVencRegistrada?: string;
      fechaVencObservada?: string;
      observacion: string;
    },
  ): DotacionNovedad {
    const now = new Date();
    const diff =
      data.cantidadEncontrada !== undefined && data.cantidadEsperada !== undefined
        ? data.cantidadEncontrada - data.cantidadEsperada
        : undefined;
    return new DotacionNovedad(
      new Id(),
      new Id(dotacionId),
      itemKey,
      EstadoNovedadDotacion.ABIERTA,
      data.cantidadEsperada,
      data.cantidadEncontrada,
      diff,
      data.fechaVencRegistrada,
      data.fechaVencObservada,
      data.observacion,
      undefined,
      undefined,
      undefined,
      now,
      now,
    );
  }

  static rebuild(
    id: number,
    dotacionId: number,
    itemKey: string,
    estado: EstadoNovedadDotacion,
    cantidadEsperada: number | undefined,
    cantidadEncontrada: number | undefined,
    diferencia: number | undefined,
    fechaVencRegistrada: string | undefined,
    fechaVencObservada: string | undefined,
    observacion: string,
    resueltaPorId: number | undefined,
    fechaResolucion: Date | undefined,
    observacionResolucion: string | undefined,
    createdAt: Date,
    updatedAt: Date,
  ): DotacionNovedad {
    return new DotacionNovedad(
      new Id(id),
      new Id(dotacionId),
      itemKey,
      estado,
      cantidadEsperada,
      cantidadEncontrada,
      diferencia,
      fechaVencRegistrada,
      fechaVencObservada,
      observacion,
      resueltaPorId ? new Id(resueltaPorId) : undefined,
      fechaResolucion,
      observacionResolucion,
      createdAt,
      updatedAt,
    );
  }

  resolver(usuarioId: number, observacionResolucion: string, now: Date): void {
    if (this.estado === EstadoNovedadDotacion.RESUELTA) {
      throw new BadInputError('La novedad ya está resuelta');
    }
    if (!observacionResolucion?.trim()) {
      throw new BadInputError('La observación de resolución es obligatoria');
    }
    this.estado = EstadoNovedadDotacion.RESUELTA;
    this.resueltaPorId = new Id(usuarioId);
    this.fechaResolucion = now;
    this.observacionResolucion = observacionResolucion;
    this.updatedAt = now;
  }

  invalidar(now: Date): void {
    if (this.estado !== EstadoNovedadDotacion.ABIERTA) return;
    this.estado = EstadoNovedadDotacion.INVALIDADA;
    this.updatedAt = now;
  }

  reabrir(now: Date): void {
    if (this.estado !== EstadoNovedadDotacion.INVALIDADA) return;
    this.estado = EstadoNovedadDotacion.ABIERTA;
    this.updatedAt = now;
  }

  get getId(): Id { return this.id; }
  get getDotacionId(): Id { return this.dotacionId; }
  get getItemKey(): string { return this.itemKey; }
  get getEstado(): EstadoNovedadDotacion { return this.estado; }
  get getCantidadEsperada(): number | undefined { return this.cantidadEsperada; }
  get getCantidadEncontrada(): number | undefined { return this.cantidadEncontrada; }
  get getDiferencia(): number | undefined { return this.diferencia; }
  get getFechaVencRegistrada(): string | undefined { return this.fechaVencRegistrada; }
  get getFechaVencObservada(): string | undefined { return this.fechaVencObservada; }
  get getObservacion(): string { return this.observacion; }
  get getResueltaPorId(): Id | undefined { return this.resueltaPorId; }
  get getFechaResolucion(): Date | undefined { return this.fechaResolucion; }
  get getObservacionResolucion(): string | undefined { return this.observacionResolucion; }
  get getCreatedAt(): Date { return this.createdAt; }
  get getUpdatedAt(): Date { return this.updatedAt; }
}
