import { CreateNotaSerTecPayload } from '@activos-fijos/application/payloads';
import { NotaServicioTecnicoSource } from '@activos-fijos/infrastructure/repositories';
import { INN_AUTHORITIES } from '@authorities/inventario';
import { FILE_LOCATIONS } from '@common/application/file-locations';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { nonEditFileName } from '@common/presentation/helpers';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@CommonGuards()
@Controller('v4/afn/servicio-tecnico')
export class NotaServicioTecnicoController {
  constructor(private _notas: NotaServicioTecnicoSource) {}

  @Authorities([
    INN_AUTHORITIES.SERVICIO_TECNICO.AGREGAR_SOLICITUDES,
    INN_AUTHORITIES.SERVICIO_TECNICO.ATENDER_SOLICITUDES,
  ])
  @Get('notas')
  async fetchNotas(
    @Query('solicitudId') solicitudId: number,
    @Query('itemSolicitudId') itemSolicitudId: number
  ) {
    try {
      return await this._notas.fetch(solicitudId, itemSolicitudId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([
    INN_AUTHORITIES.SERVICIO_TECNICO.AGREGAR_SOLICITUDES,
    INN_AUTHORITIES.SERVICIO_TECNICO.ATENDER_SOLICITUDES,
  ])
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files' }], {
      storage: diskStorage({
        destination: `../${FILE_LOCATIONS.inn.afn.svt.comprobantesSoluc}`,
        filename: nonEditFileName,
      }),
    })
  )
  @Post('notas')
  async createNota(@Body() body: { data: string }) {
    try {
      const payload: CreateNotaSerTecPayload = JSON.parse(body.data);
      payload.isEstadoAtencion = false;
      return await this._notas.create(payload);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.SERVICIO_TECNICO.AGREGAR_SOLICITUDES])
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files' }], {
      storage: diskStorage({
        destination: `../${FILE_LOCATIONS.inn.afn.svt.comprobantesSoluc}`,
        filename: nonEditFileName,
      }),
    })
  )
  @Post('apro-rech-entrega')
  async rechazarEntrega(@Body() body: { data: string }) {
    try {
      const payload: CreateNotaSerTecPayload = JSON.parse(body.data);
      if (!payload.isAprobado && !payload.nota) {
        throw new Error('Debe especificar porque rechaza la entrega del servicio');
      }
      payload.isEstadoAtencion = true;
      return await this._notas.create(payload);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('marcar-como-vistos/:itemSolicitudId')
  async marcarComoVistos(@Param('itemSolicitudId') itemSolicitudId: number) {
    try {
      return await this._notas.marcarComoVistos(itemSolicitudId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
