import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { INN_AUTHORITIES } from '@authorities/inventario';
import { SolicitudOrm } from '@orm/inn/central-compras';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { GcmContexts } from '@common/application/constants';
import { FILE_LOCATIONS } from '@common/application/file-locations';
import { SolicitudCrudSource } from '@inn/central-compras/infrastructure/repos';
import { OldCambiarEstadoSolicitudColaboradorDto, OldManageSolicitudDto } from '../dtos';
import { nonEditFileName } from '@common/presentation/helpers';
import {
  FetchSolicitudesImpl,
  UpdateSolicitudesImpl,
} from '@inn/central-compras/infrastructure/servis/solicitudes';
import { GcmContextCode, gcmContextFactory } from '@common/domain/types';
import { ApiTags } from '@nestjs/swagger';

@CommonGuards()
@ApiTags('V4')
@Controller('v4/central-compras/solicitudes')
export class SolicitudCrudController {
  constructor(
    private _solicitudCrud: SolicitudCrudSource,
    private _fetch: FetchSolicitudesImpl,
    private _update: UpdateSolicitudesImpl
  ) {}

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.CODE])
  @Get('permisos')
  public async fetchPermisos() {
    try {
      const response = await this._fetch.findPermisos();
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.CODE])
  @Get('fetch-one/:id/:contextCode')
  public async fetchOne(
    @Param('id') id: number,
    @Param('contextCode') contextCode: GcmContextCode
  ) {
    try {
      const response = await this._fetch.fetchOne(id, gcmContextFactory(contextCode));
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.CODE])
  @Get()
  public async fetch(
    @Query('inicio') inicio: Date,
    @Query('fin') fin: Date,
    @Query('onlyMedicamentos') onlyMedicamentos: boolean
  ) {
    try {
      const response = await this._fetch.find(inicio, fin, onlyMedicamentos);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.CODE])
  @Get(':context/:id')
  public async findOne(@Param('context') context: GcmContextCode, @Param('id') id: number) {
    try {
      const response = await this._fetch.findOne(gcmContextFactory(context), +id);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.AGREGAR])
  @Post()
  public async create(@Body() payload: OldManageSolicitudDto): Promise<SolicitudOrm> {
    try {
      const response = await this._solicitudCrud.create(payload);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.AGREGAR])
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files' }], {
      storage: diskStorage({
        destination: `../${FILE_LOCATIONS.inn.ctc.itemsSolicitud}`,
        filename: nonEditFileName,
      }),
    })
  )
  @Put()
  public async update(
    @UploadedFiles() _files: Express.Multer.File[],
    @Body() body: { data: string }
  ): Promise<SolicitudOrm> {
    try {
      const payload: OldManageSolicitudDto = JSON.parse(body.data);
      return this._update.execute(payload);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.ELIMINAR])
  @Put('cancelar-solicitud')
  public async delete(@Body() payload: OldCambiarEstadoSolicitudColaboradorDto): Promise<boolean> {
    try {
      const response = await this._solicitudCrud.delete(
        payload.context,
        payload.solicitudId,
        payload.observaciones
      );
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.MOVER_A_OTRO_CENTRO])
  @Put('cambiar-centro')
  public async moverAAMMedical(
    @Body() payload: { originalContext: GcmContexts; solicitudId: number }
  ): Promise<boolean> {
    try {
      const response = await this._solicitudCrud.moverAAMMedical(payload);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.CODE])
  @Put('registrar-soli-colaborador')
  public async cambiarEstadoSolicitudColaborador(
    @Body() payload: OldCambiarEstadoSolicitudColaboradorDto
  ): Promise<boolean> {
    try {
      const response = await this._solicitudCrud.cambiarEstadoSolicitudColaborador(payload);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
