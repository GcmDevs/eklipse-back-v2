import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CargarFacturaControlGastoImpl } from '@inn/lgc/cgt/infrastructure/services/cargar-factura.impl';
import { ConciliarControlGastoImpl } from '@inn/lgc/cgt/infrastructure/services/conciliar.impl';
import { CreateControlGastoImpl } from '@inn/lgc/cgt/infrastructure/services/create.impl';
import { FetchControlGastoImpl } from '@inn/lgc/cgt/infrastructure/services/fetch.impl';
import { FindByIdControlGastoImpl } from '@inn/lgc/cgt/infrastructure/services/find-by-id.impl';
import { UpdateControlGastoImpl } from '@inn/lgc/cgt/infrastructure/services/update-control-gasto.impl';
import {
  AsociarOrdenControlGastosPayload,
  CargarFacturaControlGastosPayload,
  CreateControlGastosPayload,
  DocumentoVistoControlGastosPayload,
  GenerateReporteControlGastosPayload,
  RechazarDocumentoControlGastosPayload,
  UpdateControlGastoPayload,
} from '@inn/lgc/cgt/application/payloads/control-gastos.payloads';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FILE_LOCATIONS } from '@common/application/file-locations';
import { nonEditFileName } from '@common/presentation/helpers';
import { RechazarDocumentoControlGastoImpl } from '@inn/lgc/cgt/infrastructure/services/rechazar.impl';
import { HistorialGastoImpl } from '@inn/lgc/cgt/infrastructure/services/historial.impl';
import { GcmContextCode, GcmContextType } from '@common/domain/types';
import { DocumentoVistoControlGastoImpl } from '@inn/lgc/cgt/infrastructure/services/documento-visto.impl';
import { SolicitudMaosImpl } from '@inn/lgc/cgt/infrastructure/services/solicitud-maos.impl';
import { INN_AUTHORITIES } from '../../../../authorities';

@CommonGuards()
@Controller('v1/cgt')
export class ControlGastosController {
  constructor(
    private _cargarFactura: CargarFacturaControlGastoImpl,
    private _conciliar: ConciliarControlGastoImpl,
    private _create: CreateControlGastoImpl,
    private _fetch: FetchControlGastoImpl,
    private _rechazar: RechazarDocumentoControlGastoImpl,
    private _historial: HistorialGastoImpl,
    private _documentoVisto: DocumentoVistoControlGastoImpl,
    private _solicitudMaos: SolicitudMaosImpl,
    private _findById: FindByIdControlGastoImpl,
    private _update: UpdateControlGastoImpl
  ) {}

  @Patch('orden-relacionada')
  @Authorities([INN_AUTHORITIES.FARMACIA.CONTROL_GASTOS_FACTURADOR])
  async asociarOrden(@Body() body: AsociarOrdenControlGastosPayload) {
    try {
      return await this._cargarFactura.asociarOrden(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('orden-relacionada')
  @Authorities([INN_AUTHORITIES.FARMACIA.CONTROL_GASTOS_FACTURADOR])
  async previewOrden(
    @Query('contextCode') contextCode: string,
    @Query('tipoCode') tipoCode: string,
    @Query('consecutivo') consecutivo: string
  ) {
    try {
      if (tipoCode !== '0' && tipoCode !== '19') throw new Error('Seleccione compra o servicio');
      return await this._cargarFactura.previewOrden(contextCode, Number(tipoCode), consecutivo);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([
    INN_AUTHORITIES.FARMACIA.CONTROL_GASTOS_SOLICITANTE,
    INN_AUTHORITIES.FARMACIA.CONTROL_GASTOS_FACTURADOR,
  ])
  @Get()
  async fetch(@Query('fechaInicio') fechaInicio: Date, @Query('fechaFin') fechaFin: Date) {
    try {
      fechaInicio = new Date(`${fechaInicio}:00:00:00`);
      fechaFin = new Date(`${fechaFin}:23:59:59`);
      return await this._fetch.execute(fechaInicio, fechaFin);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.CONTROL_GASTOS_SOLICITANTE])
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files' }], {
      storage: diskStorage({
        destination: `../${FILE_LOCATIONS.inn.fmc.controlGastos.documentoAdjunto}`,
        filename: nonEditFileName,
      }),
    })
  )
  @Patch('update')
  async updateControlGasto(@Body() body: { data: string }) {
    try {
      const payload: UpdateControlGastoPayload = JSON.parse(body.data);
      return await this._update.execute(payload);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @Authorities([INN_AUTHORITIES.FARMACIA.CONTROL_GASTOS_SOLICITANTE])
  @Get('ingreso/:id')
  async findById(@Param('id') id: number, @Query('contextCode') ctx: GcmContextCode) {
    try {
      return await this._findById.execute(id, ctx);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @Authorities([INN_AUTHORITIES.FARMACIA.CONTROL_GASTOS_SOLICITANTE])
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files' }], {
      storage: diskStorage({
        destination: `../${FILE_LOCATIONS.inn.fmc.controlGastos.documentoAdjunto}`,
        filename: nonEditFileName,
      }),
    })
  )
  @Post()
  async create(@Body() body: { data: string }) {
    try {
      const payload: CreateControlGastosPayload = JSON.parse(body.data);
      return await this._create.execute(payload);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.CONTROL_GASTOS_FACTURADOR])
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files' }], {
      storage: diskStorage({
        destination: `../${FILE_LOCATIONS.inn.fmc.controlGastos.facturas}`,
        filename: nonEditFileName,
      }),
    })
  )
  @Post('cargar-factura')
  async cargarFactura(@Body() body: { data: string }) {
    try {
      const payload: CargarFacturaControlGastosPayload = JSON.parse(body.data);

      return await this._cargarFactura.execute(payload);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.CONTROL_GASTOS_SOLICITANTE])
  @Post('conciliar')
  async conciliar(@Body() body: GenerateReporteControlGastosPayload) {
    try {
      return await this._conciliar.execute(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @Authorities([INN_AUTHORITIES.FARMACIA.CONTROL_GASTOS_FACTURADOR])
  @Post('rechazar')
  async rechazar(@Body() body: RechazarDocumentoControlGastosPayload) {
    try {
      return await this._rechazar.execute(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.CONTROL_GASTOS_FACTURADOR])
  @Get('historial')
  async Historial(ctx: GcmContextType) {
    try {
      return await this._historial.execute(ctx);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @Authorities([INN_AUTHORITIES.FARMACIA.CONTROL_GASTOS_FACTURADOR])
  @Post('check-visto')
  async documentoVisto(@Body() payload: DocumentoVistoControlGastosPayload) {
    try {
      return await this._documentoVisto.execute(payload);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
  @Authorities([INN_AUTHORITIES.FARMACIA.CONTROL_GASTOS_SOLICITANTE])
  @Get('solicitud-maos')
  async findByPattern(
    @Query('pattern') pattern: string,
    @Query('contextCode') contextCode: GcmContextCode
  ) {
    try {
      return await this._solicitudMaos.execute(pattern, contextCode);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
