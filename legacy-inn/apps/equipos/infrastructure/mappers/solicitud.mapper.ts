import { safeParseJson } from "@common/application/services";
import { SolicitudAprobacion } from "@equipos/domain/entities";
import { EquipoMinimalRead,SolicitudRead } from "@equipos/domain/read";
import { SolicitudAprobacionOrm } from "@orm/inn/equipos/solicitud-aprobacion.orm";
import { EquipoMapper } from "./equipos.mapper";

export class SolicitudAprobacionMapper {
  static toDomain(orm: SolicitudAprobacionOrm): SolicitudAprobacion {
    return SolicitudAprobacion.rebuild(
      orm.id,
      orm.codigo,
      orm.equipoId,
      orm.tipoAccion,
      orm.estado,
      orm.solicitanteId,
      orm.solicitanteNombre,
      orm.aprobadorId ?? null,
      orm.aprobadorNombre ?? null,
      orm.fechaResolucion ?? null,
      safeParseJson(orm.payload, {}),
      orm.motivoRechazo ?? null,
      orm.esAutoAprobada,
      orm.correlationId,
      orm.createdAt,
      orm.updatedAt,
    );
  }

  static toOrm(domain: SolicitudAprobacion): SolicitudAprobacionOrm {
    const orm = new SolicitudAprobacionOrm();
    const id = domain.getId.getValor;
    if (id) orm.id = id;
    orm.codigo = domain.getCodigo;
    orm.equipoId = domain.getEquipoId.getValor;
    orm.tipoAccion = domain.getTipoAccion;
    orm.estado = domain.getEstado;
    orm.solicitanteId = domain.getSolicitanteId.getValor;
    orm.solicitanteNombre = domain.getSolicitanteNombre;
    orm.aprobadorId = domain.getAprobadorId?.getValor ?? null;
    orm.aprobadorNombre = domain.getAprobadorNombre ?? null;
    orm.fechaResolucion = domain.getFechaResolucion ?? null;
    orm.payload = JSON.stringify(domain.getPayload);
    orm.motivoRechazo = domain.getMotivoRechazo ?? null;
    orm.esAutoAprobada = domain.getEsAutoAprobada;
    orm.correlationId = domain.getCorrelationId;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }



  static toUpdateOrm(domain: SolicitudAprobacion): Partial<SolicitudAprobacionOrm> {
    return {
      id: domain.getId.getValor,
      estado: domain.getEstado,
      aprobadorId: domain.getAprobadorId?.getValor ?? null,
      aprobadorNombre: domain.getAprobadorNombre ?? null,
      fechaResolucion: domain.getFechaResolucion ?? null,
      motivoRechazo: domain.getMotivoRechazo ?? null,
      updatedAt: domain.getUpdatedAt,
    };
  }



  static toView(orm: SolicitudAprobacionOrm): SolicitudRead {
    return {
      id: orm.id,
      codigo: orm.codigo,
      equipo: orm?.equipo
        ? EquipoMapper.toMinimalView(orm.equipo)
        : { id: orm.equipoId } as EquipoMinimalRead,
      tipoAccion: orm.tipoAccion,
      estado: orm.estado,
      solicitante: {
        id: orm.solicitanteId,
        nombreCompleto: orm.solicitanteNombre
      },
      aprobador: {
        id: orm?.aprobadorId ?? null,
        nombreCompleto: orm?.aprobadorNombre ?? null,
      },
      fechaResolucion: orm?.fechaResolucion ?? null,
      payload: safeParseJson(orm.payload, {}),
      motivoRechazo: orm?.motivoRechazo ?? null,
      esAutoAprobada: orm.esAutoAprobada,
      tiempoResolucion: orm.tiempoResolucionMin,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    };
  }
}

