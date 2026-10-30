import { DotacionNovedad } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import { EstadoNovedadDotacion } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { AmbDotacionNovedadOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-dotacion-novedad.orm';

export class DotacionNovedadMapper {
  static toDomain(orm: AmbDotacionNovedadOrm): DotacionNovedad {
    return DotacionNovedad.rebuild(
      orm.id,
      orm.dotacionId,
      orm.itemKey,
      orm.estado as EstadoNovedadDotacion,
      orm.cantidadEsperada,
      orm.cantidadEncontrada,
      orm.diferencia,
      orm.fechaVencRegistrada,
      orm.fechaVencObservada,
      orm.observacion,
      orm.resueltaPorId,
      orm.fechaResolucion,
      orm.observacionResolucion,
      orm.createdAt,
      orm.updatedAt,
    );
  }

  static toOrm(domain: DotacionNovedad): AmbDotacionNovedadOrm {
    const orm = new AmbDotacionNovedadOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.dotacionId = domain.getDotacionId.getValor;
    orm.itemKey = domain.getItemKey;
    orm.estado = domain.getEstado;
    orm.cantidadEsperada = domain.getCantidadEsperada;
    orm.cantidadEncontrada = domain.getCantidadEncontrada;
    orm.diferencia = domain.getDiferencia;
    orm.fechaVencRegistrada = domain.getFechaVencRegistrada;
    orm.fechaVencObservada = domain.getFechaVencObservada;
    orm.observacion = domain.getObservacion;
    orm.resueltaPorId = domain.getResueltaPorId?.getValor;
    orm.fechaResolucion = domain.getFechaResolucion;
    orm.observacionResolucion = domain.getObservacionResolucion;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }
}
