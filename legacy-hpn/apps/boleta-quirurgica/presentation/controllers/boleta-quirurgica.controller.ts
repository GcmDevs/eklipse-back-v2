import { BadRequestException, Body, Controller, Get, Ip, Post, Query } from '@nestjs/common';
import { CommonGuards } from '@common/presentation/decorators';
import { BoletaQuirurgicaImpl } from '@boleta-quirurgica/infraestructure/repositories';
import {
  BoletaQuirurgicaDetalleDto,
  GuardarAutorizacionDto,
  GuardarGestorQxDto,
  GuardarMaosDto,
  GuardarObservacionDto,
  GuardarProgramacionDto,
  InicializarBoletaQuirurgicaDto,
  ObservacionesDto,
} from '../dtos';
@CommonGuards()
@Controller('v4/boleta-quirurgica')
export class BoletaQuirurgicaController {
  constructor(private readonly _boletaQuirurgica: BoletaQuirurgicaImpl) {}

  @Get()
  public async fetchBoletaQuirurgica() {
    try {
      return await this._boletaQuirurgica.fetchBoletaQuirurgica();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('detalle')
  public async fetchDetalle(@Query() query: BoletaQuirurgicaDetalleDto) {
    try {
      return await this._boletaQuirurgica.fetchDetalle(query.ingreso, query.folio);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('autorizaciones')
  public async guardarAutorizacion(@Body() body: GuardarAutorizacionDto, @Ip() ip: string) {
    try {
      return await this._boletaQuirurgica.guardarAutorizacion(body, ip);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('observaciones')
  public async guardarObservacion(@Body() body: GuardarObservacionDto) {
    try {
      return await this._boletaQuirurgica.guardarObservacion(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @Get('observaciones')
  public async obtenerObservaciones(@Query() query: ObservacionesDto) {
    console.log('query', query);
    try {
      return await this._boletaQuirurgica.obtenerObservaciones(query);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('programacion')
  public async guardarProgramacion(@Body() body: GuardarProgramacionDto) {
    try {
      return await this._boletaQuirurgica.guardarProgramacion(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('gestor-qx')
  public async guardarGestorQx(@Body() body: GuardarGestorQxDto) {
    try {
      return await this._boletaQuirurgica.guardarGestorQx(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('maos')
  public async guardarMaos(@Body() body: GuardarMaosDto) {
    try {
      return await this._boletaQuirurgica.guardarMaos(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('inicializar')
  public async inicializar(@Body() body: InicializarBoletaQuirurgicaDto) {
    try {
      return await this._boletaQuirurgica.inicializarRegistros(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
