import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { TrasladoRevisionCentralImpl } from '@hpn/lgc/tas/infrastructure/repositories';
import { CreateRevisionCentralDto, CancelTrasladoDto } from '../dtos';
import { HPN_AUTHORITIES } from '@authorities';
import { TrasladosRealtimeGateway } from '../gateways/traslados-realtime.gateway';

@ApiTags('Traslados Asistenciales')
@ApiBearerAuth()
@CommonGuards()
@Controller('v4/gestion-clinica/traslados-asistenciales/revision-central')
export class TrasladoRevisionCentralController {
  constructor(
    private _source: TrasladoRevisionCentralImpl,
    private readonly _events: TrasladosRealtimeGateway
  ) {}

  @ApiOperation({ summary: 'Tomar decisión en la revisión central del traslado' })
  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.GESTION_TRASLADO])
  @Post('decidir')
  public async decidir(@Body() body: CreateRevisionCentralDto) {
    try {
      const result = await this._source.decidir(body);
      if (result)
        this._events.publish({
          tipo: 'DECISION',
          trasladoId: body.trasladoId,
          contextoCode: body.contextoCode,
        });
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Cancelar un traslado desde revisión central' })
  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.GESTION_TRASLADO])
  @Post('cancel')
  public async cancel(@Body() body: CancelTrasladoDto) {
    try {
      const result = await this._source.cancel(body);
      if (result)
        this._events.publish({
          tipo: 'CANCELACION',
          trasladoId: body.trasladoId,
          contextoCode: body.contextoCode,
        });
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
