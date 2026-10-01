import { BaseApiResponse } from '@common/domain/types';
import { getUser } from '@common/infrastructure/services';
import { BaseShelteredController } from '@common/presentation/controllers';
import { PaginationHelper } from '@common/presentation/helpers';
import {
  AccesorioTipoEquipoService,
  DocumentoTipoEquipoService,
  PlanDefaultTipoEquipoService,
  PreviewSincronizacionAccesorioRead,
  SyncAccesorioTipoEquipoService,
  TipoEquipoService,
} from '@equipos/application';
import { AuditTipoEquipoService } from '@equipos/application/audit';
import {
  AccesorioTipoEquipoRead,
  AuditTipoEquipoRead,
  DocumentoTipoEquipoRead,
  PlanDefaultTipoEquipoRead,
  TipoEquipoRead,
} from '@equipos/domain/read';
import { FilterEstadoMasHijosDto } from '@common/presentation/dto';
import {
  CreateAccesorioTipoEquipoDto,
  CreateDocumentoTipoEquipoDto,
  CreatePlanDefaultTipoEquipoDto,
  CreateTipoEquipoDto,
  FilterTipoEquipoDto,
  SyncAccesorioDto,
  UpdateAccesorioTipoEquipoDto,
  UpdateDocumentoTipoEquipoDto,
  UpdateFichaTecnicaTipoEquipoDto,
  UpdatePlanDefaultTipoEquipoDto,
  UpdateTipoEquipoDto,
} from '@equipos/presentation/dto';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';

@Controller('/v4/inn/tipos-equipo')
export class TipoEquipoController extends BaseShelteredController {
  constructor(
    private readonly service: TipoEquipoService,
    private readonly auditService: AuditTipoEquipoService,
    private readonly accesorioService: AccesorioTipoEquipoService,
    private readonly sincronizarService: SyncAccesorioTipoEquipoService,
    private readonly documentoService: DocumentoTipoEquipoService,
    private readonly planDefaultService: PlanDefaultTipoEquipoService
  ) {
    super();
  }

  @Post()
  async create(@Body() data: CreateTipoEquipoDto): Promise<BaseApiResponse<TipoEquipoRead>> {
    const entity = await this.service.create(data);
    return { data: entity };
  }

  @Get()
  async getAll(
    @Query() { page, limit, ...filters }: FilterTipoEquipoDto
  ): Promise<BaseApiResponse<TipoEquipoRead[]>> {
    const [list, count] = await this.service.findAllAndCount({ page, limit, ...filters });
    return PaginationHelper.response(list, count, page, limit);
  }

  @Get('/:id/auditoria')
  async getAuditoria(
    @Param('id', ParseIntPipe) id: number
  ): Promise<BaseApiResponse<AuditTipoEquipoRead[]>> {
    const auditoria = await this.auditService.findByTipoEquipo(id);
    return { data: auditoria };
  }

  @Get('/:id')
  async getOne(
    @Param('id', ParseIntPipe) id: number,
    @Query() filters: FilterEstadoMasHijosDto
  ): Promise<BaseApiResponse<TipoEquipoRead>> {
    const entity = await this.service.getOneById(id, filters);
    return { data: entity };
  }

  @Patch('/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateTipoEquipoDto
  ): Promise<BaseApiResponse<TipoEquipoRead>> {
    const entity = await this.service.update(id, data);
    return { data: entity };
  }

  @Patch('/:id/ficha-tecnica')
  async modifyFichaTecnica(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateFichaTecnicaTipoEquipoDto
  ): Promise<BaseApiResponse<TipoEquipoRead>> {
    const fichaTec = await this.service.updateFichaTecnica(id, data);
    return { data: fichaTec };
  }

  @Post('/:id/accesorios')
  async createAccesorio(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: CreateAccesorioTipoEquipoDto
  ): Promise<BaseApiResponse<AccesorioTipoEquipoRead>> {
    const accesorios = await this.accesorioService.create(id, data);
    return { data: accesorios };
  }

  @Patch('/:id/accesorios/:accesorioId')
  async updateAccesorio(
    @Param('id', ParseIntPipe) id: number,
    @Param('accesorioId', ParseIntPipe) accesorioId: number,
    @Body() data: UpdateAccesorioTipoEquipoDto
  ): Promise<BaseApiResponse<AccesorioTipoEquipoRead>> {
    const accesorio = await this.accesorioService.update(id, accesorioId, data);
    return { data: accesorio };
  }

  @Patch('/:id/accesorios/:accesorioId/deprecar')
  async deprecarAccesorio(
    @Param('id', ParseIntPipe) id: number,
    @Param('accesorioId', ParseIntPipe) accesorioId: number
  ): Promise<BaseApiResponse<AccesorioTipoEquipoRead>> {
    const entity = await this.accesorioService.deprecar(id, accesorioId);
    return { data: entity };
  }

  @Get('/:id/accesorios/:accesorioId/sincronizacion/preview')
  async previewSincronizacionAccesorio(
    @Param('id', ParseIntPipe) id: number,
    @Param('accesorioId', ParseIntPipe) accesorioId: number
  ): Promise<BaseApiResponse<PreviewSincronizacionAccesorioRead>> {
    const preview = await this.sincronizarService.preview(id, accesorioId);
    return { data: preview };
  }

  @Post('/:id/accesorios/:accesorioId/sincronizar')
  async sincronizarAccesorio(
    @Param('id', ParseIntPipe) id: number,
    @Param('accesorioId', ParseIntPipe) accesorioId: number,
    @Body() data: SyncAccesorioDto
  ): Promise<BaseApiResponse<{ ok: true }>> {
    const usuario = getUser();
    await this.sincronizarService.execute({
      tipoEquipoId: id,
      accesorioEstandarId: accesorioId,
      accion: data.accion,
      alcance: data.alcance,
      equipoIds: data.equipoIds,
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      observaciones: data.observaciones,
    });
    return { data: { ok: true } };
  }

  @Post('/:id/documentos')
  async createDocumento(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: CreateDocumentoTipoEquipoDto
  ): Promise<BaseApiResponse<DocumentoTipoEquipoRead>> {
    const entity = await this.documentoService.create(id, data);
    return { data: entity };
  }

  @Patch('/:id/documentos/:documentoId')
  async updateDocumento(
    @Param('id', ParseIntPipe) id: number,
    @Param('documentoId', ParseIntPipe) documentoId: number,
    @Body() data: UpdateDocumentoTipoEquipoDto
  ): Promise<BaseApiResponse<DocumentoTipoEquipoRead>> {
    const entity = await this.documentoService.update(id, documentoId, data);
    return { data: entity };
  }

  @Patch('/:id/documentos/:documentoId/deprecar')
  async deprecarDocumento(
    @Param('id', ParseIntPipe) id: number,
    @Param('documentoId', ParseIntPipe) documentoId: number
  ): Promise<BaseApiResponse<DocumentoTipoEquipoRead>> {
    const entity = await this.documentoService.depreciate(id, documentoId);
    return { data: entity };
  }

  @Post('/:id/planes-default')
  async createPlanDefault(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: CreatePlanDefaultTipoEquipoDto
  ): Promise<BaseApiResponse<PlanDefaultTipoEquipoRead>> {
    const entity = await this.planDefaultService.create(id, data);
    return { data: entity };
  }

  @Patch('/:id/planes-default/:planId')
  async updatePlanDefault(
    @Param('id', ParseIntPipe) id: number,
    @Param('planId', ParseIntPipe) planId: number,
    @Body() data: UpdatePlanDefaultTipoEquipoDto
  ): Promise<BaseApiResponse<PlanDefaultTipoEquipoRead>> {
    const entity = await this.planDefaultService.update(id, planId, data);
    return { data: entity };
  }

  @Patch('/:id/planes-default/:planId/inactivar')
  async inactivarPlanDefault(
    @Param('id', ParseIntPipe) id: number,
    @Param('planId', ParseIntPipe) planId: number
  ): Promise<BaseApiResponse<PlanDefaultTipoEquipoRead>> {
    const entity = await this.planDefaultService.deactivate(id, planId);
    return { data: entity };
  }
}
