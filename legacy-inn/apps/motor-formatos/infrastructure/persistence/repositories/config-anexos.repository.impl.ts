import { BaseSource } from "@common/infrastructure/services";
import { Repository } from "typeorm";
import { SeccionesAnexosRepository, SeccionAnexoImagenes } from "apps/motor-formatos/domain";
import { SeccionAnexosMapper } from "../../mappers";
import { SeccionAnexoImagenesOrm } from "../orm/secciones";

export class TypeOrmSeccionesAnexosRepository extends BaseSource
    implements SeccionesAnexosRepository {

    private readonly configImagenRepository: Repository<SeccionAnexoImagenesOrm> = this.conn.getRepository(SeccionAnexoImagenesOrm);

    public async findByIdImg(id: number): Promise<SeccionAnexoImagenes | null> {
        const configImgFound = await this.configImagenRepository.findOne({ where: { id } });
        return configImgFound ? SeccionAnexosMapper.toDomain(configImgFound) : null;
    }

    public async findAllImg(): Promise<SeccionAnexoImagenes[]> {
        const configImgs = await this.configImagenRepository.find();
        return SeccionAnexosMapper.toDomainList(configImgs);
    }
}
