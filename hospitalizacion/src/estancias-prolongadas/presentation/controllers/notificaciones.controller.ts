import {
  ListarNotificacionesImpl,
  MarcarNotificacionVistaImpl,
  ObtenerNotificacionesImpl,
} from '@hpn/estancias-prolongadas/infraestructure/services/notificaciones';
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

@ApiTags('v1 - Estancias Prolongadas - Notificaciones')
@Controller('v1/estancias-prolongadas/notificaciones')
export class NotificacionesController {
  constructor(
    private readonly _obtnerNotificacionesImpl: ObtenerNotificacionesImpl,
    private readonly _marcarNotificacionVistaImpl: MarcarNotificacionVistaImpl,
    private readonly _listarNotificacionesImpl: ListarNotificacionesImpl
  ) {}

  private handleError(error: any): never {
    if (error instanceof HttpException) throw error;
    throw new BadRequestException(error.message);
  }

  @Get('usuarios/:documento/resumen')
  public async obtenerResumen(@Param('documento') documento: string) {
    try {
      return await this._obtnerNotificacionesImpl.obtenerResumen(documento);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Get('usuarios/:documento')
  public async listarPorDocumento(@Param('documento') documento: string) {
    try {
      return await this._listarNotificacionesImpl.listarPorDocumento(documento);
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
      return await this._marcarNotificacionVistaImpl.marcarVista(documento, notificacionId);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  @Patch('usuarios/:documento/visto')
  public async marcarTodasVistas(@Param('documento') documento: string) {
    try {
      return await this._marcarNotificacionVistaImpl.marcarTodasVistas(documento);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}
