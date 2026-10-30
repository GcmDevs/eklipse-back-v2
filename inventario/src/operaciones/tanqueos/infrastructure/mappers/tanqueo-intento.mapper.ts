import { TanqueoIntento } from '@inn/operaciones/tanqueos/domain/entities';
import { TanqueoIntentoRead } from '@inn/operaciones/tanqueos/domain/reads';
import { TanqueoIntentoOrm } from '../persistence/orm';

export class TanqueoIntentoMapper {
  static toDomain(orm: TanqueoIntentoOrm): TanqueoIntento {
    return TanqueoIntento.rebuild(
      orm.id,
      orm.clienteUuid ?? null,
      orm.idempotencyKey ?? null,
      orm.usuario?.id ?? 0,
      orm.dispositivoId ?? null,
      orm.canalRegistro ?? null,
      orm.operacion,
      orm.payload,
      orm.errorCodigo ?? null,
      orm.errorMensaje ?? null,
      orm.estado,
      orm.tanqueo?.id ?? null,
      orm.resueltoPor?.id ?? null,
      orm.fechaResolucion ?? null,
      orm.fechaIntento,
      orm.createdAt
    );
  }

  static toOrm(domain: TanqueoIntento): TanqueoIntentoOrm {
    const orm = new TanqueoIntentoOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.clienteUuid = domain.getClienteUuid;
    orm.idempotencyKey = domain.getIdempotencyKey;
    orm.usuario = { id: domain.getUsuarioId.getValor } as TanqueoIntentoOrm['usuario'];
    orm.dispositivoId = domain.getDispositivoId;
    orm.canalRegistro = domain.getCanalRegistro;
    orm.operacion = domain.getOperacion;
    orm.payload = domain.getPayload;
    orm.errorCodigo = domain.getErrorCodigo;
    orm.errorMensaje = domain.getErrorMensaje;
    orm.estado = domain.getEstado;
    if (domain.getTanqueoId) {
      orm.tanqueo = { id: domain.getTanqueoId.getValor } as TanqueoIntentoOrm['tanqueo'];
    }
    if (domain.getResueltoPorId) {
      orm.resueltoPor = { id: domain.getResueltoPorId.getValor } as TanqueoIntentoOrm['resueltoPor'];
    }
    orm.fechaResolucion = domain.getFechaResolucion;
    orm.fechaIntento = domain.getFechaIntento;
    orm.createdAt = domain.getCreatedAt;
    return orm;
  }

  static toView(domain: TanqueoIntento): TanqueoIntentoRead {
    return {
      id: domain.getId.getValor,
      clienteUuid: domain.getClienteUuid,
      idempotencyKey: domain.getIdempotencyKey,
      usuarioId: domain.getUsuarioId.getValor,
      dispositivoId: domain.getDispositivoId,
      canalRegistro: domain.getCanalRegistro,
      operacion: domain.getOperacion,
      payload: domain.getPayload,
      errorCodigo: domain.getErrorCodigo,
      errorMensaje: domain.getErrorMensaje,
      estado: domain.getEstado,
      tanqueoId: domain.getTanqueoId?.getValor ?? null,
      resueltoPorId: domain.getResueltoPorId?.getValor ?? null,
      fechaResolucion: domain.getFechaResolucion,
      fechaIntento: domain.getFechaIntento,
      createdAt: domain.getCreatedAt,
    };
  }

  static toViewList(domains: TanqueoIntento[]): TanqueoIntentoRead[] {
    return domains.map(TanqueoIntentoMapper.toView);
  }
}
