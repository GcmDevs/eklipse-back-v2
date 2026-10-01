import { Id } from "@common/domain/value-objects";
import { EstadoRegistroDilg } from "../../enums";
import { RegistroImagen } from "../../value-objects";

export class RegistroDiligenciadoFmt {
  private constructor(
    private readonly id: Id,
    private readonly versionFormatoId: Id,
    private readonly formatoId: Id,
    private readonly equipoId: Id,
    private readonly registroActividadId: Id | null,
    private readonly diligenciadoPorId: number,
    private datoSnapshot: Record<string, unknown>,
    private imagenes: RegistroImagen[],
    private estado: EstadoRegistroDilg,
    private readonly fechaEnvio: Date | null,
    private fechaCompletado: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) { }


  static create(data: {
    versionFormatoId: number;
    formatoId: number;
    equipoId: number;
    registroActividadId?: number;
    diligenciadoPorId: number;
    datoSnapshot: Record<string, unknown>;
    imagenes: RegistroImagen[];
    completarInmediato: boolean;
  }): RegistroDiligenciadoFmt {
    const estado = data.completarInmediato
      ? EstadoRegistroDilg.COMPLETADO
      : EstadoRegistroDilg.BORRADOR;

    const now = new Date();

    return new RegistroDiligenciadoFmt(
      new Id(),
      new Id(data.versionFormatoId),
      new Id(data.formatoId),
      new Id(data.equipoId),
      data.registroActividadId ? new Id(data.registroActividadId) : null,
      data.diligenciadoPorId,
      data.datoSnapshot,
      data.imagenes,
      estado,
      now,
      data.completarInmediato ? now : null,
      now,
      now,
    );
  }

  static rebuild(
    id: number,
    versionFormatoId: number,
    formatoId: number,
    equipoId: number,
    registroActividadId: number | null,
    diligenciadoPorId: number,
    datoSnapshot: Record<string, unknown>,
    imagenes: RegistroImagen[],
    estado: EstadoRegistroDilg,
    fechaEnvio: Date | null,
    fechaCompletado: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ): RegistroDiligenciadoFmt {
    return new RegistroDiligenciadoFmt(
      new Id(id),
      new Id(versionFormatoId),
      new Id(formatoId),
      new Id(equipoId),
      registroActividadId ? new Id(registroActividadId) : null,
      diligenciadoPorId,
      datoSnapshot,
      imagenes,
      estado,
      fechaEnvio,
      fechaCompletado,
      createdAt,
      updatedAt,
    );
  }

  updateBorrador(
    datoSnapshot: Record<string, unknown>,
    imagenes: RegistroImagen[],
  ): void {
    if (this.estado !== EstadoRegistroDilg.BORRADOR)
      throw new Error(
        `No se puede editar un registro en estado ${this.estado}`,
      );

    this.datoSnapshot = datoSnapshot;
    this.imagenes = imagenes;
    this.updatedAt = new Date();
  }

  complete(): void {
    if (this.estado !== EstadoRegistroDilg.BORRADOR)
      throw new Error(
        `Solo un borrador puede completarse. Estado actual: ${this.estado}`,
      );

    this.estado = EstadoRegistroDilg.COMPLETADO;
    this.fechaCompletado = new Date();
    this.updatedAt = new Date();
  }

  approve(): void {
    if (this.estado !== EstadoRegistroDilg.COMPLETADO)
      throw new Error(
        `Solo un registro completado puede aprobarse. Estado actual: ${this.estado}`,
      );

    this.estado = EstadoRegistroDilg.APROBADO;
    this.updatedAt = new Date();
  }

  annul(): void {
    if (this.estado === EstadoRegistroDilg.APROBADO)
      throw new Error(
        'No se puede anular un registro diligenciado ya aprobado. ' +
        'Contacte al supervisor para gestionar este caso.',
      );
    this.estado = EstadoRegistroDilg.ANULADO;
    this.updatedAt = new Date();
  }


  isAnulado(): boolean {
    return this.estado === EstadoRegistroDilg.ANULADO;
  }
  isBorrador(): boolean {
    return this.estado === EstadoRegistroDilg.BORRADOR;
  }

  isCompletado(): boolean {
    return this.estado === EstadoRegistroDilg.COMPLETADO;
  }

  isAprobado(): boolean {
    return this.estado === EstadoRegistroDilg.APROBADO;
  }

  get getId(): Id { return this.id; }
  get getVersionFormatoId(): Id { return this.versionFormatoId; }
  get getFormatoId(): Id { return this.formatoId; }
  get getEquipoId(): Id { return this.equipoId; }
  get getRegistroActividadId(): Id | null { return this.registroActividadId; }
  get getDiligenciadoPorId(): number { return this.diligenciadoPorId; }
  get getDatoSnapshot(): Record<string, unknown> { return this.datoSnapshot; }
  get getImagenes(): RegistroImagen[] { return this.imagenes; }
  get getEstado(): EstadoRegistroDilg { return this.estado; }
  get getFechaEnvio(): Date | null { return this.fechaEnvio; }
  get getFechaCompletado(): Date | null { return this.fechaCompletado; }
  get getCreatedAt(): Date { return this.createdAt; }
  get getUpdatedAt(): Date { return this.updatedAt; }
}