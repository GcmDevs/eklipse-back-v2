import { Id, normalizeUppercaseText } from '@common/domain/value-objects';
import { AccionEvidenciaLog, TipoEvidencia } from '../enums';

export class TanqueoEvidenciaLog {
  private constructor(
    private readonly id: Id,
    private tanqueoId: Id | null,
    private abastecimientoId: Id | null,
    private tipoEvidencia: TipoEvidencia,
    private accion: AccionEvidenciaLog,
    private mediaAnteriorId: Id | null,
    private mediaNuevoId: Id | null,
    private tipoDestino: TipoEvidencia | null,
    private motivo: string | null,
    private usuarioId: Id,
    private readonly createdAt: Date
  ) {}

  static create(data: {
    usuarioId: number;
    tipoEvidencia: TipoEvidencia;
    accion: AccionEvidenciaLog;
    tanqueoId?: number | null;
    abastecimientoId?: number | null;
    mediaAnteriorId?: number | null;
    mediaNuevoId?: number | null;
    tipoDestino?: TipoEvidencia | null;
    motivo?: string | null;
  }): TanqueoEvidenciaLog {
    const hasTanqueo = data.tanqueoId != null;
    const hasAbast = data.abastecimientoId != null;
    if (hasTanqueo === hasAbast) {
      throw new Error('El log de evidencia debe pertenecer a un tanqueo o a un abastecimiento');
    }
    return new TanqueoEvidenciaLog(
      new Id(),
      data.tanqueoId != null ? new Id(data.tanqueoId) : null,
      data.abastecimientoId != null ? new Id(data.abastecimientoId) : null,
      data.tipoEvidencia,
      data.accion,
      data.mediaAnteriorId != null ? new Id(data.mediaAnteriorId) : null,
      data.mediaNuevoId != null ? new Id(data.mediaNuevoId) : null,
      data.tipoDestino ?? null,
      data.motivo ? normalizeUppercaseText(data.motivo) : null,
      new Id(data.usuarioId),
      new Date()
    );
  }

  static rebuild(
    id: number,
    tanqueoId: number | null,
    abastecimientoId: number | null,
    tipoEvidencia: TipoEvidencia,
    accion: AccionEvidenciaLog,
    mediaAnteriorId: number | null,
    mediaNuevoId: number | null,
    tipoDestino: TipoEvidencia | null,
    motivo: string | null,
    usuarioId: number,
    createdAt: Date
  ): TanqueoEvidenciaLog {
    return new TanqueoEvidenciaLog(
      new Id(id),
      tanqueoId != null ? new Id(tanqueoId) : null,
      abastecimientoId != null ? new Id(abastecimientoId) : null,
      tipoEvidencia,
      accion,
      mediaAnteriorId != null ? new Id(mediaAnteriorId) : null,
      mediaNuevoId != null ? new Id(mediaNuevoId) : null,
      tipoDestino,
      motivo,
      new Id(usuarioId),
      createdAt
    );
  }

  get getId(): Id {
    return this.id;
  }
  get getTanqueoId(): Id | null {
    return this.tanqueoId;
  }
  get getAbastecimientoId(): Id | null {
    return this.abastecimientoId;
  }
  get getTipoEvidencia(): TipoEvidencia {
    return this.tipoEvidencia;
  }
  get getAccion(): AccionEvidenciaLog {
    return this.accion;
  }
  get getMediaAnteriorId(): Id | null {
    return this.mediaAnteriorId;
  }
  get getMediaNuevoId(): Id | null {
    return this.mediaNuevoId;
  }
  get getTipoDestino(): TipoEvidencia | null {
    return this.tipoDestino;
  }
  get getMotivo(): string | null {
    return this.motivo;
  }
  get getUsuarioId(): Id {
    return this.usuarioId;
  }
  get getCreatedAt(): Date {
    return this.createdAt;
  }
}
