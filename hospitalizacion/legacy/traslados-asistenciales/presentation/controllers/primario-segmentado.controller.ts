import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Put,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { HPN_AUTHORITIES } from '@authorities';
import {
  PrimarioSegmentadoImpl,
  RegistrosClinicosImpl,
  VehiculosInvolucradosImpl,
} from '@hpn/lgc/tas/infrastructure/repositories';
import {
  CreatePrimarioSegmentadoDto,
  FinalizarPrimarioSegmentadoDto,
  UpdatePrimarioAccidenteDto,
  UpdatePrimarioCondicionDto,
  UpdatePrimarioDiagnosticoDto,
  UpdatePrimarioEntregaDto,
  UpdatePrimarioEvidenciasDto,
  UpdatePrimarioPacienteDto,
  UpdatePrimarioTripulacionDto,
  UpdatePrimarioUbicacionDto,
  MedicamentoSegmentadoDto,
  NotaSegmentadaDto,
  ProcedimientoSegmentadoDto,
  SignosVitalesSegmentadoDto,
  VehiculoInvolucradoDto,
} from '../dtos';
import { LGC_TAS_LOCATIONS } from '../../application/constants';
import { TrasladosRealtimeGateway } from '../gateways/traslados-realtime.gateway';
import { ESTADOS_ASISTENCIA } from '../../@types/gcn';
import {
  deletePrimarioSegmentadoFile,
  deletePrimarioSegmentadoFiles,
  primarioSegmentadoFileName,
} from '../../application/helpers/primario-segmentado-files.helper';

@ApiTags('Traslados Asistenciales - Primario segmentado')
@ApiBearerAuth()
@CommonGuards()
@Authorities([HPN_AUTHORITIES.GESTION_CLINICA.SEGUIMIENTO_TRASLADO])
@Controller('v1/hpn/traslados-asistenciales/pri-seg')
export class PrimarioSegmentadoController {
  constructor(
    private readonly source: PrimarioSegmentadoImpl,
    private readonly registrosClinicos: RegistrosClinicosImpl,
    private readonly vehiculosInvolucrados: VehiculosInvolucradosImpl,
    private readonly events: TrasladosRealtimeGateway
  ) {}

  private async parseMultipart<T extends object>(type: new () => T, data: string): Promise<T> {
    if (!data) throw new Error('El campo data es obligatorio');
    const payload = plainToInstance(type, JSON.parse(data));
    const errors = await validate(payload);
    if (errors.length) {
      throw new Error(
        errors.map(error => Object.values(error.constraints ?? {}).join(', ')).join('; ')
      );
    }
    return payload;
  }

  @ApiOperation({ summary: 'Crear el encabezado de un traslado primario segmentado' })
  @Post()
  public async create(@Body() body: CreatePrimarioSegmentadoDto) {
    try {
      const result = await this.source.create(body);
      this.events.publish({
        tipo: ESTADOS_ASISTENCIA.CREADO.getCode(),
        trasladoId: result.trasladoId,
        contextoCode: this.source.getRealtimeContextCode(),
      });
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Consultar el rol de tripulacion del usuario autenticado' })
  @Get('usuario-autenticado')
  public async fetchTripulanteAutenticado() {
    try {
      return await this.source.fetchTripulanteAutenticado();
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({ summary: 'Consultar un primario segmentado creado por el usuario actual' })
  @Get(':trasladoId')
  public findById(@Param('trasladoId') trasladoId: number) {
    return this.source.findById(+trasladoId);
  }

  @Put(':trasladoId/paciente')
  public updatePaciente(
    @Param('trasladoId') trasladoId: number,
    @Body() body: UpdatePrimarioPacienteDto
  ) {
    return this.source.updatePaciente(+trasladoId, body);
  }

  @Put(':trasladoId/ubicacion')
  public updateUbicacion(
    @Param('trasladoId') trasladoId: number,
    @Body() body: UpdatePrimarioUbicacionDto
  ) {
    return this.source.updateUbicacion(+trasladoId, body);
  }

  @UseInterceptors(
    FileInterceptor('body', {
      storage: diskStorage({
        destination: `../${LGC_TAS_LOCATIONS.triage}`,
        filename: primarioSegmentadoFileName('MAPA'),
      }),
    })
  )
  @Put(':trasladoId/diagnostico')
  public async updateDiagnostico(
    @Param('trasladoId') trasladoId: number,
    @Body() body: { data: string },
    @UploadedFile() file?: Express.Multer.File
  ) {
    let result: Awaited<ReturnType<PrimarioSegmentadoImpl['updateDiagnostico']>>;
    try {
      const payload = await this.parseMultipart(UpdatePrimarioDiagnosticoDto, body.data);
      if (file && payload.bodyMapImageName && file.originalname !== payload.bodyMapImageName) {
        throw new Error('El archivo body no corresponde a bodyMapImageName');
      }
      result = await this.source.updateDiagnostico(+trasladoId, payload, file?.filename);
    } catch (error: any) {
      if (file) await deletePrimarioSegmentadoFile('triage', file.filename);
      throw new BadRequestException(error.message);
    }
    await deletePrimarioSegmentadoFile('triage', result.archivoAnterior);
    const { archivoAnterior: _archivoAnterior, ...response } = result;
    return response;
  }

  @Post(':trasladoId/signos-vitales')
  public createSignosVitales(
    @Param('trasladoId') trasladoId: number,
    @Body() body: SignosVitalesSegmentadoDto
  ) {
    return this.registrosClinicos.createSignosVitalesRegistro(+trasladoId, body);
  }

  @Put(':trasladoId/signos-vitales/:registroId')
  public updateSignosVitales(
    @Param('trasladoId') trasladoId: number,
    @Param('registroId') registroId: number,
    @Body() body: SignosVitalesSegmentadoDto
  ) {
    return this.registrosClinicos.updateSignosVitales(+trasladoId, +registroId, body);
  }

  @Delete(':trasladoId/signos-vitales/:registroId')
  public deleteSignosVitales(
    @Param('trasladoId') trasladoId: number,
    @Param('registroId') registroId: number
  ) {
    return this.registrosClinicos.deleteSignosVitales(+trasladoId, +registroId);
  }

  @Post(':trasladoId/notas')
  public createNota(@Param('trasladoId') trasladoId: number, @Body() body: NotaSegmentadaDto) {
    return this.registrosClinicos.createNota(+trasladoId, body);
  }

  @Put(':trasladoId/notas/:registroId')
  public updateNota(
    @Param('trasladoId') trasladoId: number,
    @Param('registroId') registroId: number,
    @Body() body: NotaSegmentadaDto
  ) {
    return this.registrosClinicos.updateNota(+trasladoId, +registroId, body);
  }

  @Delete(':trasladoId/notas/:registroId')
  public deleteNota(
    @Param('trasladoId') trasladoId: number,
    @Param('registroId') registroId: number
  ) {
    return this.registrosClinicos.deleteNota(+trasladoId, +registroId);
  }

  @Post(':trasladoId/procedimientos')
  public createProcedimiento(
    @Param('trasladoId') trasladoId: number,
    @Body() body: ProcedimientoSegmentadoDto
  ) {
    return this.registrosClinicos.createProcedimiento(+trasladoId, body);
  }

  @Put(':trasladoId/procedimientos/:registroId')
  public updateProcedimiento(
    @Param('trasladoId') trasladoId: number,
    @Param('registroId') registroId: number,
    @Body() body: ProcedimientoSegmentadoDto
  ) {
    return this.registrosClinicos.updateProcedimiento(+trasladoId, +registroId, body);
  }

  @Delete(':trasladoId/procedimientos/:registroId')
  public deleteProcedimiento(
    @Param('trasladoId') trasladoId: number,
    @Param('registroId') registroId: number
  ) {
    return this.registrosClinicos.deleteProcedimiento(+trasladoId, +registroId);
  }

  @Post(':trasladoId/medicamentos')
  public createMedicamento(
    @Param('trasladoId') trasladoId: number,
    @Body() body: MedicamentoSegmentadoDto
  ) {
    return this.registrosClinicos.createMedicamento(+trasladoId, body);
  }

  @Put(':trasladoId/medicamentos/:registroId')
  public updateMedicamento(
    @Param('trasladoId') trasladoId: number,
    @Param('registroId') registroId: number,
    @Body() body: MedicamentoSegmentadoDto
  ) {
    return this.registrosClinicos.updateMedicamento(+trasladoId, +registroId, body);
  }

  @Delete(':trasladoId/medicamentos/:registroId')
  public deleteMedicamento(
    @Param('trasladoId') trasladoId: number,
    @Param('registroId') registroId: number
  ) {
    return this.registrosClinicos.deleteMedicamento(+trasladoId, +registroId);
  }

  @Put(':trasladoId/condicion-clinica')
  public updateCondicion(
    @Param('trasladoId') trasladoId: number,
    @Body() body: UpdatePrimarioCondicionDto
  ) {
    return this.source.updateCondicion(+trasladoId, body);
  }

  @Put(':trasladoId/tripulacion')
  public updateTripulacion(
    @Param('trasladoId') trasladoId: number,
    @Body() body: UpdatePrimarioTripulacionDto
  ) {
    return this.source.updateTripulacion(+trasladoId, body);
  }

  @Put(':trasladoId/accidente')
  public updateAccidente(
    @Param('trasladoId') trasladoId: number,
    @Body() body: UpdatePrimarioAccidenteDto
  ) {
    return this.source.updateAccidente(+trasladoId, body);
  }

  @Post(':trasladoId/vehiculos')
  public createVehiculo(
    @Param('trasladoId') trasladoId: number,
    @Body() body: VehiculoInvolucradoDto
  ) {
    return this.vehiculosInvolucrados.create(+trasladoId, body);
  }

  @Put(':trasladoId/vehiculos/:vehiculoId')
  public updateVehiculo(
    @Param('trasladoId') trasladoId: number,
    @Param('vehiculoId') vehiculoId: number,
    @Body() body: VehiculoInvolucradoDto
  ) {
    return this.vehiculosInvolucrados.update(+trasladoId, +vehiculoId, body);
  }

  @Delete(':trasladoId/vehiculos/:vehiculoId')
  public deleteVehiculo(
    @Param('trasladoId') trasladoId: number,
    @Param('vehiculoId') vehiculoId: number
  ) {
    return this.vehiculosInvolucrados.delete(+trasladoId, +vehiculoId);
  }

  @Put(':trasladoId/entrega')
  public updateEntrega(
    @Param('trasladoId') trasladoId: number,
    @Body() body: UpdatePrimarioEntregaDto
  ) {
    return this.source.updateEntrega(+trasladoId, body);
  }

  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: `../${LGC_TAS_LOCATIONS.archivos}`,
        filename: primarioSegmentadoFileName('EVIDENCIA'),
      }),
    })
  )
  @Put(':trasladoId/evidencias')
  public async updateEvidencias(
    @Param('trasladoId') trasladoId: number,
    @Body() body: { data: string },
    @UploadedFiles() files: Express.Multer.File[] = []
  ) {
    let result: Awaited<ReturnType<PrimarioSegmentadoImpl['updateEvidencias']>>;
    try {
      const payload = await this.parseMultipart(UpdatePrimarioEvidenciasDto, body.data);
      result = await this.source.updateEvidencias(+trasladoId, payload, files);
    } catch (error: any) {
      await deletePrimarioSegmentadoFiles(
        'archivos',
        files.map(file => file.filename)
      );
      throw new BadRequestException(error.message);
    }
    await deletePrimarioSegmentadoFiles('archivos', result.archivosEliminados);
    const { archivosEliminados: _archivosEliminados, ...response } = result;
    return response;
  }

  @UseInterceptors(
    FileInterceptor('firma', {
      storage: diskStorage({
        destination: `../${LGC_TAS_LOCATIONS.firma}`,
        filename: primarioSegmentadoFileName('FIRMA'),
      }),
    })
  )
  @Post(':trasladoId/finalizar')
  public async finalizar(
    @Param('trasladoId') trasladoId: number,
    @Body() body: { data: string },
    @UploadedFile() file?: Express.Multer.File
  ) {
    try {
      const payload = await this.parseMultipart(FinalizarPrimarioSegmentadoDto, body.data);
      if (
        file &&
        payload.recibidoPorFirmaImg &&
        file.originalname !== payload.recibidoPorFirmaImg
      ) {
        throw new Error('El archivo firma no corresponde a recibidoPorFirmaImg');
      }
      const result = await this.source.finalizar(+trasladoId, payload, file?.filename);
      this.events.publish({
        tipo: ESTADOS_ASISTENCIA.FINALIZADO.getCode(),
        trasladoId: +trasladoId,
        contextoCode: this.source.getRealtimeContextCode(),
      });
      return result;
    } catch (error: any) {
      if (file) await deletePrimarioSegmentadoFile('firma', file.filename);
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
