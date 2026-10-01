import { BaseSource } from "@common/infrastructure/services";
import { FormatoSchemaQuery } from "apps/motor-formatos/domain";
import { Repository } from "typeorm";
import { VersionFormatoMapper } from "../../mappers";
import { VersionFormatoFmtOrm } from "../orm";

export class TypeOrmFormatoSchemaQuery extends BaseSource implements FormatoSchemaQuery {
    private readonly versionFormatoRepository: Repository<VersionFormatoFmtOrm> =
        this.conn.getRepository(VersionFormatoFmtOrm);

    async getSchema(versionFormatoId: number): Promise<any> {

        const version = await this.versionFormatoRepository.findOne({
            where: { id: versionFormatoId },
            relations: [
                'configuracionSecImagenes',
                'secciones',
                'formato'
            ]
        });

        if (!version) return null;
        return VersionFormatoMapper.toSchema(version);
    }
}