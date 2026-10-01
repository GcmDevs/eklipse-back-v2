import { AnexoMapper } from '@core/media/infrastructure/mappers';
import { RegistroActividad } from '@equipos/domain/entities';
import { RegistroActividadRead } from '@equipos/domain/read';
import { EquipoOrm, FormatoOrm, PlanActividadOrm, RegistroActividadOrm } from '@orm/inn/equipos';
import { EquipoMapper } from '../equipos.mapper';
import { AsignacionRecursoActividadMapper } from './asignacion-recurso-actividad.mapper';
import { FormatoMapper } from './formato.mapper';
import { PlanActividadMapper } from './plan-actividad.mapper';
import { ReprogramacionActividadMapper } from './reprogramacion-actividad.mapper';
import { RecursoMapper } from './recurso.mapper';
import { EjecucionExternaMapper } from './ejecucion-externa.mapper';

export class RegistroActividadMapper {
  static toDomain(orm: RegistroActividadOrm): RegistroActividad {
    return RegistroActividad.rebuild(
      orm.id,
      orm.codigo,
      orm.equipo?.id ?? null,
      orm.formato?.id ?? null,
      orm.planActividad?.id ?? null,
      orm.tipo,
      orm.origen,
      orm.naturaleza,
      orm.modalidadPlanificada ?? null,
      orm.modalidadEjecutada ?? null,
      orm.fechaProgramada ?? null,
      orm.fechaRealizacion ?? null,
      orm.duracionMinutos ?? null,
      orm.fechaInicio ?? null,
      orm.fechaFinalizacion ?? null,
      orm.diasDesviacion ?? null,
      orm.estado,
      orm.prioridad ?? null,
      orm.observaciones ?? null,
      orm.motivoAnulacion ?? null,
      orm.tecnicoResponsableId ?? null,
      orm.solicitadoPorId ?? null,
      orm.aprobadoPorId ?? null,
      orm.fechaAprobacion ?? null,
      orm.motivoRechazo ?? null,
      orm.costoManoObra ?? null,
      orm.costoRepuestos ?? null,
      orm.costoTotal ?? null,
      ReprogramacionActividadMapper.toDomainList(orm.reprogramaciones ?? []),
      orm.createdAt,
      orm.updatedAt
    );
  }

  static toOrm(domain: RegistroActividad): RegistroActividadOrm {
    const orm = new RegistroActividadOrm();

    const id = domain.getId?.getValor;
    if (id) orm.id = id;

    const equipoId = domain.getEquipoId?.getValor;
    if (equipoId) {
      const equipo = new EquipoOrm();
      equipo.id = equipoId;
      orm.equipo = equipo;
    }

    const formatoId = domain.getFormatoId?.getValor;
    if (formatoId) {
      const formato = new FormatoOrm();
      formato.id = formatoId;
      orm.formato = formato;
    }

    const planActividadId = domain.getPlanActividadId?.getValor;
    if (planActividadId) {
      const plan = new PlanActividadOrm();
      plan.id = planActividadId;
      orm.planActividad = plan;
    }

    orm.codigo = domain.getCodigo;
    orm.tipo = domain.getTipoActividad;
    orm.origen = domain.getOrigen;
    orm.naturaleza = domain.getNaturalezaIntervencion;
    orm.estado = domain.getEstado;
    orm.prioridad = domain.getPrioridad;
    orm.modalidadPlanificada = domain.getModalidadPlanificada;
    orm.modalidadEjecutada = domain.getModalidadEjecutada;
    orm.fechaProgramada = domain.getFechaProgramada;
    orm.fechaRealizacion = domain.getFechaRealizacion;
    orm.fechaInicio = domain.getFechaInicio;
    orm.fechaFinalizacion = domain.getFechaFinalizacion;
    orm.duracionMinutos = domain.getDuracionMinutos;
    orm.diasDesviacion = domain.getDiasDesviacion;
    orm.observaciones = domain.getObservaciones;
    orm.motivoAnulacion = domain.getMotivoAnulacion;
    orm.tecnicoResponsableId = domain.getTecnicoResponsableId;
    orm.solicitadoPorId = domain.getSolicitadoPorId;
    orm.aprobadoPorId = domain.getAprobadoPorId;
    orm.fechaAprobacion = domain.getFechaAprobacion;
    orm.motivoRechazo = domain.getMotivoRechazo;
    orm.costoManoObra = domain.getCostoManoObra;
    orm.costoRepuestos = domain.getCostoRepuestos;
    orm.costoTotal = domain.getCostoTotal;
    orm.reprogramaciones = ReprogramacionActividadMapper.toOrmList(domain.getReprogramaciones);
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;

    return orm;
  }

  static toUpdateOrm(domain: RegistroActividad): Partial<RegistroActividadOrm> {
    return {
      id: domain.getId?.getValor,
      codigo: domain.getCodigo,
      estado: domain.getEstado,
      prioridad: domain.getPrioridad,
      modalidadEjecutada: domain.getModalidadEjecutada,
      fechaProgramada: domain.getFechaProgramada,
      fechaRealizacion: domain.getFechaRealizacion,
      fechaInicio: domain.getFechaInicio,
      fechaFinalizacion: domain.getFechaFinalizacion,
      duracionMinutos: domain.getDuracionMinutos,
      diasDesviacion: domain.getDiasDesviacion,
      observaciones: domain.getObservaciones,
      motivoAnulacion: domain.getMotivoAnulacion,
      tecnicoResponsableId: domain.getTecnicoResponsableId,
      aprobadoPorId: domain.getAprobadoPorId,
      fechaAprobacion: domain.getFechaAprobacion,
      motivoRechazo: domain.getMotivoRechazo,
      costoManoObra: domain.getCostoManoObra,
      costoRepuestos: domain.getCostoRepuestos,
      costoTotal: domain.getCostoTotal,
      updatedAt: domain.getUpdatedAt,
    };
  }

  static toView(orm: RegistroActividadOrm): RegistroActividadRead {
    const asignaciones = orm.asignacionesRecurso ?? [];
    const asignacionActiva = asignaciones.find(asig => asig.activa) ?? null;

    return {
      id: orm.id,
      codigo: orm.codigo,
      equipoId: orm.equipo?.id ?? null,
      equipo: orm.equipo ? EquipoMapper.toMinimalView(orm.equipo) : null,
      formatoId: orm?.formato?.id ?? null,
      formato: orm.formato ? FormatoMapper.toView(orm.formato) : null,
      planActividadId: orm.planActividad?.id ?? null,
      planActividad: orm.planActividad ? PlanActividadMapper.toView(orm.planActividad) : null,
      tipo: orm.tipo,
      origen: orm.origen,
      naturaleza: orm.naturaleza,
      estado: orm.estado,
      prioridad: orm.prioridad ?? null,
      modalidadPlanificada: orm.modalidadPlanificada ?? null,
      modalidadEjecutada: orm.modalidadEjecutada ?? null,
      fechaProgramada: orm.fechaProgramada ?? null,
      fechaRealizacion: orm.fechaRealizacion ?? null,
      fechaInicio: orm.fechaInicio ?? null,
      fechaFinalizacion: orm.fechaFinalizacion ?? null,
      duracionMinutos: orm.duracionMinutos ?? null,
      diasDesviacion: orm.diasDesviacion ?? null,
      observaciones: orm.observaciones ?? null,
      motivoAnulacion: orm.motivoAnulacion ?? null,
      tecnicoResponsableId: orm.tecnicoResponsableId ?? null,
      solicitadoPorId: orm.solicitadoPorId ?? null,
      registroDilgId: orm?.registroDilgId ?? null,
      aprobadoPorId: orm.aprobadoPorId ?? null,
      ejecucionExterna: orm.ejecucionExterna
        ? EjecucionExternaMapper.toView(orm.ejecucionExterna)
        : null,
      fechaAprobacion: orm.fechaAprobacion ?? null,
      motivoRechazo: orm.motivoRechazo ?? null,
      costoManoObra: orm.costoManoObra ?? null,
      costoRepuestos: orm.costoRepuestos ?? null,
      costoTotal: orm.costoTotal ?? null,
      reprogramaciones: (orm.reprogramaciones ?? []).map(ReprogramacionActividadMapper.toView),
      recursoId: asignacionActiva?.recursoId ?? null,
      recurso: asignacionActiva?.recurso ? RecursoMapper.toView(asignacionActiva.recurso) : null,
      asignacionRecurso: asignacionActiva
        ? AsignacionRecursoActividadMapper.toView(asignacionActiva)
        : null,
      anexos: orm.anexos ? AnexoMapper.toViewList(orm.anexos) : [],
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    };
  }

  static toDomainList(orms: RegistroActividadOrm[]): RegistroActividad[] {
    return (orms ?? []).map(o => this.toDomain(o));
  }

  static toViewList(orms: RegistroActividadOrm[]): RegistroActividadRead[] {
    return (orms ?? []).map(o => this.toView(o));
  }
}
