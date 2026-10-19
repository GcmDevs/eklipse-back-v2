import { SyncLog } from '@vehiculos/domain/entities';
import { SyncLogOrm } from '../persistence/orm';

export class SyncLogMapper {
  static toDomain(orm: SyncLogOrm): SyncLog {
    return SyncLog.rebuild(
      orm.id,
      orm.clienteUuid,
      orm.tanqueoId ?? null,
      orm.usuario?.id,
      orm.dispositivoId,
      orm.operacion,
      orm.resultado,
      orm.detalle ?? null,
      orm.errorMensaje ?? null,
      orm.duracionMs ?? null,
      orm.fechaIntento
    );
  }

  static toOrm(domain: SyncLog): SyncLogOrm {
    const orm = new SyncLogOrm();
    if (domain.getId.getValor) {
      orm.id = domain.getId.getValor;
    }
    orm.clienteUuid = domain.getClienteUuid;
    orm.tanqueoId = domain.getTanqueoId?.getValor;
    orm.usuario = { id: domain.getUsuarioId.getValor } as SyncLogOrm['usuario'];
    orm.dispositivoId = domain.getDispositivoId;
    orm.operacion = domain.getOperacion;
    orm.fechaIntento = domain.getCreatedAt;
    orm.resultado = domain.getResultado;
    orm.detalle = domain.getDetalles;
    orm.errorMensaje = domain.getErrorMensaje;
    orm.duracionMs = domain.getDuracionMs;
    orm.createdAt = domain.getCreatedAt;
    return orm;
  }
}
