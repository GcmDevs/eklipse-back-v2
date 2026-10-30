import { Id } from "@common/domain/value-objects";
import { EjeMantItemGrupoZonaDinamica } from "./eje-item-zona-dinam.vo";

export class GrupoEjeMantZonaDinamica {
    private constructor(
        private readonly grupoEjeMantId: Id,
        private readonly orden: number,
        private readonly items: EjeMantItemGrupoZonaDinamica[]
    ) { }

    static create(
        grupoEjeMantId: number,
        orden: number,
        items: EjeMantItemGrupoZonaDinamica[]
    ): GrupoEjeMantZonaDinamica {
        if (orden < 0) {
            throw new Error('Orden inválido');
        }

        return new GrupoEjeMantZonaDinamica(
            new Id(grupoEjeMantId),
            orden,
            items
        );
    }

    get getGrupoId(): Id { return this.grupoEjeMantId; }
    get getOrden() { return this.orden; }
    get getItems() { return [...this.items]; }
}
