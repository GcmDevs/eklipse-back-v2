import { TurnoFlota } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import { CausaCierreTurno, EstadoTurno, OrigenTurno } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { AmbTurnoOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-turno.orm';

export class TurnoFlotaMapper {
  static toDomain(orm: AmbTurnoOrm): TurnoFlota {
    return TurnoFlota.rebuild(
      orm.id,
      orm.vehiculoId,
      orm.responsableId,
      orm.fechaInicio,
      orm.fechaFin,
      orm.estado as EstadoTurno,
      orm.origen as OrigenTurno,
      orm.causaCierre as CausaCierreTurno,
      orm.createdAt,
      orm.updatedAt,
    );
  }

  static toOrm(domain: TurnoFlota): AmbTurnoOrm {
    const orm = new AmbTurnoOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.vehiculoId = domain.getVehiculoId.getValor;
    orm.responsableId = domain.getResponsableId.getValor;
    orm.fechaInicio = domain.getFechaInicio;
    orm.fechaFin = domain.getFechaFin;
    orm.estado = domain.getEstado;
    orm.origen = domain.getOrigen;
    orm.causaCierre = domain.getCausaCierre;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }
}
