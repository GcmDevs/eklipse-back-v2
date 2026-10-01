import { AccesorioUnidad } from '@equipos/domain/entities';
import { AccesorioUnidadRead } from '@equipos/domain/read';
import { AccesorioUnidadOrm } from '@orm/inn/equipos';

export class AccesorioUnidadMapper {
  static toDomain(orm: AccesorioUnidadOrm): AccesorioUnidad {
    return AccesorioUnidad.rebuild(
      orm.id,
      orm.equipo?.id,
      orm.accesorioEstandar?.id,
      orm.parteSnap,
      orm.createdAt,
      orm.updatedAt,
      orm.estado,
      orm.observaciones,
      orm.descontinuado,
      orm.fechaDescontinuado,
    );
  }

  static toOrm(domain: AccesorioUnidad): AccesorioUnidadOrm {
    const orm = new AccesorioUnidadOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.equipo = { id: domain.getEquipoId.getValor } as any;
    orm.accesorioEstandar = { id: domain.getAccesorioEstandarId.getValor } as any;
    orm.parteSnap = domain.getParteSnap;
    orm.estado = domain.getEstado;
    orm.observaciones = domain.getObservaciones;
    orm.descontinuado = domain.getDescontinuado;
    orm.fechaDescontinuado = domain.getFechaDescontinuado;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }

  static toView(orm: AccesorioUnidadOrm): AccesorioUnidadRead {
    return {
      id: orm.id,
      equipoId: orm.equipo?.id,
      accesorioEstandarId: orm.accesorioEstandar?.id,
      parteSnap: orm.parteSnap,
      estado: orm.estado,
      observaciones: orm.observaciones,
      marcaNombre: orm.accesorioEstandar?.marca?.nombre,
      referencia: orm.accesorioEstandar?.referencia,
      cantidad: orm.accesorioEstandar?.cantidad,
      descontinuado: orm.descontinuado,
      fechaDescontinuado: orm.fechaDescontinuado,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    };
  }

  static toViewList(orms: AccesorioUnidadOrm[]): AccesorioUnidadRead[] {
    return orms.map(this.toView);
  }
}
