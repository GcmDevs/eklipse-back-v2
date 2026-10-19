import { CodigoInconsistencia, SeveridadInconsistencia, TipoEvidencia } from '../enums';
import { mapEvidenceTypeToPersistence } from '../helpers/evidencias-tipo.helper';
import { EstadoEvidencia } from '../enums/estados.enum';
import { EvidenciaEntry, Inconsistencia, createInconsistencia } from '../types';

export class EvidenciaSinResolverError extends Error {
  constructor(public readonly tiposFaltantes: TipoEvidencia[]) {
    super(
      `Faltan evidencias sin resolver (ni capturadas ni omitidas): ${tiposFaltantes.join(', ')}`
    );
  }
}

export class EvidenciasTanqueo {
  private constructor(private readonly items: ReadonlyMap<TipoEvidencia, EvidenciaEntry>) {}

  static empty(): EvidenciasTanqueo {
    return new EvidenciasTanqueo(new Map());
  }

  static fromEntradas(entradas: EvidenciaEntry[]): EvidenciasTanqueo {
    return new EvidenciasTanqueo(new Map(entradas.map(e => [e.tipo, e])));
  }

  capture(tipo: TipoEvidencia, media: number): EvidenciasTanqueo {
    return this.withEntrada({
      tipo,
      estado: EstadoEvidencia.CAPTURADA,
      mediaId: media,
      motivoOmision: null,
      fecha: new Date(),
    });
  }

  omit(tipo: TipoEvidencia, motivo: string | null): EvidenciasTanqueo {
    return this.withEntrada({
      tipo,
      estado: EstadoEvidencia.OMITIDA,
      mediaId: null,
      motivoOmision: motivo,
      fecha: new Date(),
    });
  }

  private withEntrada(entrada: EvidenciaEntry): EvidenciasTanqueo {
    const copia = new Map(this.items);
    copia.set(entrada.tipo, entrada);
    return new EvidenciasTanqueo(copia);
  }

  findTiposSinResolver(requeridos: readonly TipoEvidencia[]): TipoEvidencia[] {
    return requeridos.filter(t => !this.items.has(t));
  }

  extract(tipos: readonly TipoEvidencia[]): EvidenciasTanqueo {
    const permitidos = new Set(tipos);
    return EvidenciasTanqueo.fromEntradas(this.getEntradas().filter(e => permitidos.has(e.tipo)));
  }

  areAllCompletas(): boolean {
    return [...this.items.values()].every(e => e.estado === EstadoEvidencia.CAPTURADA);
  }

  generateInconsistencias(): Inconsistencia[] {
    return [...this.items.values()]
      .filter(e => e.estado === EstadoEvidencia.OMITIDA)
      .map(e =>
        e.motivoOmision?.trim()
          ? createInconsistencia(
              CodigoInconsistencia.EVI_OMIT_MOT,
              SeveridadInconsistencia.ADVERTENCIA,
              `Evidencia de ${e.tipo} omitida: ${e.motivoOmision}`,
              e.tipo
            )
          : createInconsistencia(
              CodigoInconsistencia.EVI_OMIT,
              SeveridadInconsistencia.CRITICA,
              `Evidencia de ${e.tipo} omitida sin justificacion`,
              e.tipo
            )
      );
  }

  getEntradas(): EvidenciaEntry[] {
    return [...this.items.values()];
  }

  toJSON(): Record<string, Omit<EvidenciaEntry, 'tipo'>> {
    return Object.fromEntries(
      [...this.items.entries()].map(([tipo, e]) => [
        mapEvidenceTypeToPersistence(tipo),
        {
          estado: e.estado,
          mediaId: e.mediaId,
          motivoOmision: e.motivoOmision,
          fecha: e.fecha,
        },
      ])
    );
  }
}
