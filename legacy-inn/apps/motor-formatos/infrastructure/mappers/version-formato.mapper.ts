import { VersionFormatoFmt } from "apps/motor-formatos/domain";
import { VersionFormatoFmtOrm } from "../persistence";
import { SeccionVersionFormatoMapper } from "./secciones";


export class VersionFormatoMapper {
    static toOrm(domain: VersionFormatoFmt): VersionFormatoFmtOrm {
        const orm = new VersionFormatoFmtOrm();

        orm.id = domain.getId.getValor ?? undefined;

        orm.formatoId = domain.getFormatoId.getValor;

        orm.version = domain.getVersion;
        orm.etiquetaVersion = domain.getEtiquetaVersion;
        orm.estado = domain.getEstado as any;

        orm.configuracionSecImagenesId = domain.getConfiguracionImagenesId.getValor;
        orm.schema = domain.getSchema ?? {};

        orm.publicadoPorId = domain.getPublicadoPorId?.getValor ?? null;
        orm.fechaPublicacion = domain.getFechaPublicacion ?? null;

        orm.creadoPor = domain.getCreadoPor;
        orm.creadoPorId = domain.getCreadoPorId.getValor;

        orm.secciones = domain.getSecciones?.map(sec =>
            SeccionVersionFormatoMapper.toOrm(sec)
        ) ?? [];

        orm.createdAt = domain.getCreatedAt;
        orm.updatedAt = domain.getUpdatedAt;

        return orm;
    }

    static toDomain(orm: VersionFormatoFmtOrm): VersionFormatoFmt {
        return VersionFormatoFmt.rebuild(
            orm.id,
            orm.formatoId,
            orm.version,
            orm.etiquetaVersion,
            orm.estado,
            orm.secciones?.map(sec =>
                SeccionVersionFormatoMapper.toDomain(sec)
            ) ?? [],
            orm.configuracionSecImagenesId,
            orm.schema ?? {},
            orm.publicadoPorId,
            orm.fechaPublicacion,
            orm.creadoPor,
            orm.creadoPorId,
            orm.createdAt,
            orm.updatedAt
        );
    }

    static toDomainList(ormList: VersionFormatoFmtOrm[]): VersionFormatoFmt[] {
        return ormList.map(this.toDomain);
    }


    static toSchema(version: VersionFormatoFmtOrm): any {
        return {
            version: {
                id: version.id,
                version: version.version,
                estado: version.estado,
                etiquetaVersion: version.etiquetaVersion,
                formatoBaseId: version.formatoId,
                publicadoPorId: version.publicadoPorId,
                fechaPublicacion: version.fechaPublicacion,
                creadoPor: version.creadoPor,
                creadoPorId: version.creadoPorId,
                createdAt: version.createdAt,
                updatedAt: version.updatedAt
            },
            formato: {
                id: version.formatoId,
                nombre: version.formato?.nombre ?? null,
                codigo: version.formato?.codigo ?? null,
                tipo: version.formato?.tipo,
                slug: version.formato?.slug,
                descripcion: version.formato?.descripcion,
                formatoOrigenId: version.formato?.formatoOrigenId,
                activo: version.formato?.activo,
                creadoPor: version.formato?.creadoPor,
                creadoPorId: version.formato?.creadoPorId,
            },
            schema: {
                imagenes: {
                    configId: version.configuracionSecImagenesId,
                    nombre: version.configuracionSecImagenes?.nombre ?? null,
                    cantidadSlots: version.configuracionSecImagenes?.cantidadSlots ?? 0,
                    definicion: version.configuracionSecImagenes?.definicion ?? null
                },
                secciones: version.schema?.['secciones'] ?? []
            }
        };
    }
}
