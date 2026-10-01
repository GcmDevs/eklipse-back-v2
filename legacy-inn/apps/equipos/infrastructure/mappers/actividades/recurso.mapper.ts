import { AsignacionRecursoUsuario, Recurso } from "@equipos/domain/entities";
import { RecursoAsignacionTecnicoRead } from "@equipos/domain/read";
import { AsignacionRecursoUsuarioOrm } from "@orm/inn/equipos/pool-recursos/asignacion-usuario-recurso.orm";
import { RecursoOrm } from "@orm/inn/equipos/pool-recursos/recurso.orm";

export class RecursoMapper {
    static toOrm(domain: Recurso): RecursoOrm {
        const orm = new RecursoOrm();

        orm.id = domain.getId.getValor ?? undefined;

        orm.nombre = domain.getNombre;
        orm.activo = domain.isActivo;

        orm.asignaciones = domain.getAsignaciones.map(a =>
            this.asignacionTecnicoToOrm(a),
        );

        orm.createdAt = domain.getCreatedAt;
        orm.updatedAt = domain.getUpdatedAt;

        return orm;
    }

    static toDomain(orm: RecursoOrm): Recurso {
        return Recurso.rebuild(
            orm.id,
            orm.nombre,
            orm.activo,
            orm.asignaciones?.map(a => this.asignacionTecnicoToDomain(a)) ?? [],
            orm.createdAt,
            orm.updatedAt,
        );
    }

    static toView(orm: RecursoOrm) {
        return {
            id: orm.id,
            nombre: orm.nombre,
            activo: orm.activo,

            usuarioActivoId:
                orm.asignaciones?.find(a => a.activa)?.usuarioId ?? null,

            asignacionActiva:
                orm.asignaciones?.find(a => a.activa)
                    ? this.asignacionTecnicoToView(
                        orm.asignaciones.find(a => a.activa)!,
                    )
                    : null,
            asignaciones:
                orm.asignaciones?.map(a => this.asignacionTecnicoToView(a)) ?? [],

            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        };
    }

    static toDomainList(ormList: RecursoOrm[]): Recurso[] {
        return ormList.map(orm => this.toDomain(orm));
    }

    static toViewList(ormList: RecursoOrm[]) {
        return ormList.map(orm => this.toView(orm));
    }


    static asignacionTecnicoToOrm(
        domain: AsignacionRecursoUsuario,
    ): AsignacionRecursoUsuarioOrm {
        const orm = new AsignacionRecursoUsuarioOrm();

        orm.id = domain.getId.getValor ?? undefined;

        orm.recursoId = domain.getRecursoId.getValor;
        orm.usuarioId = domain.getUsuarioId.getValor;

        orm.fechaInicio = domain.getFechaInicio;
        orm.fechaFin = domain.getFechaFin;

        orm.activa = domain.isActiva;
        orm.motivoAsignacion = { motivo: domain.getMotivoAsignacion, detalle: domain.getMotivoAsignacionDetalle };
        orm.motivoFinalizacion = { motivo: domain.getMotivoFinalizacion, detalle: domain.getMotivoFinalizacion };
        orm.asignadoPorId = domain.getAsignadoPorId.getValor;
        orm.finalizadoPorId = domain.getFinalizadoPorId?.getValor ?? null;
        orm.createdAt = domain.getCreatedAt;
        orm.observaciones = domain?.getObservaciones

        return orm;
    }

    static asignacionTecnicoToDomain(
        orm: AsignacionRecursoUsuarioOrm,
    ): AsignacionRecursoUsuario {
        return AsignacionRecursoUsuario.rebuild(
            orm.id,
            orm.recursoId,
            orm.usuarioId,
            orm.fechaInicio,
            orm.fechaFin,
            orm.activa,
            orm.motivoAsignacion.motivo,
            orm.motivoAsignacion.detalle,
            orm.motivoFinalizacion.motivo,
            orm.motivoFinalizacion.detalle,
            orm.asignadoPorId,
            orm.finalizadoPorId,
            orm.createdAt,
            orm?.observaciones
        );
    }

    static asignacionTecnicoToView(
        orm: AsignacionRecursoUsuarioOrm,
    ): RecursoAsignacionTecnicoRead {
        return {
            id: orm.id,
            recursoId: orm.recursoId,
            usuarioId: orm.usuarioId,
            usuario: orm.usuario ?? null,
            fechaInicio: orm.fechaInicio,
            fechaFin: orm.fechaFin,
            activa: orm.activa,
            motivoAsignacion: orm.motivoAsignacion.motivo,
            motivoAsignacionDetalle: orm.motivoAsignacion.detalle,
            motivoFinalizacion: orm.motivoAsignacion.motivo,
            motivoFinalizacionDetalle: orm.motivoAsignacion.detalle,
            asignadoPorId: orm.asignadoPorId,
            finalizadoPorId: orm?.asignadoPorId,
            observaciones: orm?.observaciones,
            createdAt: orm.createdAt,
        };
    }

    static asignacionTecnicoToDomainList(
        ormList: AsignacionRecursoUsuarioOrm[],
    ): AsignacionRecursoUsuario[] {
        return ormList.map(orm => this.asignacionTecnicoToDomain(orm));
    }

    static asignacionTecnicoToViewList(
        ormList: AsignacionRecursoUsuarioOrm[],
    ) {
        return ormList.map(orm => this.asignacionTecnicoToView(orm));
    }
}