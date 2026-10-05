import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { INN_AUTHORITIES } from '@authorities/inventario';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FILE_LOCATIONS } from '@common/application/file-locations';
import { CotizacionCrudSource } from '@inn/central-compras/infrastructure/repos';
import { editFileName } from '@common/presentation/helpers';
import { OldCrearCotizacionDto } from '../dtos';
import { ApiTags } from '@nestjs/swagger';

@CommonGuards()
@ApiTags('V4')
@Controller('v4/central-compras/cotizaciones')
export class CotizacionCrudController {
  constructor(private _cotizacionCrud: CotizacionCrudSource) {}

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.COTIZAR])
  @Post('comprobante-cotizacion')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: `../${FILE_LOCATIONS.inn.ctc.cotizaciones}`,
        filename: editFileName,
      }),
    })
  )
  public async storeCotizacionFile(@Query('fileName') fileName: string) {
    const result = fileName;
    return result;
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.COTIZAR])
  @Post()
  public async create(@Body() body: OldCrearCotizacionDto) {
    try {
      const response = await this._cotizacionCrud.create(body);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
