import {
  BadRequestException,
  Controller,
  Get,
  Header,
  HttpException,
  Param,
  Query,
} from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { INN_AUTHORITIES } from '@inn/authorities';
import { GcmContexts } from '@common/domain/types';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GenerateFileRes } from '@inn/lgc/ctc/infrastructure/responses';
import { OrdenTrasladoImpl } from './orden-traslado';
import { TemporaryPdfService } from '@common/temporary-pdf';
import { ENVIRONMENTS } from '@inn/app.environments';

@CommonGuards()
@ApiTags('Generador de documentos')
@Controller('v1/inn/documentos/file-generator')
export class FileGeneratorController {
  constructor(
    private _ordenTraslado: OrdenTrasladoImpl,
    private readonly temporary: TemporaryPdfService
  ) {}

  @ApiOkResponse({ type: GenerateFileRes })
  @Authorities([
    INN_AUTHORITIES.FARMACIA.CONTROL_GASTOS_FACTURADOR,
    INN_AUTHORITIES.FARMACIA.CONTROL_GASTOS_SOLICITANTE,
  ])
  @Get('orden-traslado/:contextCode')
  @Header('Cache-Control', 'private, no-store, max-age=0')
  public async generateOrdenCompraById(
    @Param('contextCode') contextCode: GcmContexts,
    @Query('documentoId') documentoId: number,
    @Query('consecutivo') consecutivo: string
  ) {
    try {
      const token = await this.temporary.generate(
        () => this._ordenTraslado.execute(contextCode, documentoId, consecutivo),
        'Traslado de productos en consignación'
      );
      const url = this.temporary.url(ENVIRONMENTS.apiUrl, token);
      return { url };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
