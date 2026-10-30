import { DotacionFlota } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import { EstadoDotacion, TipoAmbulanciaFlota } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { fechaColumnaToYmd } from '@inn/operaciones/turnos-vehiculos/domain/helpers/bogota-time.helper';
import { DotacionDatosJson } from '@inn/operaciones/turnos-vehiculos/domain/types';
import { AmbDotacionOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-dotacion.orm';

export class DotacionFlotaMapper {
  static toDomain(orm: AmbDotacionOrm): DotacionFlota {
    return DotacionFlota.rebuild(
      orm.id,
      orm.vehiculoId,
      fechaColumnaToYmd(orm.fecha as string | Date),
      orm.tipoAmbulancia as TipoAmbulanciaFlota,
      orm.plantillaId,
      orm.usuarioId,
      orm.estado as EstadoDotacion,
      orm.completa,
      orm.bloqueada,
      orm.cierreAutomatico,
      orm.yaGuardada,
      orm.fechaInicio,
      orm.fechaLimite,
      orm.fechaUltimoCierre,
      orm.datoBorrador as unknown as DotacionDatosJson,
      orm.datoConfirmado as unknown as DotacionDatosJson,
      orm.createdAt,
      orm.updatedAt,
      orm.extendido ?? false,
    );
  }

  static toOrm(domain: DotacionFlota): AmbDotacionOrm {
    const orm = new AmbDotacionOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.vehiculoId = domain.getVehiculoId.getValor;
    orm.fecha = domain.getFecha;
    orm.tipoAmbulancia = domain.getTipoAmbulancia;
    orm.plantillaId = domain.getPlantillaId?.getValor;
    orm.usuarioId = domain.getUsuarioId?.getValor;
    orm.estado = domain.getEstado;
    orm.completa = domain.getCompleta;
    orm.bloqueada = domain.getBloqueada;
    orm.cierreAutomatico = domain.getCierreAutomatico;
    orm.yaGuardada = domain.getYaGuardada;
    orm.fechaInicio = domain.getFechaInicio;
    orm.fechaLimite = domain.getFechaLimite;
    orm.fechaUltimoCierre = domain.getFechaUltimoCierre;
    orm.extendido = domain.getExtendido;
    orm.datoBorrador = domain.getDatoBorrador as unknown as Record<string, unknown>;
    orm.datoConfirmado = domain.getDatoConfirmado as unknown as Record<string, unknown>;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }
}
