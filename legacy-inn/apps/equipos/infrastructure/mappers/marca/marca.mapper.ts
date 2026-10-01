import { Marca } from '@equipos/domain/entities';
import { MarcaRead } from '@equipos/domain/read';
import { FormatoOrm, MarcaOrm } from '@orm/inn/equipos';

export class MarcaMapper {
  static toOrm(domain: Marca): MarcaOrm {
    const orm = new MarcaOrm();

    if (domain.getId.getValor) {
      orm.id = domain.getId.getValor;
    }
    orm.descripcion = domain.getDescripcion;
    orm.nombre = domain.getNombre;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }

  static toDomain(orm: MarcaOrm): Marca {
    return Marca.rebuild(
      orm.id,
      orm.nombre,
      orm.createdAt,
      orm.updatedAt,
      orm?.descripcion
    );
  }


  static toView(orm: MarcaOrm): MarcaRead {
    return {
      id: orm.id,
      nombre: orm.nombre,
      descripcion: orm.descripcion,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    };
  }

  static toDomainList(entities: MarcaOrm[]): Marca[] {
    return entities.map(et => this.toDomain(et));
  }

  static toViewList(ormList: MarcaOrm[]): MarcaRead[] {
    return ormList.map(orm => this.toView(orm));
  }

  static fromLegacySp(raw: any): Marca {
    if (!raw) return null;

    return Marca.rebuild(
      raw.marca_id,
      raw.marca_nombre,
      raw.marca_created_at,
      raw.marca_updated_at
    );
  }
}
