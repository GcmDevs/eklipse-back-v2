import { DocumentoTipoEquipo } from '@equipos/domain/entities/catalogo/documento-tipo-equipo.entity';
import { DocumentoTipoEquipoRead } from '@equipos/domain/read';
import { DocumentoTipoEquipoOrm } from '@orm/inn/equipos/catalogo/documento-tipo-equipo.orm';

export class DocumentoTipoEquipoMapper {
  static toDomain(orm: DocumentoTipoEquipoOrm): DocumentoTipoEquipo {
    return DocumentoTipoEquipo.rebuild(
      orm.id, orm.tipoEquipo?.id, orm.tipoDocumento?.id,
      orm.aplica, orm.createdAt, orm.updatedAt, orm.archivo?.id, orm.observaciones, orm.activo ?? true,
      orm.compra?.id,
    );
  }

  static toOrm(domain: DocumentoTipoEquipo): DocumentoTipoEquipoOrm {
    const orm = new DocumentoTipoEquipoOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    if (domain.getTipoEquipoId) orm.tipoEquipo = { id: domain.getTipoEquipoId.getValor } as any;
    if (domain.getCompraId) orm.compra = { id: domain.getCompraId.getValor } as any;
    orm.tipoDocumento = { id: domain.getTipoDocumentoId } as any;
    orm.aplica = domain.getAplica;
    if (domain.getArchivoId) orm.archivo = { id: domain.getArchivoId } as any;
    orm.observaciones = domain.getObservaciones;
    orm.activo = domain.getActivo;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }

  static toView(orm: DocumentoTipoEquipoOrm): DocumentoTipoEquipoRead {
    return {
      id: orm.id,
      tipoEquipoId: orm.tipoEquipo?.id,
      compraId: orm.compra?.id,
      tipoDocumentoId: orm.tipoDocumento?.id,
      tipoDocumentoNombre: orm.tipoDocumento?.nombre,
      tipoDocumentoCategoria: orm.tipoDocumento?.categoria,
      aplica: orm.aplica,
      archivoId: orm.archivo?.id,
      observaciones: orm.observaciones,
      activo: orm.activo ?? true,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    };
  }

  static toViewList(orms: DocumentoTipoEquipoOrm[]): DocumentoTipoEquipoRead[] {
    return orms.map(this.toView);
  }
}