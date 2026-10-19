import { AsignacionRecursoActividad } from '@equipos/domain/entities';
import { AsignacionRecursoActividadRead } from '@equipos/domain/read';
import { AsingacionRecursoActividadOrm } from '@orm/inn/equipos/pool-recursos/asignacion-actividad-recurso.orm';

export class AsignacionRecursoActividadMapper {
  static toDomain(orm: AsingacionRecursoActividadOrm): AsignacionRecursoActividad {
    return AsignacionRecursoActividad.rebuild(
      orm.id,
      orm.actividadId,
      orm.recursoId,
      orm.activa,
      orm.fechaAsignacion,
      orm.fechaFinalizacion ?? null,
      orm.asignadoPorId,
      orm.finalizadoPorId ?? null,
      orm.motivoAsignacion.motivo ?? null,
      orm.motivoAsignacion.detalle ?? null,
      orm.motivoFinalizacion.motivo ?? null,
      orm.motivoFinalizacion.detalle ?? null,
      orm.observaciones ?? null,
      orm.createdAt,
      orm.updatedAt
    );
  }

  static toOrm(domain: AsignacionRecursoActividad): Partial<AsingacionRecursoActividadOrm> {
    const id = domain.getId?.getValor;
    return {
      ...(id ? { id } : {}),
      actividadId: domain.getActividadId.getValor,
      recursoId: domain.getRecursoId.getValor,
      activa: domain.isActiva,
      fechaAsignacion: domain.getFechaAsignacion,
      fechaFinalizacion: domain.getFechaFinalizacion,
      asignadoPorId: domain.getAsignadoPorId.getValor,
      finalizadoPorId: domain.getFinalizadoPorId?.getValor ?? null,
      motivoAsignacion: {
        motivo: domain.getMotivoAsignacion,
        detalle: domain.getMotivoAsignacionDetalle,
      },
      motivoFinalizacion: {
        motivo: domain.getMotivoFinalizacion,
        detalle: domain.getMotivoFinalizacionDetalle,
      },
      observaciones: domain.getObservaciones,
      updatedAt: domain.getUpdatedAt,
    };
  }

  static toView(orm: AsingacionRecursoActividadOrm): AsignacionRecursoActividadRead {
    return {
      id: orm.id,
      actividadId: orm.actividadId,
      recursoId: orm.recursoId,
      activa: orm.activa,
      fechaAsignacion: orm.fechaAsignacion,
      fechaFinalizacion: orm.fechaFinalizacion ?? null,
      asignadoPorId: orm.asignadoPorId,
      finalizadoPorId: orm.finalizadoPorId ?? null,
      motivoAsignacion: orm.motivoAsignacion.motivo ?? null,
      motivoAsignacionDetalle: orm.motivoAsignacion.detalle ?? null,
      motivoFinalizacion: orm.motivoFinalizacion.motivo ?? null,
      motivoFinalizacionDetalle: orm.motivoFinalizacion.detalle ?? null,
      observaciones: orm.observaciones ?? null,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    };
  }

  static toDomainList(orms: AsingacionRecursoActividadOrm[]): AsignacionRecursoActividad[] {
    return (orms ?? []).map(o => this.toDomain(o));
  }

  static toViewList(orms: AsingacionRecursoActividadOrm[]): AsignacionRecursoActividadRead[] {
    return (orms ?? []).map(o => this.toView(o));
  }
}
