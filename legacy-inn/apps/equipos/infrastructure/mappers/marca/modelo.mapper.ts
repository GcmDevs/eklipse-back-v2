import { Modelo } from '@equipos/domain/entities';
import { ModeloRead } from '@equipos/domain/read';
import { ModeloOrm } from '@orm/inn/equipos';
import { MarcaMapper } from './marca.mapper';

export class ModeloMapper {
  static toOrm(domain: Modelo): ModeloOrm {
    const orm = new ModeloOrm();
    orm.id = domain.getId.getValor;
    orm.nombre = domain.getNombre;
    orm.marca = { id: domain.getMarcaId.getValor } as any;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }

  static toDomain(orm: ModeloOrm): Modelo {
    return Modelo.rebuild(orm.id, orm.nombre, orm.marca.id, orm.createdAt, orm.updatedAt);
  }

  static toView(orm: ModeloOrm): ModeloRead {
    return {
      id: orm.id,
      nombre: orm.nombre,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      marca: orm.marca ? MarcaMapper.toView(orm.marca) : null,
    };
  }

  static fromLegacySp(raw: any): Modelo {
    if (!raw) return null;

    return Modelo.rebuild(
      raw.modelo_id,
      raw.modelo_nombre,
      raw.marca_id,
      raw.modelo_created_at,
      raw.modelo_updated_at
    );
  }
}
