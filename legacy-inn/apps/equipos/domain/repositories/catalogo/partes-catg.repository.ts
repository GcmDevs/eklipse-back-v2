import { BaseRepository } from '@common/domain/repositories';
import { ParteCatg } from '@equipos/domain/entities';
import { ParteCatgRead } from '@equipos/domain/read';

export interface ParteCatgRepository extends BaseRepository<ParteCatg, ParteCatgRead> {
  findByParte(parte: string): Promise<ParteCatg | null>;
  findCandidatesForSimilarity(parte: string, limit?: number): Promise<ParteCatg[]>;
  findAllAndCount(limit: number, parte?: string): Promise<ParteCatgRead[]>;
}
