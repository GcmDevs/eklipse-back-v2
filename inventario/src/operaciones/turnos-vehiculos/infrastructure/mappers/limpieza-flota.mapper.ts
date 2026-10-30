import { LimpiezaFlota } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import { CausaCierreLimpieza, EstadoLimpieza } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { LimpiezaDatosJson } from '@inn/operaciones/turnos-vehiculos/domain/types';
import { AmbLimpiezaOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-limpieza.orm';

export class LimpiezaFlotaMapper {
  static toDomain(orm: AmbLimpiezaOrm): LimpiezaFlota {
    return LimpiezaFlota.rebuild(
      orm.id,
      orm.turnoId,
      orm.vehiculoId,
      orm.plantillaId,
      orm.usuarioId,
      orm.estado as EstadoLimpieza,
      orm.causaCierre as CausaCierreLimpieza,
      orm.reproceso,
      orm.totalNc,
      orm.datos as unknown as LimpiezaDatosJson,
      orm.fechaFinalizacion,
      orm.createdAt,
      orm.updatedAt,
    );
  }

  static toOrm(domain: LimpiezaFlota): AmbLimpiezaOrm {
    const orm = new AmbLimpiezaOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.turnoId = domain.getTurnoId.getValor;
    orm.vehiculoId = domain.getVehiculoId.getValor;
    orm.plantillaId = domain.getPlantillaId?.getValor;
    orm.usuarioId = domain.getUsuarioId?.getValor;
    orm.estado = domain.getEstado;
    orm.causaCierre = domain.getCausaCierre;
    orm.reproceso = domain.getReproceso;
    orm.totalNc = domain.getTotalNc;
    orm.datos = domain.getDatos as unknown as Record<string, unknown>;
    orm.fechaFinalizacion = domain.getFechaFinalizacion;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }
}
