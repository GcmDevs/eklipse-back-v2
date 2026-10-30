import { PaisOrm } from "@inn/orm/shared-bd";

export interface PaisRepository {
    findAll(limit: number, search?: string): Promise<PaisOrm[]>;
    findById(id: number): Promise<PaisOrm | null>;
}
