import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { ConciliacionService } from './conciliacion.service';
import { ConciliacionCarteraDto } from './dto';
import { Response } from 'express';
import * as path from 'path';
import { Authorities } from '@crn/old/common/presentation/decorators';
import { CommonGuards } from '@crn/old/common/presentation/decorators';
import { editFileName, pdfFileFilter } from '@crn/old/common/presentation/file-saver';
import { FILE_LOCATIONS } from '@common/application/file-locations';
import { CRN_AUTHORITIES } from '@authorities/cartera';

@CommonGuards()
@ApiTags('V1/V2/V3')
@Controller('v10/cartera/conciliacion')
export class ConciliacionController {
  constructor(private readonly service: ConciliacionService) {}

  @Authorities([
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_GESTIONES,
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_CONCILIACIONES,
  ])
  @Get()
  async getConciliaciones() {
    return await this.service.getConciliaciones();
  }

  @Authorities([
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_GESTIONES,
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_CONCILIACIONES,
  ])
  @Put(':id')
  async updateConciliacion(@Param('id') id: number, @Body() conciliacion: ConciliacionCarteraDto) {
    return await this.service.updateConciliacion(+id, conciliacion);
  }

  @Authorities([
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_GESTIONES,
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_CONCILIACIONES,
  ])
  @Put('acta/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: `../${FILE_LOCATIONS.crn.gcc.actas}`,
        filename: editFileName,
      }),
      fileFilter: pdfFileFilter,
    })
  )
  async uploadfile(@Param('id') id: number, @UploadedFile() pdf: Express.Multer.File) {
    return await this.service.updateActa(+id, pdf.path);
  }

  @Authorities([
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_GESTIONES,
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_CONCILIACIONES,
  ])
  @Delete(':oid')
  async deleteConciliacion(@Param('oid') oid: number) {
    return await this.service.deleteConciliacion(+oid);
  }

  @Authorities([
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_GESTIONES,
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_CONCILIACIONES,
  ])
  @Get('acta/:id')
  async getActa(@Param('id') id: number, @Res() res: Response) {
    const file = await this.service.getActa(+id);
    return res.sendFile(path.join(file));
  }
}
