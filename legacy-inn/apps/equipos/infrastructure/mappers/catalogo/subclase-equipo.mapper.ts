import { SubclaseEquipo } from '@equipos/domain/entities/catalogo/subclase-equipo.entity';
import { SubclaseEquipoRead } from '@equipos/domain/read';
import { SubclaseEquipoOrm } from '@orm/inn/equipos/catalogo/subclase-equipo.orm';

export class SubclaseEquipoMapper {
  static toDomain(orm: SubclaseEquipoOrm): SubclaseEquipo {
    return SubclaseEquipo.rebuild(
      orm.id,
      orm.clase?.id,
      orm.nombre,
      orm.codigo,
      orm.createdAt,
      orm.updatedAt,
      orm.descripcion,
      orm.activo
    );
  }

  static toOrm(domain: SubclaseEquipo): SubclaseEquipoOrm {
    const orm = new SubclaseEquipoOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.clase = { id: domain.getClaseId.getValor } as any;
    orm.nombre = domain.getNombre;
    orm.codigo = domain.getCodigo;
    orm.descripcion = domain.getDescripcion;
    orm.activo = domain.getActivo;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }

  static toView(orm: SubclaseEquipoOrm): SubclaseEquipoRead {
    return {
      id: orm.id,
      claseId: orm.clase?.id,
      claseNombre: orm.clase?.nombre,
      nombre: orm.nombre,
      codigo: orm.codigo,
      descripcion: orm.descripcion,
      activo: orm.activo,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    };
  }

  static toViewList(orms: SubclaseEquipoOrm[]): SubclaseEquipoRead[] {
    return orms.map(this.toView);
  }
}
