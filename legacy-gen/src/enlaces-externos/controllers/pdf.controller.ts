import { ApiTags } from '@nestjs/swagger';
import { Get, Controller, BadRequestException, Query } from '@nestjs/common';
import { PdfImpl } from '../services/pdf';
import { GcmContextCode } from '@common/domain/types';
import { CommonGuards } from '@common/presentation/decorators';

@CommonGuards()
@ApiTags('Enlaces externos')
@Controller('v4/gen/enlaces-externos')
export class PdfController {
  constructor(private _pdf: PdfImpl) {}

  @Get('pdfs/1')
  async fetchPdf1(
    @Query('contexto') contexto: GcmContextCode,
    @Query('centroId') centroId: number
  ) {
    try {
      return await this._pdf.executeQ1(false, contexto, centroId ? +centroId : undefined);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('pdfs/1/resumen')
  async fetchPdf3(
    @Query('contexto') contexto: GcmContextCode,
    @Query('centroId') centroId: number
  ) {
    try {
      return await this._pdf.executeQ1(true, contexto, centroId ? +centroId : undefined);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('pdfs/2')
  async fetchPdf2(
    @Query('contexto') contexto: GcmContextCode,
    @Query('centroId') centroId: number
  ) {
    try {
      return await this._pdf.executeQ2(false, contexto, centroId ? +centroId : undefined);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('pdfs/2/resumen')
  async fetchPdf4(
    @Query('contexto') contexto: GcmContextCode,
    @Query('centroId') centroId: number
  ) {
    try {
      return await this._pdf.executeQ2(true, contexto, centroId ? +centroId : undefined);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
