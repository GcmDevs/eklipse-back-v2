import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificacionesService } from '../../infraestructure/repositories/notificaciones.service';

@ApiTags('v4 - Notificaciones')
@Controller('v4/gestor-estancia-prolongadas/notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  private handleError(error: any): never {
    if (error instanceof HttpException) throw error;
    throw new BadRequestException(error.message);
  }

  @Get('usuarios/:documento/resumen')
  public async obtenerResumen(@Param('documento') documento: string) {
    try {
      return await this.notificacionesService.obtenerResumen(documento);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Get('usuarios/:documento')
  public async listarPorDocumento(@Param('documento') documento: string) {
    try {
      return await this.notificacionesService.listarPorDocumento(documento);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Patch('usuarios/:documento/:notificacionId/visto')
  public async marcarVista(
    @Param('documento') documento: string,
    @Param('notificacionId', ParseIntPipe) notificacionId: number
  ) {
    try {
      return await this.notificacionesService.marcarVista(documento, notificacionId);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Patch('usuarios/:documento/visto')
  public async marcarTodasVistas(@Param('documento') documento: string) {
    try {
      return await this.notificacionesService.marcarTodasVistas(documento);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}
