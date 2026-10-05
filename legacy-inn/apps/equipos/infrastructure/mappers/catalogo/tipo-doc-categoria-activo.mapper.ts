import { TipoDocCategoriaActivo } from '@equipos/domain/entities/catalogo/tipo-doc-categoria-activo.entity';
import { TipoDocCategoriaActivoRead } from '@equipos/domain/read';
import { ReglasObligatoriedadTipoActivo } from '@equipos/domain/value-objects';
import { TipoDocCategoriaActivoOrm } from '@orm/inn/equipos/catalogo/tipo-doc-categoria-activo.orm';

export class TipoDocCategoriaActivoMapper {
  static toDomain(orm: TipoDocCategoriaActivoOrm): TipoDocCategoriaActivo {
    return TipoDocCategoriaActivo.rebuild(
      orm.id,
      orm.nombre,
      orm.categoria,
      orm.reglasTipoActivo ?? ReglasObligatoriedadTipoActivo.fromPrimitives([]),
      orm.createdAt,
      orm.updatedAt,
      orm.descripcion
    );
  }

  static toOrm(domain: TipoDocCategoriaActivo): TipoDocCategoriaActivoOrm {
    const orm = new TipoDocCategoriaActivoOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.nombre = domain.getNombre;
    orm.categoria = domain.getCategoria;
    orm.reglasTipoActivo = domain.getReglasTipoActivo;
    orm.descripcion = domain.getDescripcion;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }

  static toView(
    orm: TipoDocCategoriaActivoOrm,
    tipoActivoNombres?: Map<number, string>,
    tipoActivoIdFiltro?: number
  ): TipoDocCategoriaActivoRead {
    const reglas = orm.reglasTipoActivo?.getReglas() ?? [];
    const reglasTipoActivo = reglas.map(r => ({
      tipoActivoId: r.tipoActivoId,
      tipoActivoNombre: tipoActivoNombres?.get(r.tipoActivoId),
      esObligatorio: r.esObligatorio,
    }));

    const reglaFiltro =
      tipoActivoIdFiltro != null
        ? reglas.find(r => r.tipoActivoId === tipoActivoIdFiltro)
        : undefined;

    return {
      id: orm.id,
      nombre: orm.nombre,
      categoria: orm.categoria,
      reglasTipoActivo,
      esObligatorio: reglaFiltro?.esObligatorio,
      descripcion: orm.descripcion,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    };
  }

  static toViewList(
    orms: TipoDocCategoriaActivoOrm[],
    tipoActivoNombres?: Map<number, string>,
    tipoActivoIdFiltro?: number
  ): TipoDocCategoriaActivoRead[] {
    return orms.map(orm => this.toView(orm, tipoActivoNombres, tipoActivoIdFiltro));
  }
}
