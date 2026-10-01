import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { PaginationHelper } from '@common/presentation/helpers';
import { getUser } from '@common/infrastructure/services';
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { SincronizarLoteTanqueosUseCase, TanqueoService } from '@vehiculos/application';
import { ResultadoItemSync } from '@vehiculos/application/types';
import { ResumenTanqueosRead, TanqueoRead } from '@vehiculos/domain/reads';
import {
  ChangeEstadoTanqueoDto,
  CreateTanqueoDto,
  FilterTanqueoDto,
  SincronizarLoteTanqueosDto,
} from '../dto';
import { TanqueoPresentationMapper } from '../mappers';
import { Authorities } from '@common/presentation/decorators';
import { INN_AUTHORITIES } from '@authorities/inventario';
import { HasDirectAuthority } from '@equipos/presentation/decorators/is-admin.decorator';

@Controller('/v4/inn/vehiculos/tanqueos')
export class TanqueoController extends BaseShelteredController {
  constructor(
    private readonly tanqueoService: TanqueoService,
    private readonly syncLoteTanqueos: SincronizarLoteTanqueosUseCase
  ) {
    super();
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.TANQUEOS.REGISTRAR])
  @Post('sincronizar-lote')
  async syncLote(
    @Body() syncData: SincronizarLoteTanqueosDto,
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
    const resultados = await this.syncLoteTanqueos.execute(comando);
    return { data: resultados };
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.TANQUEOS.REGISTRAR])
  @Post()
  public async createFromRepositorio(
    @Body() data: CreateTanqueoDto
  ): Promise<BaseApiResponse<TanqueoRead>> {
    const tanqueo = await this.tanqueoService.createFromRepositorio(data);
    return { data: tanqueo, message: 'Tanqueo desde repositorio registrado' };
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.TANQUEOS.VER])
  @Get()
  async getAll(
    @Query() query: FilterTanqueoDto,
    @HasDirectAuthority(INN_AUTHORITIES.GESTION_TANQUEOS.TANQUEOS.VER_T_SEDES)
    todasLasSedes: boolean
  ) {
    const filters = TanqueoPresentationMapper.toTanqueoFiltersFromQuery(query);
    const [items, count] = todasLasSedes
      ? await this.tanqueoService.getAllSedes(query.page, query.limit, filters)
      : await this.tanqueoService.getAll(query.page, query.limit, filters);
    return PaginationHelper.response(items, count, query.page, query.limit);
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.TANQUEOS.VER])
  @Get('/resumen')
  public async getResumen(
    @Query() query: FilterTanqueoDto,
    @HasDirectAuthority(INN_AUTHORITIES.GESTION_TANQUEOS.TANQUEOS.VER_T_SEDES)
    todasLasSedes: boolean
  ): Promise<BaseApiResponse<ResumenTanqueosRead>> {
    const filters = TanqueoPresentationMapper.toTanqueoFiltersFromQuery(query);
    const resumen = todasLasSedes
      ? await this.tanqueoService.getResumenAllSedes(filters)
      : await this.tanqueoService.getResumen(filters);
    return { data: resumen };
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.TANQUEOS.RESOLVER])
  @Patch('/:id/aprobar')
  public async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ChangeEstadoTanqueoDto
  ): Promise<BaseApiResponse<TanqueoRead>> {
    const updated = await this.tanqueoService.approve(id, data.motivo);
    return {
      data: updated,
      message: 'Tanqueo aprobado exitosamente',
    };
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.TANQUEOS.RESOLVER])
  @Patch('/:id/rechazar')
  public async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ChangeEstadoTanqueoDto
  ): Promise<BaseApiResponse<TanqueoRead>> {
    const updated = await this.tanqueoService.reject(id, data.motivo);
    return {
      data: updated,
      message: 'Tanqueo rechazado exitosamente',
    };
  }
}
