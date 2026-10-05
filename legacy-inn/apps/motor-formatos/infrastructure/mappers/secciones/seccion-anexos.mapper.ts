import { DefinicionImagen, SeccionAnexoImagenes } from 'apps/motor-formatos/domain';
import { SeccionAnexoImagenesOrm } from '../../persistence';

export class SeccionAnexosMapper {
  static toOrm(domain: SeccionAnexoImagenes): SeccionAnexoImagenesOrm {
    const orm = new SeccionAnexoImagenesOrm();

    orm.id = domain.getId.getValor ?? undefined;
    orm.cantidadSlots = domain.getCantidadSlots;
    orm.nombre = domain.getNombre;
    orm.definicion = {
      imagenes: domain.getImagenes.map(img => ({
        key: img.key,
        orden: img.orden,
        etiqueta: img.etiqueta,
      })),
      observacionGeneral: domain.getObservacionGeneral,
    };

    return orm;
  }

  static toDomain(orm: SeccionAnexoImagenesOrm): SeccionAnexoImagenes {
    const imagenes: DefinicionImagen[] =
      orm.definicion?.imagenes?.map(
        img => new DefinicionImagen(img.key, img.orden, img.etiqueta)
      ) ?? [];

    return SeccionAnexoImagenes.rebuild(
      orm.id,
      orm.nombre,
      orm.cantidadSlots,
      imagenes,
      orm.definicion?.observacionGeneral
    );
  }

  static toDomainList(ormList: SeccionAnexoImagenesOrm[]): SeccionAnexoImagenes[] {
    return ormList.map(this.toDomain);
  }

  static toView(anex: any) {
    return {
      id: anex.getId.getValor,
      nombre: anex.getNombre,
      numeroSlots: anex.getCantidadSlots,
      version: anex.getVersion,
    };
  }
}
