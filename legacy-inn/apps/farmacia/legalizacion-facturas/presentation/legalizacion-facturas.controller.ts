import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { diskStorage } from 'multer';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { INN_AUTHORITIES } from '@authorities/inventario';
import { FILE_LOCATIONS } from '@common/application/constants';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { nonEditFileName } from '@common/presentation/helpers';

import {
  CargarFacturaLegalizacionFacturaImpl,
  CheckVistoLegalizacionFacturaImpl,
  ConciliarLegalizacionFacturaImpl,
  CreateLegalizacionFacturasImpl,
  FetchLegalizacionFacturasImpl,
  RechazarLegalizacionFacturaImpl,
} from '../infrastructure/services';
import {
  CargarFacturaLegalizacionFacturaPayload,
  CreateLegalizacionFacturasPayload,
  DocumentoVistoLegalizacionFacturaPayload,
  GenerateReporteLegalizacionFacturaPayoad,
  RechazarLegalizacionFacturaPayload,
} from '../application/payloads';

@CommonGuards()
@Controller('v4/legalizacion-factura')
export class LegalizacionFacturasController {
  constructor(
    private _create: CreateLegalizacionFacturasImpl,
    private _fetch: FetchLegalizacionFacturasImpl,
    private _cargarFactura: CargarFacturaLegalizacionFacturaImpl,
    private _documentoVisto: CheckVistoLegalizacionFacturaImpl,
    private _conciliar: ConciliarLegalizacionFacturaImpl,
    private _rechazar: RechazarLegalizacionFacturaImpl
  ) {}

  @Authorities([INN_AUTHORITIES.FARMACIA.LEGALIZACION_FACTURAS_FACTURADOR])
  @Post('rechazar')
  async rechazar(@Body() body: RechazarLegalizacionFacturaPayload) {
    try {
      return await this._rechazar.execute(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Authorities([INN_AUTHORITIES.FARMACIA.LEGALIZACION_FACTURAS_SOLICITANTE])
  @Post('conciliar')
  async conciliar(@Body() body: GenerateReporteLegalizacionFacturaPayoad) {
    try {
      return await this._conciliar.execute(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.LEGALIZACION_FACTURAS_FACTURADOR])
  @Post('check-visto')
  async documentoVisto(@Body() payload: DocumentoVistoLegalizacionFacturaPayload) {
    try {
      return await this._documentoVisto.execute(payload);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Authorities([
    INN_AUTHORITIES.FARMACIA.LEGALIZACION_FACTURAS_SOLICITANTE,
    INN_AUTHORITIES.FARMACIA.LEGALIZACION_FACTURAS_FACTURADOR,
  ])
  @Get()
  async fetch(@Query('fechaInicio') fechaInicio: Date, @Query('fechaFin') fechaFin: Date) {
    try {
      fechaInicio = new Date(`${fechaInicio}:00:00:00`);
      fechaFin = new Date(`${fechaFin}:23:59:59`);
      return await this._fetch.execute(fechaInicio, fechaFin);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.LEGALIZACION_FACTURAS_SOLICITANTE])
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files' }], {
      storage: diskStorage({
        destination: `../${FILE_LOCATIONS.inn.fmc.legalizacionFacturas.documentoAdjunto}`,
        filename: nonEditFileName,
      }),
    })
  )
  @Post()
  async create(@Body() body: { data: string }) {
    try {
      const payload: CreateLegalizacionFacturasPayload = JSON.parse(body.data);
      return await this._create.execute(payload);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.LEGALIZACION_FACTURAS_FACTURADOR])
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files' }], {
      storage: diskStorage({
        destination: `../${FILE_LOCATIONS.inn.fmc.legalizacionFacturas.facturas}`,
        filename: nonEditFileName,
      }),
    })
  )
  @Post('cargar-factura')
  async cargarFactura(@Body() body: { data: string }) {
    try {
      const payload: CargarFacturaLegalizacionFacturaPayload = JSON.parse(body.data);

      return await this._cargarFactura.execute(payload);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
