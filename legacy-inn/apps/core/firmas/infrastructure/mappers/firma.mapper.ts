import { ResponseFirmaDto } from '@core/firmas/presentation/dto';
import { ArchivoAlmacenadoMapper } from '@core/media/infrastructure/mappers';
import { FirmaOrm } from '@orm/cor';

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
      createdAt: orm.createdAt,
    };
  }

  static toResponseList(firmas: FirmaOrm[]): ResponseFirmaDto[] {
    return firmas.map(FirmaMapper.toResponse);
  }
}
