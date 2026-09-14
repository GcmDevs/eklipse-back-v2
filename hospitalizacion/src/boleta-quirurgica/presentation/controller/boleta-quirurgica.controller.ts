import { BadRequestException, Body, Controller, Get, Ip, Post, Query } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import {
  BoletaQuirurgicaDetalleDto,
  GuardarAutorizacionDto,
  GuardarGestorQxDto,
  GuardarMaosDto,
  GuardarObservacionDto,
  GuardarProgramacionDto,
  InicializarBoletaQuirurgicaDto,
  ObservacionesDto,
} from '../dto';
import {
  AutorizacionBoletaQuirurgicaImpl,
  FetchBoletaQuirurgicaImpl,
  FetchDetalleBoletaQuirurgicaImpl,
  GestorQxBoletaQuirurgicaImpl,
  InicializarBoletaQuirurgicaImpl,
  MaosBoletaQuirurgicaImpl,
  ObservacionBoletaQuirurgicaImpl,
  ProgramacionBoletaQuirurgicaImpl,
} from '@hpn/boleta-quirurgica/infraestructure/services';
import { HPN_AUTHORITIES } from '@authorities';

@CommonGuards()
@Controller('v1/boleta-quirurgica')
export class BoletaQuirurgicaController {
  constructor(
    private readonly _fetchBoletaQuirurgica: FetchBoletaQuirurgicaImpl,
    private readonly _fetchDetalleBoletaQuirurgica: FetchDetalleBoletaQuirurgicaImpl,
    private readonly _autorizacionBoletaQuirurgica: AutorizacionBoletaQuirurgicaImpl,
    private readonly _observacionBoletaQuirurgica: ObservacionBoletaQuirurgicaImpl,
    private readonly _programacionBoletaQuirurgica: ProgramacionBoletaQuirurgicaImpl,
    private readonly _gestorQxBoletaQuirurgica: GestorQxBoletaQuirurgicaImpl,
    private readonly _maosBoletaQuirurgica: MaosBoletaQuirurgicaImpl,
    private readonly _inicializarBoletaQuirurgica: InicializarBoletaQuirurgicaImpl
  ) {}

  @Authorities([
    HPN_AUTHORITIES.BOLETA_QUIRURGICA.AUTORIZACIONES,
    HPN_AUTHORITIES.BOLETA_QUIRURGICA.GESTORQX,
    HPN_AUTHORITIES.BOLETA_QUIRURGICA.MAOS,
    HPN_AUTHORITIES.BOLETA_QUIRURGICA.PROGRAMACION,
  ])
  @Get()
  public async fetchBoletaQuirurgica() {
    try {
      return await this._fetchBoletaQuirurgica.execute();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([
    HPN_AUTHORITIES.BOLETA_QUIRURGICA.AUTORIZACIONES,
    HPN_AUTHORITIES.BOLETA_QUIRURGICA.GESTORQX,
    HPN_AUTHORITIES.BOLETA_QUIRURGICA.MAOS,
    HPN_AUTHORITIES.BOLETA_QUIRURGICA.PROGRAMACION,
  ])
  @Get('detalle')
  public async fetchDetalle(@Query() query: BoletaQuirurgicaDetalleDto) {
    try {
      return await this._fetchDetalleBoletaQuirurgica.execute(query.ingreso, query.folio);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.BOLETA_QUIRURGICA.AUTORIZACIONES])
  @Post('autorizaciones')
  public async guardarAutorizacion(@Body() body: GuardarAutorizacionDto, @Ip() ip: string) {
    try {
      return await this._autorizacionBoletaQuirurgica.execute(body, ip);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([
    HPN_AUTHORITIES.BOLETA_QUIRURGICA.AUTORIZACIONES,
    HPN_AUTHORITIES.BOLETA_QUIRURGICA.GESTORQX,
    HPN_AUTHORITIES.BOLETA_QUIRURGICA.MAOS,
    HPN_AUTHORITIES.BOLETA_QUIRURGICA.PROGRAMACION,
  ])
  @Post('observaciones')
  public async guardarObservacion(@Body() body: GuardarObservacionDto) {
    try {
      return await this._observacionBoletaQuirurgica.executePost(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([
    HPN_AUTHORITIES.BOLETA_QUIRURGICA.AUTORIZACIONES,
    HPN_AUTHORITIES.BOLETA_QUIRURGICA.GESTORQX,
    HPN_AUTHORITIES.BOLETA_QUIRURGICA.MAOS,
    HPN_AUTHORITIES.BOLETA_QUIRURGICA.PROGRAMACION,
  ])
  @Get('observaciones')
  public async obtenerObservaciones(@Query() query: ObservacionesDto) {
    try {
      return await this._observacionBoletaQuirurgica.executeGet(query);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.BOLETA_QUIRURGICA.PROGRAMACION])
  @Post('programacion')
  public async guardarProgramacion(@Body() body: GuardarProgramacionDto) {
    try {
      return await this._programacionBoletaQuirurgica.execute(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.BOLETA_QUIRURGICA.GESTORQX])
  @Post('gestor-qx')
  public async guardarGestorQx(@Body() body: GuardarGestorQxDto) {
    try {
      return await this._gestorQxBoletaQuirurgica.execute(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.BOLETA_QUIRURGICA.MAOS])
  @Post('maos')
  public async guardarMaos(@Body() body: GuardarMaosDto) {
    try {
      return await this._maosBoletaQuirurgica.execute(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('inicializar')
  public async inicializar(@Body() body: InicializarBoletaQuirurgicaDto) {
    try {
      return await this._inicializarBoletaQuirurgica.execute(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
