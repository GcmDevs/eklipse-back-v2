import { BaseSource } from "@common/infrastructure/services";
import { SeccionPlantillaFmt, SeccionPlantillaFmtRead, SeccionPlantillaRepository } from "apps/motor-formatos/domain";
import { In, Repository } from "typeorm";
import { SeccionPlantillaMapper } from "../../mappers";
import { SeccionPlantillaFmtOrm } from "../orm/secciones";

export class TypeOrmSeccionesRepository
    extends BaseSource
    implements SeccionPlantillaRepository {

    private readonly repository: Repository<SeccionPlantillaFmtOrm> =
        this.conn.getRepository(SeccionPlantillaFmtOrm);

    public async save(seccion: SeccionPlantillaFmt): Promise<SeccionPlantillaFmtRead> {
        const seccionOrm = SeccionPlantillaMapper.toOrm(seccion);
        const seccionSaved = await this.repository.save(seccionOrm);
        return SeccionPlantillaMapper.toView(seccionSaved);
    }

    public async findViewById(id: number): Promise<SeccionPlantillaFmtRead | null> {
        const seccionFound = await this.repository.findOne({ where: { id } });
        return seccionFound ? SeccionPlantillaMapper.toView(seccionFound) : null;
    }

    public async findByIds(ids: number[]): Promise<SeccionPlantillaFmt[]> {
        const secciones = await this.repository.findBy({
            id: In(ids)
        });

        return SeccionPlantillaMapper.toDomainList(secciones);
    }

    public async findAllView(): Promise<SeccionPlantillaFmtRead[]> {
        const secciones = await this.repository.find();
        return SeccionPlantillaMapper.toViewList(secciones);
    }
}
