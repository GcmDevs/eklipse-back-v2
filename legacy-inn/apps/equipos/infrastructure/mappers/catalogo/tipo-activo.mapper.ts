import { TipoActivo } from '@equipos/domain/entities/catalogo/tipo-activo.entity';
import { TipoActivoRead } from '@equipos/domain/read';
import { TipoActivoOrm } from '@orm/inn/equipos/catalogo/tipo-activo.orm';

export class TipoActivoMapper {
  static toDomain(orm: TipoActivoOrm): TipoActivo {
    return TipoActivo.rebuild(
      orm.id,
      orm.nombre,
      orm.codigo,
      orm.createdAt,
      orm.updatedAt,
      orm.descripcion,
      orm.activo,
    );
  }

  static toOrm(domain: TipoActivo): TipoActivoOrm {
    const orm = new TipoActivoOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.nombre = domain.getNombre;
    orm.codigo = domain.getCodigo;
    orm.descripcion = domain.getDescripcion;
    orm.activo = domain.getActivo;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }

  static toView(orm: TipoActivoOrm): TipoActivoRead {
    return {
      id: orm.id,
      nombre: orm.nombre,
      codigo: orm.codigo,
      descripcion: orm.descripcion,
      activo: orm.activo,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    };
  }

  static toViewList(orms: TipoActivoOrm[]): TipoActivoRead[] {
    return orms.map(this.toView);
  }
}