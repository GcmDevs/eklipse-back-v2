import { BadRequestException, Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { DefiClasifiRes } from '../../application/responses';
import { FetchClasificacionImpl } from '../../infrastructure/services';

@ApiTags('Polla mundialista')
@Controller('v1/inn/polla-mundialista/clasificacion')
export class ClasificacionController {
  constructor(private _fetchClasificacion: FetchClasificacionImpl) {}

  @ApiResponse({ status: 200, type: DefiClasifiRes })
  @Get()
  async fetch(): Promise<DefiClasifiRes> {
    try {
      return await this._fetchClasificacion.execute();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
