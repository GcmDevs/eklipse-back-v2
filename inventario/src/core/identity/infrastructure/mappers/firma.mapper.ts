import { ResponseFirmaDto } from '@inn/core/identity/presentation/dto';
import { ArchivoAlmacenadoMapper } from "@inn/core/media/infrastructure/mappers";
import { FirmaOrm } from "@inn/orm/cor";

export class FirmaMapper {
    static toResponse(orm: FirmaOrm): ResponseFirmaDto {
        return {
            id: orm.id,
            tipoFirmante: orm.tipoFirmante,
            nombreFirmante: orm.nombreFirmante,
            archivoId: orm.archivoFirma?.id,
            archivo: ArchivoAlmacenadoMapper.toView(orm.archivoFirma),
            usuarioId: orm.usuario?.id,
            terceroId: orm.tercero?.id,
            createdAt: orm.createdAt
        };
    }

    static toResponseList(firmas: FirmaOrm[]): ResponseFirmaDto[] {
        return firmas.map(FirmaMapper.toResponse);
    }
}