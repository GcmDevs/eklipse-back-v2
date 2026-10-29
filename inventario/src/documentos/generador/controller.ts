import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { INN_AUTHORITIES } from '@inn/authorities';
import { GcmContexts } from '@common/domain/types';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GenerateFileRes } from '@inn/lgc/ctc/infrastructure/responses';
import { OrdenTrasladoImpl } from './orden-traslado';

@CommonGuards()
@ApiTags('Generador de documentos')
@Controller('v1/inn/documentos/file-generator')
export class FileGeneratorController {
  constructor(private _ordenTraslado: OrdenTrasladoImpl) {}

  @ApiOkResponse({ type: GenerateFileRes })
  @Authorities([
    INN_AUTHORITIES.FARMACIA.CONTROL_GASTOS_FACTURADOR,
    INN_AUTHORITIES.FARMACIA.CONTROL_GASTOS_SOLICITANTE,
  ])
  @Get('orden-traslado/:contextCode')
  public async generateOrdenCompraById(
    @Param('contextCode') contextCode: GcmContexts,
    @Query('documentoId') documentoId: number,
    @Query(':consecutivo') consecutivo: string
  ) {
    try {
      const url = await this._ordenTraslado.execute(contextCode, documentoId, consecutivo);
      return { url };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
