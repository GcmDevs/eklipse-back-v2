import { TanqueoEventoLog } from '@inn/operaciones/tanqueos/domain/entities/tanqueo-evento-log.entity';
import { TanqueoEventoLogOrm } from '../persistence/orm/tanqueo-evento-log.orm';

export class TanqueoEventoLogMapper {
  static toOrm(domain: TanqueoEventoLog): TanqueoEventoLogOrm {
    const orm = new TanqueoEventoLogOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.tipoEvento = domain.getTipoEvento;
    orm.activoId = domain.getActivoId?.getValor ?? undefined;
    orm.cantidad = domain.getCantidad ?? undefined;
    orm.estadoAnterior = domain.getEstadoAnterior ?? undefined;
    orm.estadoNuevo = domain.getEstadoNuevo ?? undefined;
    orm.observacion = domain.getObservacion ?? undefined;
    orm.usuarioId = domain.getUsuarioId.getValor;
    orm.createdAt = domain.getCreatedAt;
    return orm;
  }

  static toDomain(orm: TanqueoEventoLogOrm): TanqueoEventoLog {
    return TanqueoEventoLog.rebuild(
      orm.id,
      orm.tipoEvento,
      orm.activoId ?? null,
      orm.cantidad ?? null,
      orm.estadoAnterior ?? null,
      orm.estadoNuevo ?? null,
      orm.observacion ?? null,
      orm.usuarioId,
      orm.createdAt
    );
  }
}
