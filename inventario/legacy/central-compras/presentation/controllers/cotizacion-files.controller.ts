import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { INN_AUTHORITIES } from '@inn/authorities';
import { GcmContexts } from '@common/domain/types';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FilesCotizacionesImpl } from '@inn/lgc/ctc/infrastructure/services/files';
import { GenerateFileRes } from '@inn/lgc/ctc/infrastructure/responses';

@CommonGuards()
@ApiTags('Cotizaciones')
@Controller('v1/inn/ctc/cotizaciones/files')
export class CotizacionFilesController {
  constructor(private _files: FilesCotizacionesImpl) {}

  @ApiOkResponse({ type: GenerateFileRes })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.CODE])
  @Get('orden-compra/:contextCode/:cotizacionId')
  public async generateOrdenCompra(
    @Param('contextCode') contextCode: GcmContexts,
    @Param('cotizacionId') cotizacionId: number
  ) {
    try {
      const url = await this._files.generateOrdenCompra({
        context: contextCode,
        cotizacionId: +cotizacionId,
      });
      return { url };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({ type: GenerateFileRes })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.CODE])
  @Get('cuenta-pagar/:contextCode/:cxpId')
  public async generateCxP(
    @Param('contextCode') contextCode: GcmContexts,
    @Param('cxpId') cxpId: number
  ) {
    try {
      const url = await this._files.generateCxP({ context: contextCode, cxpId: +cxpId });
      return { url };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
