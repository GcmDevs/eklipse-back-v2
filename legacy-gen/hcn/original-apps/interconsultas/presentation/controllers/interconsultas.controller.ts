import { ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { FetchInterconsultasPendientesHandler } from '../handlers';
import { InterConsultaPendienteDto } from '@hcn/ori/intc/application/data-transfers';
import { HCN_AUTHORITIES } from '@authorities/historia-clinica';
import { Authorities, CommonGuards } from '@common/presentation/decorators';

@ApiTags('V1 - Interconsultas')
@CommonGuards()
@Controller('v1/interconsultas')
export class InterconsultasController {
  constructor(private _fetchInterconsultasPendientes: FetchInterconsultasPendientesHandler) {}

  @Authorities([HCN_AUTHORITIES.INTERCONSULTAS.MOSTRAR_PENDIENTES])
  @Get('pendientes')
  fetchInterconsultasPendientes(): Promise<InterConsultaPendienteDto[]> {
    return this._fetchInterconsultasPendientes.all();
  }

  @Authorities([HCN_AUTHORITIES.INTERCONSULTAS.MOSTRAR_TODAS_PENDIENTES_MOBILE])
  @Get('pendientes-by-especialidad')
  fetchInterconsultasPendientesByEspecialidad(): Promise<InterConsultaPendienteDto[]> {
    return this._fetchInterconsultasPendientes.porEspecialidadUsuarioAutenticado();
  }
}
