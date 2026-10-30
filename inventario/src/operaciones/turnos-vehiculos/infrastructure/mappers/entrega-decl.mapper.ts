import { EntregaDeclaracion } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import {
  CausaCierreDeclaracion,
  EstadoDeclaracion,
  ModalidadDeclaracion,
  RolDeclaracion,
} from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { EntregaDatosJson } from '@inn/operaciones/turnos-vehiculos/domain/types';
import { AmbEntregaDeclOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-entrega-decl.orm';

export class EntregaDeclMapper {
  static toDomain(orm: AmbEntregaDeclOrm): EntregaDeclaracion {
    return EntregaDeclaracion.rebuild(
      orm.id,
      orm.entregaId,
      orm.rol as RolDeclaracion,
      orm.usuarioId,
      orm.fechaInicio,
      orm.estado as EstadoDeclaracion,
      orm.modalidad as ModalidadDeclaracion,
      orm.causaCierre as CausaCierreDeclaracion,
      orm.limiteEdicion,
      orm.fechaCierre,
      orm.datos as unknown as EntregaDatosJson,
      orm.createdAt,
      orm.updatedAt,
      orm.extendido ?? false,
    );
  }

  static toOrm(domain: EntregaDeclaracion): AmbEntregaDeclOrm {
    const orm = new AmbEntregaDeclOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.entregaId = domain.getEntregaId.getValor;
    orm.rol = domain.getRol;
    orm.usuarioId = domain.getUsuarioId.getValor;
    orm.fechaInicio = domain.getFechaInicio;
    orm.estado = domain.getEstado;
    orm.modalidad = domain.getModalidad;
    orm.causaCierre = domain.getCausaCierre;
    orm.limiteEdicion = domain.getLimiteEdicion;
    orm.fechaCierre = domain.getFechaCierre;
    orm.datos = domain.getDatos as unknown as Record<string, unknown>;
    orm.extendido = domain.getExtendido;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }
}
