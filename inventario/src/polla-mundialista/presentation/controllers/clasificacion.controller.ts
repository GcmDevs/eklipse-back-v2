import { BadRequestException, Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClasificacionUsuarioRes } from '../../application/responses';
import { FetchClasificacionImpl } from '../../infrastructure/services';

@ApiTags('Polla mundialista')
@Controller('v1/inn/polla-mundialista/clasificacion')
export class ClasificacionController {
  constructor(private _fetchClasificacion: FetchClasificacionImpl) {}

  @ApiResponse({ status: 200, type: ClasificacionUsuarioRes, isArray: true })
  @Get()
  async fetch(): Promise<ClasificacionUsuarioRes[]> {
    try {
      return await this._fetchClasificacion.execute();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
