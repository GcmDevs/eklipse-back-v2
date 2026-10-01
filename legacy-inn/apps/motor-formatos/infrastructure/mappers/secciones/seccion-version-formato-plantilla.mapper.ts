import { SeccionVersionFormato } from "apps/motor-formatos/domain";
import { SeccionVersionFormatoPlantillaOrm } from "../../persistence";


export class SeccionVersionFormatoMapper {

    static toOrm(domain: SeccionVersionFormato): SeccionVersionFormatoPlantillaOrm {
        const orm = new SeccionVersionFormatoPlantillaOrm();

        orm.id = domain.getId.getValor ?? undefined;
        orm.versionFormatoId = domain.getVersionFormatoId.getValor;
        orm.seccionId = domain.getSeccionId
            ? domain.getSeccionId.getValor
            : null;

        orm.ordenMostrado = domain.getOrdenMostrado;

        return orm;
    }

    static toDomain(orm: SeccionVersionFormatoPlantillaOrm): SeccionVersionFormato {
        return SeccionVersionFormato.rebuild(
            orm.id,
            orm.versionFormatoId,
            orm.seccionId,
            orm.ordenMostrado,
        );
    }

    static toDomainList(
        ormList: SeccionVersionFormatoPlantillaOrm[]
    ): SeccionVersionFormato[] {
        return ormList.map(this.toDomain);
    }
}
