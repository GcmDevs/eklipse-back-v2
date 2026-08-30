import { CreateNotaSerTecPayload } from '@inn/lgc/afn/application/payloads';
import { NotaServicioTecnicoSource } from '@inn/lgc/afn/infrastructure/repositories';
import { INN_AUTHORITIES } from '@inn/authorities';
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
import { AFN_FILE_LOCATIONS } from '../../application/constants';

@CommonGuards()
@Controller('v1/afn/ser-tec')
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
    } catch (error: any) {
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
        destination: `../${AFN_FILE_LOCATIONS.svt.comprobantesSoluc}`,
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
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.SERVICIO_TECNICO.AGREGAR_SOLICITUDES])
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files' }], {
      storage: diskStorage({
        destination: `../${AFN_FILE_LOCATIONS.svt.comprobantesSoluc}`,
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
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('marcar-como-vistos/:itemSolicitudId')
  async marcarComoVistos(@Param('itemSolicitudId') itemSolicitudId: number) {
    try {
      return await this._notas.marcarComoVistos(itemSolicitudId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
