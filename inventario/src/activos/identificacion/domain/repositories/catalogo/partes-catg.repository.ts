import { BaseRepository } from "@common/domain/repositories";
import { ParteCatg } from "@inn/activos/identificacion/domain/entities";
import { ParteCatgRead } from "@inn/activos/identificacion/domain/read";

export interface ParteCatgRepository extends BaseRepository<ParteCatg, ParteCatgRead> {
    findByParte(parte: string): Promise<ParteCatg | null>;
    findCandidatesForSimilarity(parte: string, limit?: number): Promise<ParteCatg[]>;
    findAllAndCount(limit: number, parte?: string): Promise<ParteCatgRead[]>;
}