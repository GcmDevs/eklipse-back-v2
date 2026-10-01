import { ClaseEquipo } from '@equipos/domain/entities/catalogo/clase-equipo.entity';
import { ClaseEquipoRead } from '@equipos/domain/read';
import { ClaseEquipoOrm } from '@orm/inn/equipos/catalogo/clase-equipo.orm';

export class ClaseEquipoMapper {
  static toDomain(orm: ClaseEquipoOrm): ClaseEquipo {
    return ClaseEquipo.rebuild(
      orm.id,
      orm.tipoActivo?.id,
      orm.nombre,
      orm.codigo,
      orm.createdAt,
      orm.updatedAt,
      orm.descripcion,
      orm.activo
    );
  }

  static toOrm(domain: ClaseEquipo): ClaseEquipoOrm {
    const orm = new ClaseEquipoOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.tipoActivo = { id: domain.getTipoActivoId.getValor } as any;
    orm.nombre = domain.getNombre;
    orm.codigo = domain.getCodigo;
    orm.descripcion = domain.getDescripcion;
    orm.activo = domain.getActivo;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }

  static toView(orm: ClaseEquipoOrm): ClaseEquipoRead {
    return {
      id: orm.id,
      tipoActivoId: orm.tipoActivo?.id,
      tipoActivoNombre: orm.tipoActivo?.nombre,
      nombre: orm.nombre,
      codigo: orm.codigo,
      descripcion: orm.descripcion,
      activo: orm.activo,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    };
  }

  static toViewList(orms: ClaseEquipoOrm[]): ClaseEquipoRead[] {
    return orms.map(this.toView);
  }
}
