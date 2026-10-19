import {
  Get,
  Controller,
  BadRequestException,
  Post,
  Body,
  Query,
  Param,
  UseInterceptors,
  Put,
} from '@nestjs/common';
import { diskStorage } from 'multer';
import {
  CreateSolicitudServicioTecnicoSource,
  FetchHistoricoSolicitudServicioTecnicoSource,
  FetchSolicitudServicioTecnicoSource,
  SolicitudServicioTecnicoSource,
  UpdateSolicitudServicioTecnicoSource,
} from '@activos-fijos/infrastructure/repositories';
import { INN_AUTHORITIES } from '@authorities/inventario';
import { nonEditFileName } from '@common/presentation/helpers';
import { FILE_LOCATIONS } from '@common/application/file-locations';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateSoliSerTecPayload } from '@activos-fijos/application/payloads';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { AfnClaseSerTecCode, AfnTipoSolSerTecCode } from '@ctypes/inn/activos-fijos';

@CommonGuards()
@Controller('v4/afn/servicio-tecnico')
export class ServicioTecnicoController {
  constructor(
    private _solicitudes: SolicitudServicioTecnicoSource,
    private _createSolicitudes: CreateSolicitudServicioTecnicoSource,
    private _updateSolicitudes: UpdateSolicitudServicioTecnicoSource,
    private _fetchSolicitudes: FetchSolicitudServicioTecnicoSource,
    private _fetchHistorico: FetchHistoricoSolicitudServicioTecnicoSource
  ) {}

  @Authorities([
    INN_AUTHORITIES.SERVICIO_TECNICO.AGREGAR_SOLICITUDES,
    INN_AUTHORITIES.SERVICIO_TECNICO.ATENDER_SOLICITUDES,
  ])
  @Get()
  async fetchSolicitudes(
    @Query('onlyMisSolicitudes') onlyMisSolicitudes: boolean,
    @Query('inicio') inicio: Date,
    @Query('final') final: Date
  ) {
    try {
      if ([null, undefined].indexOf(onlyMisSolicitudes) >= 0) {
        throw new Error('falta el campo onlyMisSolicitudes');
      }
      if (inicio && final) {
        inicio = new Date(`${inicio}:00:00:00`);
        final = new Date(`${final}:23:59:59`);
      }
      return await this._fetchSolicitudes.execute(onlyMisSolicitudes, inicio, final);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.SERVICIO_TECNICO.AGREGAR_SOLICITUDES])
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files' }], {
      storage: diskStorage({
        destination: `../${FILE_LOCATIONS.inn.afn.svt.comprobantesFallo}`,
        filename: nonEditFileName,
      }),
    })
  )
  @Post()
  async createSolicitud(@Body() body: { data: string }) {
    try {
      const payload: CreateSoliSerTecPayload = JSON.parse(body.data);

      return await this._createSolicitudes.execute(payload);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Authorities([INN_AUTHORITIES.SERVICIO_TECNICO.AGREGAR_SOLICITUDES])
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files' }], {
      storage: diskStorage({
        destination: `../${FILE_LOCATIONS.inn.afn.svt.comprobantesFallo}`,
        filename: nonEditFileName,
      }),
    })
  )
  @Put('update/:solicitudId')
  async update(@Param('solicitudId') solicitudId: number, @Body() body: { data: string }) {
    try {
      const payload: CreateSoliSerTecPayload = JSON.parse(body.data);

      return await this._updateSolicitudes.execute(+solicitudId, payload);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.SERVICIO_TECNICO.ATENDER_SOLICITUDES])
  @Get('update-estado-errado/:itemId')
  async updateEstadoErrado(@Param('itemId') itemId: number, @Query('nota') nota: string) {
    try {
      console.log(itemId, nota);

      return await this._solicitudes.updateEstadoErrado(+itemId, nota);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.SERVICIO_TECNICO.ATENDER_SOLICITUDES])
  @Get('update-estado/:itemId')
  async updateEstado(
    @Param('itemId') itemId: number,
    @Query('nota') nota: string,
    @Query('tipoServicioTecnicoCode') tipoServicioTecnicoCode: AfnTipoSolSerTecCode,
    @Query('claseSerTecCode') claseSerTecCode: AfnClaseSerTecCode
  ) {
    try {
      return await this._solicitudes.updateEstado(
        +itemId,
        nota,
        tipoServicioTecnicoCode,
        claseSerTecCode
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.SERVICIO_TECNICO.ATENDER_SOLICITUDES])
  @Get('fetch-usuarios-to-asignar')
  async fetchUsuariosToAsignarSolicitudes(@Query('canReasignarCaso') canReasignarCaso: boolean) {
    try {
      return await this._solicitudes.fetchUsuariosToAsignar(canReasignarCaso);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.SERVICIO_TECNICO.ATENDER_SOLICITUDES])
  @Get('asignar')
  async asignarCaso(
    @Query('itemSolicitudId') itemSolicitudId: number,
    @Query('usuarioId') usuarioId: string,
    @Query('claseServicioTecnicoCode') claseServicioTecnicoCode: AfnClaseSerTecCode,
    @Query('nota') nota: string,
    @Query('tiempo') tiempo: number,
    @Query('tipoFormato') tipoFormato: number,
    @Query('fechaAtencionProgramada') fechaAtencionProgramada: Date,
    @Query('isTipoTarea') isTipoTarea: boolean
  ) {
    try {
      return await this._solicitudes.asignarCaso(
        +itemSolicitudId,
        usuarioId,
        claseServicioTecnicoCode,
        nota,
        tiempo,
        tipoFormato,
        fechaAtencionProgramada,
        isTipoTarea
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([
    INN_AUTHORITIES.SERVICIO_TECNICO.ATENDER_SOLICITUDES,
    INN_AUTHORITIES.SERVICIO_TECNICO.AGREGAR_SOLICITUDES,
  ])
  @Get('fetch-historico/:solicitudId')
  async fetchHistorico(@Param('solicitudId') solicitudId: number) {
    try {
      return await this._fetchHistorico.execute(+solicitudId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
