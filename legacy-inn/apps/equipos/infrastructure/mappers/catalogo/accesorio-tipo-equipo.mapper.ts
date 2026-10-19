import { AccesorioTipoEquipo } from '@equipos/domain/entities/catalogo/accesorio-tipo-equipo.entity';
import { AccesorioTipoEquipoRead } from '@equipos/domain/read';
import { MarcaOrm } from '@orm/inn/equipos';
import { AccesorioTipoEquipoOrm } from '@orm/inn/equipos/catalogo/accesorio-tipo-equipo.orm';

export class AccesorioTipoEquipoMapper {
  static toDomain(orm: AccesorioTipoEquipoOrm): AccesorioTipoEquipo {
    return AccesorioTipoEquipo.rebuild(
      orm.id,
      orm.tipoEquipo?.id,
      orm.parte?.id,
      orm.parteSnap,
      orm.cantidad,
      orm.marca?.id,
      orm.referencia,
      orm.observaciones,
      orm.activo ?? true
    );
  }

  static toOrm(domain: AccesorioTipoEquipo): AccesorioTipoEquipoOrm {
    const orm = new AccesorioTipoEquipoOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.tipoEquipo = { id: domain.getTipoEquipoId.getValor } as any;
    orm.parte = { id: domain.getParteId.getValor } as any;
    orm.parteSnap = domain.getParteSnap;
    orm.cantidad = domain.getCantidad;
    const marcaId = domain.getMarcaId?.getValor;
    if (marcaId != null) {
      orm.marca = { id: marcaId } as MarcaOrm;
    }
    orm.referencia = domain.getReferencia;
    orm.observaciones = domain.getObservaciones;
    orm.activo = domain.getActivo;
    return orm;
  }

  static toView(orm: AccesorioTipoEquipoOrm): AccesorioTipoEquipoRead {
    return {
      id: orm.id,
      tipoEquipoId: orm.tipoEquipo?.id,
      parteId: orm.parte?.id,
      parteSnap: orm.parteSnap,
      marcaId: orm.marca?.id,
      marcaNombre: orm.marca?.nombre,
      cantidad: orm.cantidad,
      referencia: orm.referencia,
      observaciones: orm.observaciones,
      activo: orm.activo ?? true,
    };
  }

  static toViewList(orms: AccesorioTipoEquipoOrm[]): AccesorioTipoEquipoRead[] {
    return orms.map(this.toView);
  }
}
