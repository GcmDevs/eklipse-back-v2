import { Formato } from '@equipos/domain/entities/actividades';
import { FormatoRead } from '@equipos/domain/read';
import { FormatoOrm } from '@orm/inn/equipos';
import { VersionFormatoMapper } from 'apps/motor-formatos/infrastructure/mappers';

export class FormatoMapper {
  public static toOrm(domain: Formato): FormatoOrm {
    const orm = new FormatoOrm();

    orm.id = domain.getId.getValor ?? undefined;
    orm.nombre = domain.getNombre;
    orm.tipo = domain.getTipo;
    orm.modoFormato = domain.getModo;
    orm.codigo = domain.getCodigo;
    orm.slug = domain.getSlug;
    orm.descripcion = domain.getDescripcion;
    orm.formatoOrigenId = domain.getFormatoOrigenId?.getValor ?? null;
    orm.activo = domain.getActivo;
    orm.creadoPor = domain.getCreadoPor;
    orm.creadoPorId = domain.getCreadoPorId.getValor;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;

    orm.versiones = domain.getVersiones?.map(v => VersionFormatoMapper.toOrm(v)) ?? [];

    return orm;
  }

  public static toDomain(orm: FormatoOrm): Formato {
    return Formato.rebuild(
      orm.id,
      orm.nombre,
      orm.tipo,
      orm.modoFormato,
      orm.codigo,
      orm.slug,
      orm.formatoOrigenId,
      orm.versiones?.map(v => VersionFormatoMapper.toDomain(v)) ?? [],
      orm.activo,
      orm.creadoPor,
      orm.creadoPorId!,
      orm.createdAt,
      orm.updatedAt,
      orm?.descripcion
    );
  }

  static toView(orm: FormatoOrm): FormatoRead {
    return {
      id: orm.id,
      nombre: orm.nombre,
      tipo: orm.tipo,
      modo: orm.modoFormato,
      codigo: orm.codigo,
      slug: orm.slug,
      descripcion: orm.descripcion ?? null,
      formatoOrigenId: orm?.formatoOrigenId ?? null,
      activo: orm.activo,
      creadoPor: orm.creadoPor,
      creadoPorId: orm.creadoPorId,
      versiones: (orm.versiones ?? []).map(version => ({
        id: version.id,
        etiqueta: version?.etiquetaVersion ?? null,
        version: version?.version ?? null,
        estado: version?.estado,
        fechaPublicacion: version?.fechaPublicacion ?? null,
        creadoPorId: version?.creadoPorId ?? null,
        createdAt: version?.createdAt ?? null,
        updatedAt: version?.updatedAt ?? null,
      })),
    };
  }

  public static toDomainList(ormList: FormatoOrm[]): Formato[] {
    return ormList.map(orm => FormatoMapper.toDomain(orm));
  }

  public static toViewList(ormList: FormatoOrm[]): FormatoRead[] {
    return ormList.map(orm => FormatoMapper.toView(orm));
  }
}
