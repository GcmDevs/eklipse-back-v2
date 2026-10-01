import { Anexo } from "@core/media/domain/entities";
import { AnexoRead } from "@core/media/domain/read/media.read";
import { AnexoOrm } from "@orm/cor";
import { ArchivoAlmacenadoMapper } from "./archivo-almacenado.mapper";

export class AnexoMapper {
    static toDomain(orm: AnexoOrm): Anexo {
        return Anexo.rebuild(
            orm.id,
            orm.entidadTipo,
            orm.entidadId,
            orm.archivoId,
            orm.nombre,
            orm.orden,
            orm.createdAt,
            orm.updatedAt,
            orm.observaciones ?? undefined
        );
    }

    static toOrm(domain: Anexo): AnexoOrm {
        const orm = new AnexoOrm();

        orm.id = domain.getId.getValor;
        orm.entidadTipo = domain.getEntidadTipo;
        orm.entidadId = domain.getEntidadId.getValor;
        orm.archivoId = domain.getArchivoId;
        orm.nombre = domain.getNombre;
        orm.observaciones = domain.getObservaciones ?? null;
        orm.orden = domain.getOrden;
        orm.createdAt = domain.getCreatedAt;
        orm.updatedAt = domain.getUpdatedAt;

        return orm;
    }

    static toView(orm: AnexoOrm): AnexoRead {
        return {
            id: orm.id,
            nombre: orm?.nombre,
            archivo: orm.archivo ? ArchivoAlmacenadoMapper.toView(orm.archivo) : null,
            orden: orm.orden,
            observaciones: orm?.observaciones
        };
    }

    static toDomainList(orms: AnexoOrm[]): Anexo[] {
        return orms.map(orm => this.toDomain(orm));
    }

    static toOrmList(domains: Anexo[]): AnexoOrm[] {
        return domains?.map(domain => this.toOrm(domain));
    }

    static toViewList(domains: AnexoOrm[]) {
        if (domains?.length <= 0) return []
        return domains.map(anexo => this.toView(anexo));
    }
}