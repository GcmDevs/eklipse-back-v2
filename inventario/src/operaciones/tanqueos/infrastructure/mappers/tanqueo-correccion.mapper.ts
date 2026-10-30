import { TanqueoCorreccion } from '@inn/operaciones/tanqueos/domain/entities';
import { TanqueoCorreccionOrm } from '../persistence/orm';

export class TanqueoCorreccionMapper {
  static toDomain(orm: TanqueoCorreccionOrm): TanqueoCorreccion {
    return TanqueoCorreccion.rebuild(
      orm.id,
      orm.tanqueo?.id,
      orm.campo,
      orm.valorAnterior ?? null,
      orm.valorNuevo ?? null,
      orm.motivo,
      orm.inconsistencia?.id ?? null,
      orm.usuario?.id ?? 0,
      orm.createdAt
    );
  }

  static toOrm(domain: TanqueoCorreccion): TanqueoCorreccionOrm {
    const orm = new TanqueoCorreccionOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.tanqueo = { id: domain.getTanqueoId.getValor } as TanqueoCorreccionOrm['tanqueo'];
    orm.campo = domain.getCampo;
    orm.valorAnterior = domain.getValorAnterior;
    orm.valorNuevo = domain.getValorNuevo;
    orm.motivo = domain.getMotivo;
    if (domain.getInconsistenciaId) {
      orm.inconsistencia = {
        id: domain.getInconsistenciaId.getValor,
      } as TanqueoCorreccionOrm['inconsistencia'];
    }
    orm.usuario = { id: domain.getUsuarioId.getValor } as TanqueoCorreccionOrm['usuario'];
    orm.createdAt = domain.getCreatedAt;
    return orm;
  }
}
