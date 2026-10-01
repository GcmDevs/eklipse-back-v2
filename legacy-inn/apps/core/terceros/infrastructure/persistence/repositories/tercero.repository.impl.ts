import { BaseSource } from "@common/infrastructure/services";
import { TerceroRepository } from "@core/terceros/application/repositories";
import { Injectable } from "@nestjs/common";
import { TerceroOrm } from "@orm/cor";
import { RolTercero } from "@orm/cor/rol-tercero.orm";
import { DeepPartial, Repository } from "typeorm";

@Injectable()
export class TypeOrmTerceroRepository
    extends BaseSource
    implements TerceroRepository {

    private readonly repository: Repository<TerceroOrm> =
        this.conn.getRepository(TerceroOrm);

    async save(
        data: DeepPartial<TerceroOrm>
    ): Promise<TerceroOrm> {
        const entity = this.repository.create(data);
        return this.repository.save(entity);
    }

    async findById(id: number): Promise<TerceroOrm | null> {
        return this.repository.findOne({
            where: { id },
            relations: {
                roles: true,
                pais: true,
            },
        });
    }

    async findByIdAndRol(
        id: number,
        rol: RolTercero
    ): Promise<TerceroOrm | null> {

        return this.repository
            .createQueryBuilder('ter')
            .leftJoinAndSelect('ter.roles', 'rol')
            .leftJoinAndSelect('ter.pais', 'pais')
            .where('ter.id = :id', { id })
            .andWhere('rol.rol = :rol', { rol })
            .getOne();
    }

    async findAll(
        limit: number = 20,
        search?: string,
        rol?: RolTercero
    ): Promise<TerceroOrm[]> {

        const qb = this.repository
            .createQueryBuilder('ter')
            .leftJoinAndSelect('ter.roles', 'rol')
            .leftJoinAndSelect('ter.pais', 'pais');

        if (search) {
            qb.andWhere(
                'LOWER(ter.nombre) LIKE LOWER(:search)',
                {
                    search: `%${search}%`,
                }
            );
        }

        if (rol) {
            qb.andWhere('rol.rol = :rol', { rol });
        }

        qb.orderBy('ter.nombre', 'ASC')
            .take(limit);

        return qb.getMany();
    }
}