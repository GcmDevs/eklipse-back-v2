import { ApiTags } from '@nestjs/swagger';
import { CommonGuards } from '@common/presentation/decorators';
import { FetchDocumentosImpl } from '@inn/farmacia/infrastructure/services';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';

@ApiTags('V1 - Productos (Recepción tecnica)')
@CommonGuards()
@Controller('v1/pdts/rtc')
export class RecepcionTecnicaController {
  constructor(private _fetchDocumentos: FetchDocumentosImpl) {}

  @Get('fetch-documentos')
  public fetchDocumentos(
    @Query('start') start: Date,
    @Query('end') end: Date,
    @Query('onlyWithRecTec') onlyWithRecTec: boolean,
    @Query('onlyComprobantes') onlyComprobantes: boolean,
    @Query('onlyRemisiones') onlyRemisiones: boolean,
    @Query('pattern') pattern: string | undefined
  ) {
    if (pattern == 'undefined') pattern = undefined;
    if (onlyWithRecTec === undefined) onlyWithRecTec = false;
    if (onlyComprobantes === undefined) onlyComprobantes = true;
    if (onlyRemisiones === undefined) onlyRemisiones = true;
    try {
      start = new Date(`${start}:00:00:00`);
      end = new Date(`${end}:23:59:59`);

      return this._fetchDocumentos.documentos(
        start,
        end,
        onlyWithRecTec,
        onlyComprobantes,
        onlyRemisiones,
        pattern
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
