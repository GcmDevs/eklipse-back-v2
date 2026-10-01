import { ReprogramacionActividad } from '@equipos/domain/entities';
import { ReprogramacionMantenimientoRead } from '@equipos/domain/read';
import { PlanActividadOrm, RegistroActividadOrm, ReprogramacionActividadOrm } from '@orm/inn/equipos';

export class ReprogramacionActividadMapper {

    static toDomain(orm: ReprogramacionActividadOrm): ReprogramacionActividad {
        return ReprogramacionActividad.rebuild(
            orm.id,
            orm.planActividad?.id,
            orm.equipoId,
            orm.registroActividad?.id,
            orm.motivo,
            orm.fechaProgramaOriginal,
            orm.fechaReprogramada,
            orm.activa,
            orm.createdAt,
            orm.updatedAt,
            orm?.motivoDetalle,
        );
    }


    static toOrm(domain: ReprogramacionActividad): ReprogramacionActividadOrm {
        const orm = new ReprogramacionActividadOrm();

        const id = domain.getId?.getValor;
        if (id !== undefined) orm.id = id;

        const planId = domain.getplanActividadId?.getValor;
        if (planId !== undefined && planId) {
            const plan = new PlanActividadOrm();
            plan.id = planId;
            orm.planActividad = plan;
        }

        const equipoId = domain.getEquipoId?.getValor;
        if (equipoId !== undefined) orm.equipoId = equipoId;

        const registroId = domain.getRegistroActividad?.getValor;
        if (registroId !== undefined && registroId) {
            const reg = new RegistroActividadOrm();
            reg.id = registroId;
            orm.registroActividad = reg;
        }

        orm.fechaProgramaOriginal = domain.getFechaProgramaOriginal;
        orm.fechaReprogramada = domain.getFechaReprogramada;
        orm.motivo = domain.getMotivo;
        orm.motivoDetalle = domain?.getMotivoDetalle;
        orm.activa = domain.getActiva;
        orm.createdAt = domain.getCreatedAt;
        orm.updatedAt = domain.getUpdatedAt;

        return orm;
    }


    static toUpdateOrm(domain: ReprogramacionActividad): Partial<ReprogramacionActividadOrm> {
        const updateOrm: Partial<ReprogramacionActividadOrm> = {
            id: domain.getId?.getValor,
            fechaProgramaOriginal: domain.getFechaProgramaOriginal,
            fechaReprogramada: domain.getFechaReprogramada,
            motivo: domain.getMotivo,
            motivoDetalle: domain?.getMotivoDetalle,
            activa: domain.getActiva,
            updatedAt: domain.getUpdatedAt,
        }
        return updateOrm;
    }


    static toView(
        orm: ReprogramacionActividadOrm
    ): ReprogramacionMantenimientoRead {
        return {
            id: orm.id,
            planActividadId: orm.planActividad?.id ?? null,
            equipoId: orm?.equipoId ?? null,
            registroActividadId: orm.registroActividad?.id ?? null,
            fechaProgramaOriginal: orm.fechaProgramaOriginal,
            fechaReprogramada: orm.fechaReprogramada,
            motivo: orm.motivo,
            motivoDetalle: orm?.motivoDetalle ?? null,
            activa: orm.activa,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
        };
    }

    static toDomainList(orms: ReprogramacionActividadOrm[]): ReprogramacionActividad[] {
        if (!orms || orms.length < 1) return [];
        return orms.map(orm => this.toDomain(orm));
    }

    static toOrmList(domains: ReprogramacionActividad[]): ReprogramacionActividadOrm[] {
        if (!domains || domains.length < 1) return [];
        return domains.map(domain => this.toOrm(domain));
    }

    static toUpdateOrmList(domains: ReprogramacionActividad[]): Partial<ReprogramacionActividadOrm>[] {
        if (!domains || domains.length < 1) return [];
        return domains.map(domain => this.toUpdateOrm(domain));
    }
}

