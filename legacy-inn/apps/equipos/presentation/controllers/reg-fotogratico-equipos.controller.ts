import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers/base-sheltered.controller';
import { RegFotograficoEquiposService } from '@equipos/application';
import { Body, Controller, Delete, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { AddFotoDto, UpdateFotoDto } from '../dto';

@Controller('/v4/inn/equipos')
export class RegFotograficoEquiposController extends BaseShelteredController {
  constructor(private readonly regFotograficoequipoService: RegFotograficoEquiposService) {
    super();
  }

  @Post(':id/fotos')
  async addFoto(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: AddFotoDto
  ): Promise<BaseApiResponse<void>> {
    await this.regFotograficoequipoService.addFoto(id, data);
    return { message: `Foto anexada al aquipo con id: ${id} con exito` };
  }

  @Delete(':id/fotos/:archivoId')
  async removeFoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('archivoId', ParseIntPipe) archivoId: number
  ): Promise<BaseApiResponse<void>> {
    await this.regFotograficoequipoService.removeFoto(id, archivoId);
    return { message: `Foto eliminada del aquipo con id: ${id} con exito` };
  }

  @Patch(':id/fotos/:archivoId')
  async updateFoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('archivoId', ParseIntPipe) archivoId: number,
    @Body() data: UpdateFotoDto
  ): Promise<BaseApiResponse<void>> {
    await this.regFotograficoequipoService.updateFoto(id, archivoId, data);
    return { message: `foto del aquipo con id: ${id} actualizada con exito` };
  }

  @Patch(':id/fotos/:archivoId/principal')
  async markAsFotoPrincipal(
    @Param('id', ParseIntPipe) id: number,
    @Param('archivoId', ParseIntPipe) archivoId: number
  ): Promise<BaseApiResponse<void>> {
    await this.regFotograficoequipoService.markAsFotoPrincipal(id, archivoId);
    return { message: `Operacion exitosa` };
  }
}
