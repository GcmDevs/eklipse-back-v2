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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { TrasladoCrudSource } from '@hpn/lgc/tas/infrastructure/repositories';
import {
  CreateTrasladoPrimarioDto,
  CreateTrasladoSecundarioDto,
  IniciarTrasladoDto,
} from '../dtos';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { nonEditFileName } from '@common/presentation/helpers';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DescargarPdfService } from '../../infrastructure/services';
import { GcmContextCode } from '@common/domain/types';
import { TrasladosRealtimeGateway } from '../gateways/traslados-realtime.gateway';
import { HPN_AUTHORITIES } from '@authorities';
import { LGC_TAS_LOCATIONS } from '../../application/constants';

@ApiTags('Traslados Asistenciales')
@ApiBearerAuth()
@CommonGuards()
@Controller('v4/gestion-clinica/traslados-asistenciales')
export class TrasladoController {
  constructor(
    private readonly _source: TrasladoCrudSource,
    private readonly _pdfService: DescargarPdfService,
    private readonly _events: TrasladosRealtimeGateway
  ) {}

  @ApiOperation({ summary: 'Obtener mis solicitudes de traslado por rango de fechas' })
  @Get('')
  public misSolicitudes(
    @Query('onlyMisSolicitudes') onlyMisSolicitudes: boolean,
    @Query('inicio') inicio: Date,
    @Query('final') final: Date,
    @Query('contextoCode') contextoCode?: GcmContextCode
  ) {
    try {
      if ([null, undefined].indexOf(onlyMisSolicitudes) >= 0) {
        throw new Error('falta el campo onlyMisSolicitudes');
      }
      if (inicio && final) {
        inicio = new Date(`${inicio}:00:00:00`);
        final = new Date(`${final}:23:59:59`);
      }

      return this._source.fetchSolicitudesByRangoFechas(
        inicio,
        final,
        onlyMisSolicitudes,
        contextoCode
      );
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('count-by-centro')
  public fetchSolicitudesCountByCentro(@Query('inicio') inicio: Date, @Query('final') final: Date) {
    try {
      if (inicio && final) {
        inicio = new Date(`${inicio}:00:00:00`);
        final = new Date(`${final}:23:59:59`);
      }
      return this._source.fetchSolicitudesCountByCentro(inicio, final);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'body', maxCount: 1 },
        { name: 'firma', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, callback) => {
            if (file.fieldname === 'body') {
              callback(null, `../${LGC_TAS_LOCATIONS.triage}`);
            } else {
              callback(null, `../${LGC_TAS_LOCATIONS.firma}`);
            }
          },
          filename: nonEditFileName,
        }),
      }
    )
  )
  @ApiOperation({ summary: 'Crear un nuevo traslado primario' })
  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.SEGUIMIENTO_TRASLADO])
  @Post('create-primario')
  public async createPrimario(
    @Body() body: { data: string },
    @UploadedFiles()
    files: {
      body?: Express.Multer.File[];
      firma?: Express.Multer.File[];
    }
  ) {
    try {
      const plainPayload = JSON.parse(body.data);
      const payload = plainToInstance(CreateTrasladoPrimarioDto, plainPayload);
      const errors = await validate(payload);

      if (errors.length > 0) {
        const errorMessages = errors
          .map(err => Object.values(err.constraints || {}).join(', '))
          .join('; ');
        throw new Error(errorMessages);
      }

      const mapFile = files?.body?.[0];

      const signatureFile = files?.firma?.[0];

      if (!mapFile) {
        throw new Error('El mapa corporal es obligatorio');
      }

      if (!signatureFile) {
        throw new Error('La firma del receptor es obligatoria');
      }

      if (mapFile.originalname !== payload.bodyMapImageName) {
        throw new Error('El archivo body no corresponde a bodyMapImageName');
      }

      if (signatureFile.originalname !== payload.recibidoPorFirmaImg) {
        throw new Error('El archivo firma no corresponde a recibidoPorFirmaImg');
      }

      const result = await this._source.createPrimario(payload);
      if (result.result) {
        this._events.publish({
          tipo: 'CREACION',
          trasladoId: result.trasladoId,
          contextoCode: this._source.getRealtimeContextCode(),
        });
      }
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Crear un nuevo traslado secundario' })
  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.AGREGAR_TRASLADO])
  @Post('create')
  public async create(@Body() body: CreateTrasladoSecundarioDto) {
    try {
      const result = await this._source.createSecundario(body);
      if (result.result) {
        this._events.publish({
          tipo: 'CREACION',
          trasladoId: result.trasladoId,
          contextoCode: this._source.getRealtimeContextCode(),
        });
      }
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  /*   @ApiOperation({ summary: 'Actualizar un traslado secundario' })
  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.AGREGAR_TRASLADO])
  @Post('update-secundario')
  public updateSecundario(@Body() body: UpdateTrasladoSecundarioDto) {
    try {
      return this._source.updateSecundario(body);
    } catch (error:any) {
      throw new BadRequestException(error.message);
    }
  } */

  @ApiOperation({ summary: 'Obtener la asignación actual de un traslado' })
  @Get(':trasladoId/asignacion-actual')
  public fetchAsignacionActual(
    @Param('trasladoId') trasladoId: number,
    @Query('contextoCode') contextoCode?: GcmContextCode
  ) {
    try {
      return this._source.fetchAsignacionActualByTrasladoId(+trasladoId, contextoCode);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Obtener un traslado por su ID' })
  @Get(':trasladoId')
  public fetchTrasladoById(
    @Param('trasladoId') trasladoId: number,
    @Query('contextoCode') contextoCode?: GcmContextCode
  ) {
    try {
      return this._source.fetchTrasladoById(+trasladoId, contextoCode);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Actualizar la información de un traslado' })
  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.SEGUIMIENTO_TRASLADO])
  @Put('update')
  public async update(@Body() body: IniciarTrasladoDto) {
    try {
      const result = await this._source.inicioSecundario(body);
      if (result)
        this._events.publish({
          tipo: 'INICIO',
          trasladoId: body.trasladoId,
          contextoCode: body.contextoCode,
        });
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({
    summary: 'Descargar el paquete de PDFs asociados a un traslado en formato Base64',
  })
  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.GESTION_TRASLADO])
  @Get(':trasladoId/descargar-pdfs')
  public async descargarPdfs(
    @Param('trasladoId') trasladoId: number,
    @Query('contextoCode') contextoCode?: GcmContextCode
  ) {
    try {
      const traslado = await this._source.fetchTrasladoById(+trasladoId, contextoCode);
      return await this._pdfService.generarPaquetePdfs(traslado, contextoCode);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
