import { BaseSource } from '@common/infrastructure/services';
import { normalizeParteCatgKey, normalizeParteCatgText } from '@equipos/domain/policies/parte-catg.policies';
import { ParteCatg } from '@equipos/domain/entities';
import { ParteCatgRead } from '@equipos/domain/read';
import { ParteCatgRepository } from '@equipos/domain/repositories/catalogo';
import { ParteCatgMapper } from '@equipos/infrastructure/mappers';
import { ParteCatgOrm } from '@orm/inn/equipos';
import { Repository } from 'typeorm';

export class TypeOrmPartesCatgEquipoRepository
    extends BaseSource
    implements ParteCatgRepository {
        
    update(updateEntity: ParteCatg): Promise<ParteCatg> {
        throw new Error('Method not implemented.');
    }
    delete(id: number): Promise<void> {
        throw new Error('Method not implemented.');
    }
    exists(id: number): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    async findViewById(id: number): Promise<ParteCatgRead> {
        const parteFound = await this.repository.findOne({ where: { id } });
        return ParteCatgMapper.toView(parteFound);
    }
    findAllView(page: number, limit: number): Promise<[ParteCatgRead[], number]> {
        throw new Error('Method not implemented.');
    }
    private readonly repository: Repository<ParteCatgOrm> =
        this.conn.getRepository(ParteCatgOrm);


    async save(parte: ParteCatg): Promise<ParteCatg> {
        const parteOrm = ParteCatgMapper.toOrm(parte);
        const parteSaved = await this.repository.save(parteOrm);
        return ParteCatgMapper.toDomain(parteSaved);
    }

    async findById(id: number): Promise<ParteCatg | null> {
        const parteFound = await this.repository.findOne({ where: { id } });
        return ParteCatgMapper.toDomain(parteFound);
    }

    async findByParte(parte: string): Promise<ParteCatg | null> {
        const nombre = normalizeParteCatgText(parte);
        if (!nombre) return null;

        const parteFound = await this.repository
            .createQueryBuilder('p')
            .where(
                'LTRIM(RTRIM(p.parte)) COLLATE Latin1_General_CI_AI = :nombre',
                { nombre },
            )
            .getOne();

        return parteFound ? ParteCatgMapper.toDomain(parteFound) : null;
    }

    async findCandidatesForSimilarity(parte: string, limit = 80): Promise<ParteCatg[]> {
        const nombre = normalizeParteCatgText(parte);
        if (!nombre) return [];

        const tokens = normalizeParteCatgKey(nombre)
            .split(' ')
            .filter((token) => token.length >= 3);

        const query = this.repository.createQueryBuilder('p');

        if (tokens.length > 0) {
            const conditions = tokens.map((_, index) =>
                `LTRIM(RTRIM(p.parte)) COLLATE Latin1_General_CI_AI LIKE :token${index}`,
            );
            const params = Object.fromEntries(
                tokens.map((token, index) => [`token${index}`, `%${token}%`]),
            );
            query.where(`(${conditions.join(' OR ')})`, params);
        } else {
            query.where(
                'LTRIM(RTRIM(p.parte)) COLLATE Latin1_General_CI_AI LIKE :search',
                { search: `%${nombre}%` },
            );
        }

        const partesFound = await query
            .orderBy('p.parte', 'ASC')
            .limit(limit)
            .getMany();

        return partesFound.map((parteFound) => ParteCatgMapper.toDomain(parteFound));
    }

    public async findAllAndCount(
        limit: number,
        parte?: string
    ): Promise<ParteCatgRead[]> {
        const query = this.repository.createQueryBuilder('parte');
        if (parte?.trim()) {
            const search = `%${normalizeParteCatgText(parte)}%`;
            query.where(
                'LTRIM(RTRIM(parte.parte)) COLLATE Latin1_General_CI_AI LIKE :search',
                { search },
            );
        }
        query
            .orderBy('parte.parte', 'ASC')
            .limit(limit);

        const partesFound = await query.getMany();
        return ParteCatgMapper.toViewList(partesFound);
    }
}
