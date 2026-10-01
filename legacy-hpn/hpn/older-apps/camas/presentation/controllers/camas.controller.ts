import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  FetchCamasDisponiblesHandler,
  EstadisticasCamasDisponiblesHandler,
  MarcarPrealtaHandler,
  LaboratorioHandler,
  MedicamentosHandler,
  ListaEsperaCamaHandler,
  ListaEsperaCamaReferenciaHandler,
  EvoluionesHandler,
  ProcedimientosHandler,
  ListaReservaHandler,
  EstanciasHandler,
} from '../handlers';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import {
  BloqueoCamaDto,
  CamaDto,
  CamaOcupadaDto,
  EstadisticasCamaDto,
  PrealtaDto,
} from '../../application/dtos';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';
import { CamaOcupadaHandler } from '../handlers/cama-ocupada.handler';
import { GcmContexts } from '@common/application/constants';
import { BloquearCamaHandler } from '../handlers/bloquear-cama.handler';
import {
  EvolucionesResponse,
  Listareservaresponse,
  MedicamentosResponse,
  ProcedimientosResponse,
} from '../../insfrastructure/responses';

@ApiTags('V1/V2/V3')
@CommonGuards()
@Controller('v30/camas')
export class CamasController {
  constructor(
    private _camasHandler: FetchCamasDisponiblesHandler,
    private _estadisticasHandler: EstadisticasCamasDisponiblesHandler,
    private _camaOcupadaHandler: CamaOcupadaHandler,
    private _bloquearCamaHandler: BloquearCamaHandler,
    private _prealtaHandler: MarcarPrealtaHandler,
    private _laboratorioHandler: LaboratorioHandler,
    private _medicamentosHandler: MedicamentosHandler,
    private _procedimientosHandler: ProcedimientosHandler,
    private _listaEsperaCamaHandler: ListaEsperaCamaHandler,
    private _listaEsperaCamaReferenciaHandler: ListaEsperaCamaReferenciaHandler,
    private _listaReservaHandler: ListaReservaHandler,
    private _evolucionesHandler: EvoluionesHandler,
    private _estanciaHandler: EstanciasHandler
  ) {}

  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA, HPN_AUTHORITIES.CAMAS.VER_CAMAS])
  @Get('disponibles')
  public fetchCamasDisponibles(@Query('allCtx') allCtx: boolean): Promise<CamaDto[]> {
    return this._camasHandler.execute(allCtx);
  }

  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA, HPN_AUTHORITIES.CAMAS.VER_CAMAS])
  @Get('estadisticas')
  public estadisticasCamasDisponibles(
    @Query('allCtx') allCtx: boolean
  ): Promise<EstadisticasCamaDto[]> {
    return this._estadisticasHandler.execute(allCtx);
  }
  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA, HPN_AUTHORITIES.CAMAS.VER_CAMAS])
  @Get('cama-ocupada')
  public camasOcupadas(
    @Query('ctx') ctx: GcmContexts,
    @Query('codigo') codigo: string
  ): Promise<CamaOcupadaDto> {
    return this._camaOcupadaHandler.execute(ctx, codigo);
  }
  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA])
  @Post('bloquear-cama')
  public bloquearCama(
    @Query('ctx') ctx: GcmContexts,
    @Body() body: BloqueoCamaDto
  ): Promise<boolean> {
    // return this._bloquearCamaHandler.execute(ctx, codigo, motivo, observacion);
    return this._bloquearCamaHandler.execute(ctx, body);
  }
  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA])
  @Get('bloquear')
  public getBloqueo(@Query('ctx') ctx: GcmContexts, @Query('id') id: number) {
    return this._bloquearCamaHandler.getMotivos(ctx, id);
  }
  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA])
  @Post('marcar-prealta')
  public marcarPrealta(@Query('ctx') ctx: GcmContexts, @Body() body: PrealtaDto): Promise<any> {
    return this._prealtaHandler.execute(ctx, body);
  }
  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA])
  @Get('prealta')
  public getPrealtaById(@Query('ctx') ctx: GcmContexts, @Query('id') id: number): Promise<any> {
    return this._prealtaHandler.getPrealtaById(ctx, id);
  }
  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA])
  @Post('cancelar-prealta')
  public cancelarPrealta(
    @Query('ctx') ctx: GcmContexts,
    @Query('id') id: number
  ): Promise<boolean> {
    return this._prealtaHandler.cancelarPrealta(ctx, +id);
  }
  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA])
  @Get('all-prealta')
  public getAllPrealta(@Query('ctx') ctx: GcmContexts): Promise<any> {
    return this._prealtaHandler.getAllPrealta(ctx);
  }
  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA, HPN_AUTHORITIES.CAMAS.VER_CAMAS])
  @Get('examenes/:consecutivo')
  public getExamenes(
    @Query('ctx') ctx: GcmContexts,
    @Param('consecutivo') consecutivo: number
  ): Promise<any> {
    return this._laboratorioHandler.getExamenes(ctx, +consecutivo);
  }
  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA, HPN_AUTHORITIES.CAMAS.VER_CAMAS])
  @Get('medicamentos/:consecutivo')
  public getMedicamentos(
    @Query('ctx') ctx: GcmContexts,
    @Param('consecutivo') consecutivo: number
  ): Promise<MedicamentosResponse[]> {
    return this._medicamentosHandler.getMedicamentos(ctx, +consecutivo);
  }
  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA, HPN_AUTHORITIES.CAMAS.VER_CAMAS])
  @Get('procedimientos/:consecutivo')
  public getProcedimientos(
    @Query('ctx') ctx: GcmContexts,
    @Param('consecutivo') consecutivo: number
  ): Promise<ProcedimientosResponse[]> {
    return this._procedimientosHandler.getProcedimientos(ctx, +consecutivo);
  }
  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA, HPN_AUTHORITIES.CAMAS.VER_CAMAS])
  @Get('evoluciones/:consecutivo')
  public getEvoluciones(
    @Query('ctx') ctx: GcmContexts,
    @Param('consecutivo') consecutivo: number
  ): Promise<EvolucionesResponse[]> {
    return this._evolucionesHandler.execute(ctx, +consecutivo);
  }
  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA])
  @Get('lista-espera')
  public getListaEspera(@Query('ctx') ctx: GcmContexts): Promise<any> {
    return this._listaEsperaCamaHandler.getListaEspera(ctx);
  }
  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA, HPN_AUTHORITIES.CAMAS.VER_CAMAS])
  @Get('lista-espera-referencia')
  public getListaEsperaReferencia(@Query('ctx') ctx: GcmContexts): Promise<any> {
    return this._listaEsperaCamaReferenciaHandler.getListaEsperaRerencia(ctx);
  }
  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA])
  @Get('lista-reserva')
  public getListaReferencia(@Query('ctx') ctx: GcmContexts): Promise<Listareservaresponse[]> {
    return this._listaReservaHandler.getListaEsperaRerencia(ctx);
  }
  @Authorities([HPN_AUTHORITIES.CAMAS.RESERVA, HPN_AUTHORITIES.CAMAS.VER_CAMAS])
  @Get('estancia/:consecutivo')
  public getEstancias(@Param('consecutivo') consecutivo: number): Promise<Listareservaresponse[]> {
    return this._estanciaHandler.execute(+consecutivo);
  }
}
