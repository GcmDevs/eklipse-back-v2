import { ParteCatg } from '@equipos/domain/entities';
import { ParteCatgRead } from '@equipos/domain/read';
import { ParteCatgOrm } from '@orm/inn/equipos';

export class ParteCatgMapper {
    static toOrm(domain: ParteCatg): ParteCatgOrm {
        const orm = new ParteCatgOrm();
        if (domain.getId.getValor) {
            orm.id = domain.getId.getValor;
        }
        orm.parte = domain.getParte;
        return orm;
    }

    static toDomain(orm: ParteCatgOrm): ParteCatg {
        return ParteCatg.rebuild(
            orm.id,
            orm.parte
        );
    }

    static toView(orm: ParteCatgOrm): ParteCatgRead {
        return {
            id: orm.id,
            parte: orm.parte
        };
    }

    static toDomainList(entities: ParteCatgOrm[]): ParteCatg[] {
        return entities.map(et => this.toDomain(et));
    }

    static toViewList(ormList: ParteCatgOrm[]): ParteCatgRead[] {
        return ormList.map(orm => this.toView(orm));
    }
}
