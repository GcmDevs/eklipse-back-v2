import { EventoFlota } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import { EntidadEventoFlota } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { AmbEventoOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-evento.orm';

export class EventoFlotaMapper {
  static toDomain(orm: AmbEventoOrm): EventoFlota {
    return EventoFlota.rebuild(
      orm.id,
      orm.entidad as EntidadEventoFlota,
      orm.entidadId,
      orm.tipoEvento,
      orm.usuarioId,
      orm.motivo,
      orm.detalle,
      orm.createdAt,
    );
  }

  static toOrm(domain: EventoFlota): AmbEventoOrm {
    const orm = new AmbEventoOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.entidad = domain.getEntidad;
    orm.entidadId = domain.getEntidadId.getValor;
    orm.tipoEvento = domain.getTipoEvento;
    orm.usuarioId = domain.getUsuarioId?.getValor;
    orm.motivo = domain.getMotivo;
    orm.detalle = domain.getDetalle;
    orm.createdAt = domain.getCreatedAt;
    return orm;
  }
}
