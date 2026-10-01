import { PlanActividad } from '@equipos/domain/entities';
import { PlanActividadRead } from '@equipos/domain/read';
import { PeriodoDeTiempo } from '@equipos/domain/value-objects';
import { EquipoOrm, FormatoOrm, PlanActividadOrm } from '@orm/inn/equipos';
import { FormatoMapper } from './formato.mapper';

export class PlanActividadMapper {
    static toOrm(domain: PlanActividad): PlanActividadOrm {
        const orm = new PlanActividadOrm();

        if (domain.getId.getValor) {
            orm.id = domain.getId.getValor;
        }

        if (domain.getEquipoId?.getValor) {
            orm.equipo = { id: domain.getEquipoId.getValor } as EquipoOrm;
        }

        if (domain.getFormatoId?.getValor) {
            orm.formato = { id: domain.getFormatoId.getValor } as FormatoOrm;
        }
        orm.tipo = domain.getTipo;
        orm.seRealizaPorExterno = domain?.getSeRealizaPorExterno;
        orm.estado = domain.getEstado;
        orm.periocidad = domain?.getPeriocidad ? domain.getPeriocidad.toPrimitives() : null;
        orm.fechaUltimaEjecucion = domain?.getFechaUltimaEjecucion;
        orm.fechaProximaEjecucion = domain?.getFechaProximaEjecucion;
        orm.diasAnticipacionNotificacion = domain?.getdiasAnticipacionNotificacion;
        orm.origenInicializacion = domain.getOrigenInicializacion;
        orm.fechaInicializacion = domain.getFechaInicializacion;
        orm.observaciones = domain?.getObservaciones;

        return orm;
    }


    static toDomain(orm: PlanActividadOrm): PlanActividad {
        return PlanActividad.rebuild(
            orm.id,
            orm.tipo,
            orm.equipo?.id,
            orm.formato?.id,
            orm.estado,
            (orm.periocidad?.valor != null && orm.periocidad?.unidad != null)
                ? PeriodoDeTiempo.create(orm.periocidad.valor, orm.periocidad.unidad)
                : null,
            orm?.seRealizaPorExterno,
            orm.fechaUltimaEjecucion,
            orm.fechaProximaEjecucion,
            orm.diasAnticipacionNotificacion,
            orm.origenInicializacion,
            orm.fechaInicializacion,
            orm?.observaciones
        );
    }


    static toUpdateAfterEjecuciontOrm(planActividad: PlanActividad): Partial<PlanActividadOrm> {
        const updateplanActividadOrm: Partial<PlanActividadOrm> = {
            id: planActividad.getId.getValor,
            estado: planActividad.getEstado,
            fechaUltimaEjecucion: planActividad.getFechaUltimaEjecucion,
            fechaProximaEjecucion: planActividad.getFechaProximaEjecucion,
            observaciones: planActividad?.getObservaciones
        };

        return updateplanActividadOrm;
    }

    static toUpdateOrm(
        planActividad: PlanActividad,
        equipoId: number
    ): Partial<PlanActividadOrm> {
        return {
            id: planActividad.getId?.getValor,
            equipo: { id: equipoId } as EquipoOrm,
            formato: planActividad.getFormatoId?.getValor
                ? { id: planActividad.getFormatoId.getValor } as FormatoOrm
                : null,
            tipo: planActividad.getTipo,
            periocidad: planActividad.getPeriocidad
                ? planActividad.getPeriocidad.toPrimitives()
                : null,
            estado: planActividad.getEstado,
            
            fechaUltimaEjecucion: planActividad.getFechaUltimaEjecucion,
            fechaProximaEjecucion: planActividad.getFechaProximaEjecucion,
            origenInicializacion: planActividad.getOrigenInicializacion,
            fechaInicializacion: planActividad.getFechaInicializacion,
            diasAnticipacionNotificacion: planActividad.getdiasAnticipacionNotificacion,
            observaciones: planActividad.getObservaciones,
        };
    }


    static toView(
        orm: PlanActividadOrm
    ): PlanActividadRead {
        return {
            id: orm.id,
            equipoId: orm?.equipo?.id,
            formato: orm?.formato ? FormatoMapper.toView(orm?.formato) : null,
            estado: orm.estado,
            periocidad:
                orm.periocidad?.valor != null &&
                    orm.periocidad?.unidad != null
                    ? PeriodoDeTiempo.create(
                        orm.periocidad.valor,
                        orm.periocidad.unidad
                    )
                    : null,
            seRealizaPorExterno: orm?.seRealizaPorExterno ?? false,
            diasAnticipacionNotificacion: orm.diasAnticipacionNotificacion,
            fechaUltimaEjecucion: orm.fechaUltimaEjecucion,
            fechaProximaEjecucion: orm.fechaProximaEjecucion,
            origenInicializacion: orm.origenInicializacion,
            fechaInicializacion: orm.fechaInicializacion,
            observaciones: orm?.observaciones
        };
    }

    static toDomainList(ormList: PlanActividadOrm[]): PlanActividad[] {
        return ormList.map(orm => this.toDomain(orm));
    }

    static toOrmList(entities: PlanActividad[]): PlanActividadOrm[] {
        return entities.map(ent => this.toOrm(ent));
    }

    static toViewList(ormList: PlanActividadOrm[]): PlanActividadRead[] {
        return ormList.map(orm => this.toView(orm));
    }
}