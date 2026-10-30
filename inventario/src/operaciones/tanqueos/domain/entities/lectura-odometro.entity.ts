import { BadInputError } from '@common/domain/errors';
import { Id, normalizeUppercaseText } from '@common/domain/value-objects';
import { FuenteLecturaOdometro } from '../enums';

export class LecturaOdometro {
  private constructor(
    private readonly id: Id,
    private readonly activoId: Id,
    private lectura: number,
    private fechaLectura: Date,
    private fuente: FuenteLecturaOdometro,
    private referenciaId: Id | null,
    private confiable: boolean,
    private usuarioId: Id,
    private observacion: string | null,
    private readonly createdAt: Date
  ) {}

  static create(data: {
    activoId: number;
    lectura: number;
    fechaLectura: Date;
    fuente: FuenteLecturaOdometro;
    usuarioId: number;
    confiable: boolean;
    referenciaId?: number | null;
    observacion?: string | null;
  }): LecturaOdometro {
    if (data.lectura < 0 || !Number.isInteger(data.lectura)) {
      throw new BadInputError('La lectura del odómetro debe ser un entero mayor o igual a cero');
    }
    if (data.fuente === FuenteLecturaOdometro.TANQUEO && data.referenciaId == null) {
      throw new BadInputError('Una lectura TANQUEO exige REFERENCIAOID del tanqueo');
    }
    if (data.fuente === FuenteLecturaOdometro.AJUSTE && !data.observacion?.trim()) {
      throw new BadInputError('Una lectura AJUSTE exige observación');
    }
    const now = new Date();
    return new LecturaOdometro(
      new Id(),
      new Id(data.activoId),
      data.lectura,
      data.fechaLectura,
      data.fuente,
      data.referenciaId != null ? new Id(data.referenciaId) : null,
      data.confiable,
      new Id(data.usuarioId),
      data.observacion ? normalizeUppercaseText(data.observacion) : null,
      now
    );
  }

  static rebuild(
    id: number,
    activoId: number,
    lectura: number,
    fechaLectura: Date,
    fuente: FuenteLecturaOdometro,
    referenciaId: number | null,
    confiable: boolean,
    usuarioId: number,
    observacion: string | null,
    createdAt: Date
  ): LecturaOdometro {
    return new LecturaOdometro(
      new Id(id),
      new Id(activoId),
      lectura,
      fechaLectura,
      fuente,
      referenciaId != null ? new Id(referenciaId) : null,
      confiable,
      new Id(usuarioId),
      observacion,
      createdAt
    );
  }

  markNoConfiable(): void {
    this.confiable = false;
  }

  get getId(): Id {
    return this.id;
  }
  get getActivoId(): Id {
    return this.activoId;
  }
  get getLectura(): number {
    return this.lectura;
  }
  get getFechaLectura(): Date {
    return this.fechaLectura;
  }
  get getFuente(): FuenteLecturaOdometro {
    return this.fuente;
  }
  get getReferenciaId(): Id | null {
    return this.referenciaId;
  }
  get getConfiable(): boolean {
    return this.confiable;
  }
  get getUsuarioId(): Id {
    return this.usuarioId;
  }
  get getObservacion(): string | null {
    return this.observacion;
  }
  get getCreatedAt(): Date {
    return this.createdAt;
  }
}

export function pickLatestConfiableLectura(
  lecturas: Array<{ confiable: boolean; fechaLectura: Date; id: number; lectura: number }>
): number | null {
  const confiables = lecturas
    .filter(l => l.confiable)
    .sort((a, b) => {
      const byFecha = b.fechaLectura.getTime() - a.fechaLectura.getTime();
      if (byFecha !== 0) return byFecha;
      return b.id - a.id;
    });
  return confiables[0]?.lectura ?? null;
}
