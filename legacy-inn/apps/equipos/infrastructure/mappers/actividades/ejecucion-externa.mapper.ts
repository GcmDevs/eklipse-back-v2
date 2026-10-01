import { AnexoMapper } from "@core/media/infrastructure/mappers";
import { EjecucionExterna } from "@equipos/domain/entities";
import { EjecucionExternaRead } from "@equipos/domain/read";
import { EjecucionExternaOrm } from "@orm/inn/equipos";


export class EjecucionExternaMapper {

    static toOrm(domain: EjecucionExterna): EjecucionExternaOrm {
        const orm = new EjecucionExternaOrm();

        orm.id = domain.getId.getValor ?? undefined;

        orm.registroActividadId = domain.getRegistroActividadId.getValor;

        orm.tipoEjecutor = domain.getTipoEjecutor;
        orm.tecnicoNombre = domain.getTecnicoNombre;

        orm.terceroTecnicoId = domain.getTerceroTecnicoId;
        orm.empresaTerceroId = domain.getEmpresaTerceroId;

        orm.empresaNombre = domain.getEmpresaNombreSnapshot;

        orm.observaciones = domain.getObservaciones;

        orm.esExcepcional = domain.getEsExcepcional;
        orm.motivoExcepcional = domain.getMotivoExcepcional;
        orm.motivoExcepcionalDetalle = domain.getMotivoExcepcionalDetalle;

        orm.fechaEjecucion = domain.getFechaEjecucion;

        orm.anexos = domain?.getAnexos ? AnexoMapper.toOrmList(domain.getAnexos) : [];

        orm.createdAt = domain.getCreatedAt;
        orm.updatedAt = domain.getUpdatedAt;

        return orm;
    }

    static toDomain(orm: EjecucionExternaOrm): EjecucionExterna {
        return EjecucionExterna.rebuild(
            orm.id,
            orm.registroActividadId,
            orm.tipoEjecutor,
            orm.tecnicoNombre,
            orm.fechaEjecucion,
            orm.terceroTecnicoId,
            orm.empresaTerceroId,
            orm.empresaNombre,
            orm.observaciones,
            orm.esExcepcional,
            orm.motivoExcepcional,
            orm.motivoExcepcionalDetalle,
            orm.anexos ? AnexoMapper.toDomainList(orm.anexos) : [],
            orm.createdAt,
            orm.updatedAt,
        );
    }

    static toView(
        orm: EjecucionExternaOrm,
    ): EjecucionExternaRead {
        return {
            id: orm.id,
            createdAt: orm.createdAt,
            updatedAt: orm.updatedAt,
            tipoEjecutor: orm.tipoEjecutor,
            nombreTecnico: orm.tecnicoNombre,

            terceroTecnicoId: orm.terceroTecnicoId,
            terceroTecnico: orm.terceroTecnico ?? null,

            empresaTerceroId: orm.empresaTerceroId,
            empresaTercero: orm.empresaTercero ?? null,

            empresaNombre: orm.empresaNombre,
            observaciones: orm.observaciones,

            esExcepcional: orm.esExcepcional,
            motivoExcepcional: orm.motivoExcepcional,
            motivoExcepcionalDetalle: orm.motivoExcepcionalDetalle,

            fechaEjecucion: orm.fechaEjecucion,

            anexos: orm.anexos ? AnexoMapper.toViewList(orm.anexos) : [],
        };
    }

    static toDomainList(
        ormList: EjecucionExternaOrm[],
    ): EjecucionExterna[] {
        return ormList.map(this.toDomain);
    }

    static toViewList(
        ormList: EjecucionExternaOrm[],
    ): EjecucionExternaRead[] {
        return ormList.map(this.toView);
    }
}