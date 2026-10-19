import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { FilterSearchPaginatedDto } from '@common/presentation/dto';
import { PaginationHelper } from '@common/presentation/helpers';
import { CompraService, DocumentoCompraService } from '@equipos/application';
import { CompraRead, DocumentoTipoEquipoRead } from '@equipos/domain/read';
import {
  AgregarEquiposCompraDto,
  CreateCompraDto,
  CreateDocumentoTipoEquipoDto,
  UpdateCompraDto,
  UpdateDocumentoTipoEquipoDto,
} from '@equipos/presentation/dto';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';

@Controller('/v4/inn/compras')
export class CompraController extends BaseShelteredController {
  constructor(
    private readonly service: CompraService,
    private readonly documentoService: DocumentoCompraService
  ) {
    super();
  }

  @Post()
  async create(@Body() data: CreateCompraDto): Promise<BaseApiResponse<CompraRead>> {
    const entity = await this.service.create(data);
    return { data: entity };
  }

  @Get('/:id')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<CompraRead>> {
    const compra = await this.service.getById(id);
    return { data: compra };
  }

  @Get()
  async getAll(
    @Query() { page, limit, search }: FilterSearchPaginatedDto
  ): Promise<BaseApiResponse<CompraRead[]>> {
    const [list, count] = await this.service.findAllAndCount(page, limit, search);
    return PaginationHelper.response(list, count, page, limit);
  }

  @Patch('/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCompraDto
  ): Promise<BaseApiResponse<CompraRead>> {
    const entity = await this.service.update(id, data);
    return { data: entity };
  }

  @Post('/:id/equipos')
  async agregarEquipos(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: AgregarEquiposCompraDto
  ): Promise<BaseApiResponse<CompraRead>> {
    const entity = await this.service.addEquiposACompra(id, data);
    return { data: entity };
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
  async depreciateDocumento(
    @Param('id', ParseIntPipe) id: number,
    @Param('documentoId', ParseIntPipe) documentoId: number
  ): Promise<BaseApiResponse<void>> {
    await this.documentoService.depreciate(id, documentoId);
    return { message: 'Documento depreciado con exito' };
  }
}
