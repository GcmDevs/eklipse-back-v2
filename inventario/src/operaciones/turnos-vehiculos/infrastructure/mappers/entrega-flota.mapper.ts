import { EntregaFlota } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import { CausaCierreEntrega, EstadoEntrega } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { AmbEntregaOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-entrega.orm';

export class EntregaFlotaMapper {
  static toDomain(orm: AmbEntregaOrm): EntregaFlota {
    return EntregaFlota.rebuild(
      orm.id,
      orm.vehiculoId,
      orm.turnoSalienteId,
      orm.turnoEntranteId,
      orm.plantillaId,
      orm.estado as EstadoEntrega,
      orm.causaCierre as CausaCierreEntrega,
      orm.fechaEntrega,
      orm.limiteInicioRecepcion,
      orm.habilitaExcepcionalEn,
      orm.cierreAutomaticoEn,
      orm.fechaCierre,
      orm.createdAt,
      orm.updatedAt,
      orm.lanzadaPorId,
      orm.extendido ?? false,
    );
  }

  static toOrm(domain: EntregaFlota): AmbEntregaOrm {
    const orm = new AmbEntregaOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.vehiculoId = domain.getVehiculoId.getValor;
    orm.turnoSalienteId = domain.getTurnoSalienteId.getValor;
    orm.turnoEntranteId = domain.getTurnoEntranteId?.getValor;
    orm.plantillaId = domain.getPlantillaId.getValor;
    orm.estado = domain.getEstado;
    orm.causaCierre = domain.getCausaCierre;
    orm.fechaEntrega = domain.getFechaEntrega;
    orm.limiteInicioRecepcion = domain.getLimiteInicioRecepcion;
    orm.habilitaExcepcionalEn = domain.getHabilitaExcepcionalEn;
    orm.cierreAutomaticoEn = domain.getCierreAutomaticoEn;
    orm.fechaCierre = domain.getFechaCierre;
    orm.lanzadaPorId = domain.getLanzadaPorId?.getValor;
    orm.extendido = domain.getExtendido;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }
}
