import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { TrasladoCrudSource } from '@hpn/lgc/tas/infrastructure/repositories';
import { HPN_AUTHORITIES } from '@authorities';

@ApiTags('Traslados Asistenciales')
@ApiBearerAuth()
@CommonGuards()
@Controller('v1/hpn/traslados-asistenciales/movil')
export class TrasladoMovilController {
  constructor(private _source: TrasladoCrudSource) {}

  @ApiOperation({ summary: 'Obtener las asignaciones de traslados para el usuario actual (móvil)' })
  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.SEGUIMIENTO_TRASLADO])
  @Get('mis-asignaciones')
  public async fetchMisAsignaciones() {
    try {
      return await this._source.fetchTrasladosAsignadosUsuario();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
