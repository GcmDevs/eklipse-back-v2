import { BaseSource } from "@common/infrastructure/services";
import { UsuarioOrm } from "@orm/gen";
import { Repository } from "typeorm";

export class TypeOrmUsuarioEqpRepository extends BaseSource {
    private readonly repository: Repository<UsuarioOrm> =
        this.conn.getRepository(UsuarioOrm);

    public async findById(id: number): Promise<UsuarioOrm | null> {
        const usuarioFound = await this.repository.findOne({
            where: { id: id },
        });
        return usuarioFound ? usuarioFound : null;
    }

    public async findSuggestions(
        nombre?: string,
        numeroDocumento?: string
    ): Promise<UsuarioOrm[]> {
        const qb = this.repository.createQueryBuilder("usuario")

        if (nombre) {
            const palabras = nombre.trim().split(/\s+/);
            palabras.forEach((palabra, index) => {
                qb.andWhere(`usuario.nombreCompleto LIKE :nombreCompleto${index}`, {
                    [`nombreCompleto${index}`]: `%${palabra}%`,
                });
            });
        }
        if (numeroDocumento) {
            qb.orWhere("usuario.cedula LIKE :cedula", {
                cedula: `%${numeroDocumento}%`,
            });
        }
        return qb.take(15)
            .getMany();
    }

}
