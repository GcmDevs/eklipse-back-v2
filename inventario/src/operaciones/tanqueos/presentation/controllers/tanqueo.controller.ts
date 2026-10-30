import { INN_AUTHORITIES } from '@inn/authorities';

import { BaseApiResponse } from '@common/domain/types';

import { BaseShelteredController } from '@common/presentation/controllers';

import {
  Authorities,
  HasDirectAuthority,
  RequireTenantCtxAuthority,
} from '@common/presentation/decorators';

import { PaginationHelper } from '@common/presentation/helpers';

import { TenantOverrideInterceptor } from '@common/presentation/interceptors';

import { getUser } from '@common/infrastructure/services';

import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';

import {
  SincronizarLoteTanqueosUseCase,
  TanqueoEvidenciasService,
  TanqueoInconsistenciaService,
  TanqueoService,
} from '@inn/operaciones/tanqueos/application';

import { ResultadoItemSync } from '@inn/operaciones/tanqueos/application/types';

import {
  ConfigUbicacionTanqueoRead,
  ResumenTanqueosRead,
  TanqueoDetalleRead,
  TanqueoInconsistenciaRead,
  TanqueoRead,
} from '@inn/operaciones/tanqueos/domain/reads';

import { TipoEvidencia } from '@inn/operaciones/tanqueos/domain/enums';

import {
  AnularTanqueoDto,
  AjustarOdometroDto,
  CorregirTanqueoDto,
  CreateTanqueoRepositorioRequestDto,
  EliminarTanqueoEvidenciaDto,
  FilterIntentoDto,
  FilterTanqueoDto,
  OrdenTanqueoEvidenciasDto,
  ReasignarTanqueoEvidenciaDto,
  LimpiarIntentosPendientesDto,
  ResolverIntentoDto,
  RevisarTanqueoDto,
  ResolveInconsistenciaDto,
  SincronizarLoteTanqueosDto,
  TanqueoEvidenciaDto,
} from '../dto';

import { TanqueoIntentoMapper } from '@inn/operaciones/tanqueos/infrastructure/mappers/tanqueo-intento.mapper';

import { TanqueoPresentationMapper } from '../mappers';

const T = INN_AUTHORITIES.GESTION_TANQUEOS.TANQUEOS;

@Controller('/v4/inn/vehiculos/tanqueos')
export class TanqueoController extends BaseShelteredController {
  constructor(
    private readonly tanqueoService: TanqueoService,

    private readonly evidenciasService: TanqueoEvidenciasService,

    private readonly syncLoteTanqueos: SincronizarLoteTanqueosUseCase,

    private readonly inconsistenciaService: TanqueoInconsistenciaService
  ) {
    super();
  }

  @Authorities([T.REGISTRAR, T.REGISTRAR_RETROACTIVOS])
  @UseInterceptors(TenantOverrideInterceptor)
  @RequireTenantCtxAuthority(T.REGISTRAR_RETROACTIVOS_TRANSVERSALES)
  @Post('sincronizar-lote')
  async syncLote(
    @Body() syncData: SincronizarLoteTanqueosDto,
    @HasDirectAuthority(T.GESTIONAR_INTENTOS)
    hasReponerAuthority: boolean,
    @HasDirectAuthority(T.REGISTRAR_RETROACTIVOS_TRANSVERSALES)
    hasRegistrarTransversalAuthority: boolean,
    @Headers('idempotency-key') idempotencyKeyHeader?: string
  ): Promise<BaseApiResponse<ResultadoItemSync[]>> {
    const idempotencyKey = idempotencyKeyHeader ?? syncData.idempotencyKey;
    if (!idempotencyKey) {
      throw new BadRequestException('Se requiere idempotencyKey');
    }
    const usuario = getUser();
    const comando = TanqueoPresentationMapper.toSincronizarLote(
      syncData,
      usuario.id,
      idempotencyKey
    );

    const resultados = await this.syncLoteTanqueos.execute(
      comando,
      hasReponerAuthority,
      hasRegistrarTransversalAuthority
    );
    return { data: resultados };
  }

  @Authorities([T.REGISTRAR])
  @UseInterceptors(TenantOverrideInterceptor)
  @RequireTenantCtxAuthority(T.REGISTRAR_RETROACTIVOS_TRANSVERSALES)
  @Post('repositorio')
  public async createFromRepositorio(
    @Body() data: CreateTanqueoRepositorioRequestDto,

    @HasDirectAuthority(T.GESTIONAR_INTENTOS)
    hasReponerAuthority: boolean,

    @HasDirectAuthority(T.REGISTRAR_RETROACTIVOS_TRANSVERSALES)
    hasRegistrarTransversalAuthority: boolean,

    @Headers('idempotency-key') idempotencyKeyHeader?: string
  ): Promise<BaseApiResponse<TanqueoRead>> {
    if (!idempotencyKeyHeader?.trim()) {
      throw new BadRequestException('Se requiere idempotency-key');
    }

    const tanqueo = await this.tanqueoService.createFromRepositorio(
      data,

      idempotencyKeyHeader.trim(),

      hasReponerAuthority,

      hasRegistrarTransversalAuthority
    );

    return { data: tanqueo, message: 'Tanqueo desde repositorio registrado' };
  }

  @Authorities([T.VER])
  @Get()
  async getAll(
    @Query() query: FilterTanqueoDto,

    @HasDirectAuthority(T.VER_T_SEDES)
    todasLasSedes: boolean
  ) {
    const filters = TanqueoPresentationMapper.toTanqueoFiltersFromQuery(query);

    const [items, count] = todasLasSedes
      ? await this.tanqueoService.getAllSedes(query.page, query.limit, filters)
      : await this.tanqueoService.getAll(query.page, query.limit, filters);

    return PaginationHelper.response(items, count, query.page, query.limit);
  }

  @Authorities([T.VER])
  @Get('/resumen')
  public async getResumen(
    @Query() query: FilterTanqueoDto,

    @HasDirectAuthority(T.VER_T_SEDES)
    todasLasSedes: boolean
  ): Promise<BaseApiResponse<ResumenTanqueosRead>> {
    const filters = TanqueoPresentationMapper.toTanqueoFiltersFromQuery(query);

    const resumen = todasLasSedes
      ? await this.tanqueoService.getResumenAllSedes(filters)
      : await this.tanqueoService.getResumen(filters);

    return { data: resumen };
  }

  @Authorities([T.REGISTRAR, T.REGISTRAR_RETROACTIVOS, T.VER])
  @Get('/config-ubicacion')
  public getConfigUbicacion(): BaseApiResponse<ConfigUbicacionTanqueoRead> {
    return {
      data: this.tanqueoService.getConfigUbicacion(),
    };
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.VEHICULOS.GESTIONAR])
  @Post('/lecturas-odometro')
  public async ajustarOdometro(@Body() data: AjustarOdometroDto) {
    const lectura = await this.tanqueoService.ajustarOdometro(data);

    return { data: { id: lectura.getId.getValor, lectura: lectura.getLectura } };
  }

  @Authorities([T.GESTIONAR_INTENTOS])
  @Get('/intentos')
  public async listIntentos(@Query() query: FilterIntentoDto) {
    const [items, count] = await this.tanqueoService.listIntentosPendientes(
      query.page,

      query.limit
    );

    return PaginationHelper.response(
      TanqueoIntentoMapper.toViewList(items),

      count,

      query.page,

      query.limit
    );
  }

  @Authorities([T.GESTIONAR_INTENTOS])
  @Patch('/intentos/:intentoId/recuperar')
  public async recuperarIntento(
    @Param('intentoId', ParseIntPipe) intentoId: number,

    @Body() data: ResolverIntentoDto
  ) {
    if (!data.tanqueoId) throw new BadRequestException('tanqueoId es obligatorio');

    const updated = await this.tanqueoService.recuperarIntento(intentoId, data.tanqueoId);

    return {
      data: TanqueoIntentoMapper.toView(updated),
    };
  }

  @Authorities([T.GESTIONAR_INTENTOS])
  @Delete('/intentos/pendientes')
  public async limpiarIntentosPendientes(@Body() body: LimpiarIntentosPendientesDto) {
    const result = await this.tanqueoService.limpiarIntentosPendientes(body?.observacion);

    return { data: result, message: 'Intentos pendientes eliminados' };
  }

  @Authorities([T.VER])
  @UseInterceptors(TenantOverrideInterceptor)
  @RequireTenantCtxAuthority(T.VER_T_SEDES)
  @Get('/:id')
  public async getById(@Param('id', ParseIntPipe) id: number) {
    const data = await this.tanqueoService.getDetalle(id);

    return { data };
  }

  @Authorities([T.RESOLVER])
  @UseInterceptors(TenantOverrideInterceptor)
  @RequireTenantCtxAuthority(T.RESOLVER_TRANSVERSAL)
  @Patch('/:id/inconsistencias/:inconsistenciaId/resolver')
  public async resolverInconsistencia(
    @Param('id', ParseIntPipe) tanqueoId: number,
    @Param('inconsistenciaId', ParseIntPipe) inconsistenciaId: number,
    @Body() data: ResolveInconsistenciaDto
  ): Promise<BaseApiResponse<TanqueoInconsistenciaRead>> {
    const updated = await this.inconsistenciaService.resolve(
      tanqueoId,
      inconsistenciaId,
      data.contactoRealizado,
      data.notaResolucion,
      data.notaContacto,
      data.resultado
    );
    return {
      data: updated,
      message: 'Inconsistencia gestionada exitosamente',
    };
  }

  @Authorities([T.RESOLVER])
  @UseInterceptors(TenantOverrideInterceptor)
  @RequireTenantCtxAuthority(T.RESOLVER_TRANSVERSAL)
  @Patch('/:id/corregir')
  public async corregir(
    @Param('id', ParseIntPipe) id: number,

    @Body() data: CorregirTanqueoDto
  ): Promise<BaseApiResponse<TanqueoDetalleRead>> {
    const updated = await this.tanqueoService.corregir(id, data);

    return { data: updated, message: 'Tanqueo corregido' };
  }

  @Authorities([T.RESOLVER])
  @UseInterceptors(TenantOverrideInterceptor)
  @RequireTenantCtxAuthority(T.RESOLVER_TRANSVERSAL)
  @Patch('/:id/revisar')
  public async revisar(
    @Param('id', ParseIntPipe) id: number,

    @Body() data: RevisarTanqueoDto
  ): Promise<BaseApiResponse<TanqueoRead>> {
    const updated = await this.tanqueoService.review(id, data.estadoDestino, data.motivo);

    return { data: updated, message: 'Revisión registrada' };
  }

  @Authorities([T.RESOLVER])
  @UseInterceptors(TenantOverrideInterceptor)
  @RequireTenantCtxAuthority(T.RESOLVER_TRANSVERSAL)
  @Post('/:id/evidencias')
  public async agregarEvidencia(
    @Param('id', ParseIntPipe) id: number,

    @Body() data: TanqueoEvidenciaDto
  ) {
    await this.evidenciasService.agregarTanqueo(id, data.tipo, data.mediaId, data.motivo);

    const view = await this.tanqueoService.getById(id);

    return { data: view };
  }

  @Authorities([T.RESOLVER])
  @UseInterceptors(TenantOverrideInterceptor)
  @RequireTenantCtxAuthority(T.RESOLVER_TRANSVERSAL)
  @Delete('/:id/evidencias/:tipo')
  public async eliminarEvidencia(
    @Param('id', ParseIntPipe) id: number,

    @Param('tipo', new ParseEnumPipe(TipoEvidencia)) tipo: TipoEvidencia,

    @Body() data: EliminarTanqueoEvidenciaDto
  ) {
    await this.evidenciasService.eliminarTanqueo(id, tipo, data.motivo);

    const view = await this.tanqueoService.getById(id);

    return { data: view };
  }

  @Authorities([T.RESOLVER])
  @UseInterceptors(TenantOverrideInterceptor)
  @RequireTenantCtxAuthority(T.RESOLVER_TRANSVERSAL)
  @Post('/:id/evidencias/:tipo/reasignar')
  public async reasignarEvidencia(
    @Param('id', ParseIntPipe) id: number,

    @Param('tipo', new ParseEnumPipe(TipoEvidencia)) tipo: TipoEvidencia,

    @Body() data: ReasignarTanqueoEvidenciaDto
  ) {
    await this.evidenciasService.reasignarTanqueo(id, tipo, data.tipoDestino, data.motivo);

    const view = await this.tanqueoService.getById(id);

    return { data: view };
  }

  @Authorities([T.RESOLVER])
  @UseInterceptors(TenantOverrideInterceptor)
  @RequireTenantCtxAuthority(T.RESOLVER_TRANSVERSAL)
  @Patch('/:id/evidencias/orden')
  public async ordenEvidencias(
    @Param('id', ParseIntPipe) id: number,

    @Body() data: OrdenTanqueoEvidenciasDto
  ) {
    await this.evidenciasService.reordenarTanqueo(id, data.tipos);

    const view = await this.tanqueoService.getById(id);

    return { data: view };
  }

  @Authorities([T.RESOLVER])
  @UseInterceptors(TenantOverrideInterceptor)
  @RequireTenantCtxAuthority(T.RESOLVER_TRANSVERSAL)
  @Patch('/:id/anular')
  public async anular(
    @Param('id', ParseIntPipe) id: number,

    @Body() data: AnularTanqueoDto
  ): Promise<BaseApiResponse<TanqueoRead>> {
    const updated = await this.tanqueoService.voidRecord(id, data.motivoAnulacion);

    return { data: updated, message: 'Tanqueo anulado' };
  }
}
