import { Id } from "@common/domain/value-objects";
import { normalizeParteCatgText } from "@equipos/domain/policies/parte-catg.policies";

export class ParteCatg {
    private constructor(
        private readonly id: Id,
        private readonly parte: string,
    ) { }

    static create(parte: string): ParteCatg {
        return new ParteCatg(new Id(), normalizeParteCatgText(parte));
    }

    static rebuild(id: number, parte: string): ParteCatg {
        return new ParteCatg(new Id(id), parte);
    }

    get getId(): Id { return this.id; }
    get getParte(): string { return this.parte; }
}