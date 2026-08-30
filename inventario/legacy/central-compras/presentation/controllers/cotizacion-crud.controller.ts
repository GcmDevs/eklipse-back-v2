import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { diskStorage } from 'multer';
import { ApiTags } from '@nestjs/swagger';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { INN_AUTHORITIES } from '@inn/authorities';
import { FileInterceptor } from '@nestjs/platform-express';
import { editFileName } from '@common/presentation/helpers';
import { CreateCotizacionDto } from '../dtos';
import { CotizacionCrudSource } from '@inn/lgc/ctc/infrastructure/repositories';
import { CTC_FILE_LOCATIONS } from '../../application/constants';

@CommonGuards()
@ApiTags('Cotizaciones')
@Controller('v1/inn/ctc/cotizaciones')
export class CotizacionCrudController {
  constructor(private _cotizacionCrud: CotizacionCrudSource) {}

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.COTIZAR])
  @Post('comprobante-cotizacion')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: `../${CTC_FILE_LOCATIONS.cotizaciones}`,
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
  public async create(@Body() body: CreateCotizacionDto) {
    try {
      if (!body.contextCode && body.context) body.contextCode = body.context;
      const response = await this._cotizacionCrud.create(body);
      return response;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
