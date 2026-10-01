import { BadInputError } from '@common/domain/errors';

export interface FotoItem {
  archivoId: number;
  descripcion?: string;
  orden?: number;
  principal?: boolean;
  deleted?: boolean | null;
  deletedAt?: Date | null;
  deletedBy?: number | null;
}

export class RegistroFotografico {
  private constructor(
    private readonly fotos: FotoItem[],
  ) { }

  static create(items: FotoItem[] = []): RegistroFotografico {
    if (!items.length) {
      return new RegistroFotografico([]);
    }

    const activas = items.filter(f => !f.deleted);
    const eliminadas = items.filter(f => f.deleted);

    if (!activas.length) {
      return new RegistroFotografico([...eliminadas]);
    }

    const ids = activas.map(x => x.archivoId);
    if (new Set(ids).size !== ids.length) {
      throw new BadInputError(
        'El registro fotográfico contiene archivos duplicados. Cada archivo debe enviarse una sola vez.',
      );
    }

    const withOrden = activas.map((foto, index) => ({
      ...foto,
      orden: foto.orden ?? (index + 1),
    }));

    const ordenes = withOrden.map(x => x.orden);
    if (new Set(ordenes).size !== ordenes.length) {
      throw new BadInputError(
        'El registro fotográfico contiene posiciones repetidas. Cada fotografía debe tener un orden único.',
      );
    }

    const principales = withOrden.filter(f => f.principal);
    if (principales.length > 1) {
      throw new BadInputError(
        'Solo puede marcarse una fotografía como principal.',
      );
    }

    const ordenadas = [...withOrden].sort(
      (a, b) => (a.orden ?? 0) - (b.orden ?? 0),
    );

    const normalizadas = ordenadas.map((foto, index) => ({
      ...foto,
      orden: index + 1,
    }));

    if (!normalizadas.some(f => f.principal)) {
      normalizadas[0].principal = true;
    }

    return new RegistroFotografico([...normalizadas, ...eliminadas]);
  }

  static fromPrimitives(data?: FotoItem[] | null): RegistroFotografico {
    return RegistroFotografico.create(data ?? []);
  }

  toPrimitives(): FotoItem[] {
    return [...this.fotos];
  }

  getFotos(includeDeleted = false): FotoItem[] {
    return includeDeleted ? [...this.fotos] : this.fotos.filter(f => !f.deleted);
  }

  getArchivoIds(includeDeleted = false): number[] {
    return this.getFotos(includeDeleted).map(f => f.archivoId);
  }

  isEmpty(includeDeleted = false): boolean {
    return this.getFotos(includeDeleted).length === 0;
  }
}