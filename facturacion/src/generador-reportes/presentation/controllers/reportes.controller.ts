import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { SLN_AUTHORITIES } from '@inn/authorities';
import { GeneradorReportesImpl } from '../../infrastructure/services/reportes.impl';
import { BusquedaReportesDto, ConsultaReportesResponse } from '../dtos/busqueda.dto';

@ApiTags('Generador de reportes')
@CommonGuards()
@Controller('v1/generador-reportes')
export class GeneradorReportesController {
  constructor(private readonly servicio: GeneradorReportesImpl) {}

  @Get()
  @Authorities([SLN_AUTHORITIES.GENERADOR_REPORTES.CONSULTAR])
  public consultar(@Query() busqueda: BusquedaReportesDto): Promise<ConsultaReportesResponse> {
    return this.servicio.consultar(busqueda.documento);
  }
}
