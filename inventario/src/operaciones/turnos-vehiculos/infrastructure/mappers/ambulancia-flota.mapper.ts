import { AmbulanciaFlota } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import { EstadoServicioAmbulancia, TipoAmbulanciaFlota } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { AmbAmbulanciaOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-ambulancia.orm';

export class AmbulanciaFlotaMapper {
  static toDomain(orm: AmbAmbulanciaOrm): AmbulanciaFlota {
    return AmbulanciaFlota.rebuild(
      orm.id,
      orm.vehiculoId,
      orm.tipoAmbulancia as TipoAmbulanciaFlota,
      orm.estadoServicio as EstadoServicioAmbulancia,
      orm.registradoPorId,
      orm.createdAt,
      orm.updatedAt,
    );
  }

  static toOrm(domain: AmbulanciaFlota): AmbAmbulanciaOrm {
    const orm = new AmbAmbulanciaOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.vehiculoId = domain.getVehiculoId.getValor;
    orm.tipoAmbulancia = domain.getTipoAmbulancia;
    orm.estadoServicio = domain.getEstadoServicio;
    orm.registradoPorId = domain.getRegistradoPorId.getValor;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }
}
