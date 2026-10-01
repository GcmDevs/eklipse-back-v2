import { SeccionPlantillaFmt, SeccionPlantillaFmtRead } from "apps/motor-formatos/domain";
import { SeccionPlantillaFmtOrm } from "../../persistence";

export class SeccionPlantillaMapper {

    static toOrm(domain: SeccionPlantillaFmt): SeccionPlantillaFmtOrm {
        const orm = new SeccionPlantillaFmtOrm();

        orm.id = domain.getId.getValor ?? undefined;
        orm.nombre = domain.getNombre;
        orm.componentes = domain.getComponentes;

        return orm;
    }

    static toDomain(orm: SeccionPlantillaFmtOrm): SeccionPlantillaFmt {
        return SeccionPlantillaFmt.rebuild(
            orm.id,
            orm.nombre,
            orm.componentes,
        );
    }

    static toView(orm: SeccionPlantillaFmtOrm): SeccionPlantillaFmtRead {
        return {
            id: orm.id,
            nombre: orm.nombre,
            componentes: orm.componentes,
        };
    }

    static toViewList(
        ormList: SeccionPlantillaFmtOrm[],
    ): SeccionPlantillaFmtRead[] {
        return ormList.map((orm) => this.toView(orm));
    }

    static toDomainList(
        ormList: SeccionPlantillaFmtOrm[],
    ): SeccionPlantillaFmt[] {
        return ormList.map((orm) => this.toDomain(orm));
    }
}