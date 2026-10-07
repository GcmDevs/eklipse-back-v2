import { Body, Controller, Get, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { CuentaAltoCostoImpl } from '../../infrastructure/services/cac.impl';
import {
  ActualizarPacienteCacDto,
  ActualizarPacienteCacResponse,
  CrearPacienteCacDto,
  CrearPacienteCacResponse,
  ConsultaCacResponse,
  GuardadoCacResponse,
  GuardarCacDto,
  RecursosPacienteCacResponse,
  CatalogoOncologicoResponse,
} from '../dtos/cac.dto';
import { validarBusqueda, validarCodigoCie10 } from '../../infrastructure/services/contrato';
import { FiltrosListadoCac, ListadoCacResponse } from '../dtos/listado.dto';
import { ExcelCacResponse } from '../dtos/excel.dto';
import { SLN_AUTHORITIES } from '@inn/authorities';

@ApiTags('Cuenta de alto costo')
@CommonGuards()
@Controller('v1/cuenta-alto-costo')
export class CuentaAltoCostoController {
  constructor(private readonly servicio: CuentaAltoCostoImpl) {}

  @Get('registros/excel')
  @Authorities([SLN_AUTHORITIES.CUENTA_ALTO_COSTO.GESTIONAR, SLN_AUTHORITIES.CUENTA_ALTO_COSTO.VERINFORMES])
  public exportarExcel(@Query() filtros: FiltrosListadoCac): Promise<ExcelCacResponse> {
    return this.servicio.exportarExcel(filtros);
  }

  @Get('registros')
  @Authorities([SLN_AUTHORITIES.CUENTA_ALTO_COSTO.GESTIONAR, SLN_AUTHORITIES.CUENTA_ALTO_COSTO.VERINFORMES])
  public listar(@Query() filtros: FiltrosListadoCac): Promise<ListadoCacResponse> {
    return this.servicio.listar(filtros);
  }

  @Get('diagnosticos-oncologicos')
  @Authorities([SLN_AUTHORITIES.CUENTA_ALTO_COSTO.GESTIONAR, SLN_AUTHORITIES.CUENTA_ALTO_COSTO.VERINFORMES])
  public diagnosticosOncologicos(): Promise<CatalogoOncologicoResponse> {
    return this.servicio.diagnosticosOncologicos();
  }

  @Get()
  @Authorities([SLN_AUTHORITIES.CUENTA_ALTO_COSTO.GESTIONAR, SLN_AUTHORITIES.CUENTA_ALTO_COSTO.VERINFORMES])
  public consultar(
    @Query('tipoDocumento') tipoDocumento: string,
    @Query('documento') documento: string,
    @Query('codigoCie10') codigoCie10?: string
  ): Promise<ConsultaCacResponse> {
    const busqueda = validarBusqueda(tipoDocumento, documento);
    return this.servicio.consultarAutorizado(
      busqueda.tipoDocumento,
      busqueda.documento,
      codigoCie10 === undefined ? undefined : validarCodigoCie10(codigoCie10)
    );
  }

  @Put()
  @Authorities([SLN_AUTHORITIES.CUENTA_ALTO_COSTO.GESTIONAR])
  public guardar(@Body() payload: GuardarCacDto): Promise<GuardadoCacResponse> {
    return this.servicio.guardar(payload);
  }

  @Get('recursos-paciente')
  @Authorities([SLN_AUTHORITIES.CUENTA_ALTO_COSTO.GESTIONAR])
  public recursosPaciente(): Promise<RecursosPacienteCacResponse> {
    return this.servicio.recursosPaciente();
  }

  @Patch('paciente')
  @Authorities([SLN_AUTHORITIES.CUENTA_ALTO_COSTO.GESTIONAR])
  public actualizarPaciente(
    @Body() payload: ActualizarPacienteCacDto
  ): Promise<ActualizarPacienteCacResponse> {
    return this.servicio.actualizarPaciente(payload);
  }

  @Post('paciente')
  @Authorities([SLN_AUTHORITIES.CUENTA_ALTO_COSTO.GESTIONAR])
  public crearPaciente(@Body() payload: CrearPacienteCacDto): Promise<CrearPacienteCacResponse> {
    return this.servicio.crearPaciente(payload);
  }
}
