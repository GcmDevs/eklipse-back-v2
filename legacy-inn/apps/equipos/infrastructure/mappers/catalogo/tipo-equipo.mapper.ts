import { TipoEquipo } from '@equipos/domain/entities/catalogo/tipo-equipo.entity';
import { TipoEquipoEmbeddedRead, TipoEquipoRead } from '@equipos/domain/read';
import { TipoEquipoOrm } from '@orm/inn/equipos/catalogo/tipo-equipo.orm';
import { FichaTecnicaTipoEquipoMapper } from './ficha-tecnica-tipo-equipo.mapper';

export class TipoEquipoMapper {
  static toDomain(orm: TipoEquipoOrm): TipoEquipo {
    return TipoEquipo.rebuild(
      orm.id,
      orm.nombre,
      orm.modelo?.id,
      orm.subclase?.id,
      orm.tipoActivo?.id,
      orm.createdAt,
      orm.updatedAt,
      orm.observaciones,
      orm.activo,
      FichaTecnicaTipoEquipoMapper.toDomain(orm.fichaTecnica),
    );
  }

  static toOrm(domain: TipoEquipo): TipoEquipoOrm {
    const orm = new TipoEquipoOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.nombre = domain.getNombre;
    orm.modelo = { id: domain.getModeloId.getValor } as any;
    orm.subclase = { id: domain.getSubclaseId.getValor } as any;
    orm.tipoActivo = { id: domain.getTipoActivoId.getValor } as any;
    orm.observaciones = domain.getObservaciones;
    orm.activo = domain.getActivo;
    orm.fichaTecnica = FichaTecnicaTipoEquipoMapper.toEmbeddable(domain.getFichaTecnica);
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }

  static toEmbeddedView(orm: TipoEquipoOrm): TipoEquipoEmbeddedRead {
    return {
      id: orm.id,
      nombre: orm.nombre,
      modelo: {
        id: orm.modelo.id,
        nombre: orm.modelo.nombre,
        marca: {
          id: orm.modelo.marca.id,
          nombre: orm.modelo.marca.nombre
        }
      },
      subclaseId: orm.subclase?.id,
      subclaseNombre: orm.subclase?.nombre,
      tipoActivoId: orm.tipoActivo?.id,
      tipoActivoNombre: orm.tipoActivo?.nombre,
      observaciones: orm.observaciones,
      activo: orm.activo,
      fichaTecnica: FichaTecnicaTipoEquipoMapper.toView(orm.fichaTecnica),
      documentos: (orm.documentos ?? []).map((d) => ({
        id: d.id,
        tipoEquipoId: d.tipoEquipo?.id ?? orm.id,
        tipoDocumentoId: d.tipoDocumento?.id,
        tipoDocumentoNombre: d.tipoDocumento?.nombre,
        tipoDocumentoCategoria: d.tipoDocumento?.categoria,
        aplica: d.aplica,
        archivoId: d.archivo?.id ?? null,
        observaciones: d.observaciones,
        activo: d.activo ?? true,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    };
  }

  static toView(orm: TipoEquipoOrm): TipoEquipoRead {
    return {
      ...this.toEmbeddedView(orm),
      accesorios: (orm.accesoriosEstandar ?? []).map((a) => ({
        id: a.id,
        tipoEquipoId: a.tipoEquipo?.id ?? orm.id,
        parteId: a.parte?.id,
        parteSnap: a.parteSnap,
        marcaId: a.marca?.id,
        marcaNombre: a.marca?.nombre,
        cantidad: a.cantidad,
        referencia: a.referencia,
        observaciones: a.observaciones,
        activo: a.activo ?? true,
      })),
      planesDefault: (orm.planesDefault ?? []).map((p) => ({
        id: p.id,
        tipoEquipoId: p.tipoEquipo?.id ?? orm.id,
        tipo: p.tipo,
        periocidad: p.periocidad?.valor != null && p.periocidad?.unidad
          ? { valor: p.periocidad.valor, unidad: p.periocidad.unidad }
          : null,
        diasAntNotif: p.diasAntNotif,
        realizaExterno: p.realizaExterno,
        formatoId: p.formato?.id,
        formatoNombre: p.formato?.nombre,
        observaciones: p.observaciones,
        activo: p.activo ?? true,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    };
  }

  static toViewList(orms: TipoEquipoOrm[]): TipoEquipoRead[] {
    return orms.map((orm) => this.toView(orm));
  }
}
