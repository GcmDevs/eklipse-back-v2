import { BadRequestException, Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { TrasladoEvolucionImpl } from '@hpn/lgc/tas/infrastructure/repositories';
import { FinalizarTrasladoEvolucionDto } from '../dtos';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { nonEditFileName } from '@common/presentation/helpers';
import { HPN_AUTHORITIES } from '@authorities';
import { TrasladosRealtimeDestinatariosService } from '../../infrastructure/services/traslados-realtime-destinatarios.service';
import { LGC_TAS_LOCATIONS } from '../../application/constants';
import { ESTADOS_ASISTENCIA } from '../../@types/gcn';

@ApiTags('Traslados Asistenciales')
@ApiBearerAuth()
@CommonGuards()
@Controller('v1/hpn/traslados-asistenciales/evolucion')
export class TrasladoEvolucionController {
  constructor(
    private _source: TrasladoEvolucionImpl,
    private readonly _events: TrasladosRealtimeDestinatariosService
  ) {}

  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files' }], {
      storage: diskStorage({
        destination: `../${LGC_TAS_LOCATIONS.firma}`,
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
      const anteriores = await this._events.recipients(payload.trasladoId, payload.contextoCode);
      const result = await this._source.finalizarTraslado(payload);
      if (result)
        await this._events.publish({
          tipo: result.isRedondo
            ? ESTADOS_ASISTENCIA.PENDIENTE_RETORNO.getCode()
            : ESTADOS_ASISTENCIA.FINALIZADO.getCode(),
          trasladoId: payload.trasladoId,
          contextoCode: payload.contextoCode,
        }, anteriores);
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
