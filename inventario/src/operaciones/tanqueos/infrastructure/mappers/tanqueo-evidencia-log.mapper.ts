import { TanqueoEvidenciaLog } from '@inn/operaciones/tanqueos/domain/entities';
import { TanqueoEvidenciaLogOrm } from '../persistence/orm';

export class TanqueoEvidenciaLogMapper {
  static toOrm(domain: TanqueoEvidenciaLog): TanqueoEvidenciaLogOrm {
    const orm = new TanqueoEvidenciaLogOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    if (domain.getTanqueoId) {
      orm.tanqueo = { id: domain.getTanqueoId.getValor } as TanqueoEvidenciaLogOrm['tanqueo'];
    }
    if (domain.getAbastecimientoId) {
      orm.abastecimiento = {
        id: domain.getAbastecimientoId.getValor,
      } as TanqueoEvidenciaLogOrm['abastecimiento'];
    }
    orm.tipoEvidencia = domain.getTipoEvidencia;
    orm.accion = domain.getAccion;
    orm.mediaAnteriorId = domain.getMediaAnteriorId?.getValor;
    orm.mediaNuevoId = domain.getMediaNuevoId?.getValor;
    orm.tipoDestino = domain.getTipoDestino;
    orm.motivo = domain.getMotivo;
    orm.usuario = { id: domain.getUsuarioId.getValor } as TanqueoEvidenciaLogOrm['usuario'];
    orm.createdAt = domain.getCreatedAt;
    return orm;
  }
}
