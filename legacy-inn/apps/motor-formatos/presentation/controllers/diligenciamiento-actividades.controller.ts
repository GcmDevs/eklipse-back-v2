import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { DiligenciamientoService } from 'apps/motor-formatos/application';
import { DiligenciarFormatoDto } from '../dto';

@Controller('/v4/inn/fmts/dilig')
export class DiligenciamientoController extends BaseShelteredController {
  constructor(private readonly diligenciamientoService: DiligenciamientoService) {
    super();
  }

  @Post()
  async submit(@Body() data: DiligenciarFormatoDto): Promise<BaseApiResponse<any>> {
    const saved = await this.diligenciamientoService.fillIn(data);
    return {
      data: saved,
      message: data.completarInmediato
        ? 'registro diligenciado y enviado para aprobación'
        : 'registro diligencido guardado como borrador',
    };
  }

  @Patch('/:id/borrador')
  async updateBorrador(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: DiligenciarFormatoDto
  ): Promise<BaseApiResponse<any>> {
    const updated = await this.diligenciamientoService.updateBorrador(id, data);
    return {
      data: updated,
      message: 'Borrador actualizado',
    };
  }

  @Patch('/:id/completar')
  @HttpCode(200)
  async complete(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<any>> {
    const updated = await this.diligenciamientoService.complete(id);
    return {
      data: updated,
      message: 'Formato completado y enviado para aprobación del líder',
    };
  }

  @Get('/:id')
  async getOne(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<any>> {
    const found = await this.diligenciamientoService.getById(id);
    return { data: found };
  }

  @Get('/actividad/:registroActividadId')
  async getByActividad(
    @Param('registroActividadId', ParseIntPipe) registroActividadId: number
  ): Promise<BaseApiResponse<any>> {
    const found = await this.diligenciamientoService.findByRegActividadId(registroActividadId);
    return { data: found };
  }
}
