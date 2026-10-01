import { BadRequestException, Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { TrasladoEvolucionImpl } from '@gestion-clinica/traslados-asistenciales/infrastructure/repositories';
import { FinalizarTrasladoEvolucionDto } from '../dtos';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FILE_LOCATIONS } from '@common/application/file-locations';
import { nonEditFileName } from '@common/presentation/helpers';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';
import { TrasladosRealtimeGateway } from '../gateways/traslados-realtime.gateway';

@ApiTags('Traslados Asistenciales')
@ApiBearerAuth()
@CommonGuards()
@Controller('v4/gestion-clinica/traslados-asistenciales/evolucion')
export class TrasladoEvolucionController {
  constructor(
    private _source: TrasladoEvolucionImpl,
    private readonly _events: TrasladosRealtimeGateway
  ) {}

  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files' }], {
      storage: diskStorage({
        destination: `../${FILE_LOCATIONS.gen.trasl.firma}`,
        filename: nonEditFileName,
      }),
    })
  )
  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.SEGUIMIENTO_TRASLADO])
  @ApiOperation({ summary: 'Finalizar la evolución del traslado' })
  @Post('finalizar')
  public async finalizarTraslado(@Body() body: { data: string }) {
    try {
      const payload: FinalizarTrasladoEvolucionDto = JSON.parse(body.data);
      const result = await this._source.finalizarTraslado(payload);
      if (result)
        this._events.publish({
          tipo: 'FINALIZACION',
          trasladoId: payload.trasladoId,
          contextoCode: payload.contextoCode,
        });
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
