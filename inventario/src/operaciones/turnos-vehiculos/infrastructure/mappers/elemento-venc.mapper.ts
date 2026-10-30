import { ElementoVencFlota } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import { AmbElementoVencOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-elemento-venc.orm';

export class ElementoVencMapper {
  static toDomain(orm: AmbElementoVencOrm): ElementoVencFlota {
    return ElementoVencFlota.rebuild(
      orm.id,
      orm.vehiculoId,
      orm.itemKey,
      orm.fechaVencimiento,
      orm.actualizadoPorId,
      orm.createdAt,
      orm.updatedAt,
    );
  }

  static toOrm(domain: ElementoVencFlota): AmbElementoVencOrm {
    const orm = new AmbElementoVencOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.vehiculoId = domain.getVehiculoId.getValor;
    orm.itemKey = domain.getItemKey;
    orm.fechaVencimiento = domain.getFechaVencimiento;
    orm.actualizadoPorId = domain.getActualizadoPorId.getValor;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }
}
