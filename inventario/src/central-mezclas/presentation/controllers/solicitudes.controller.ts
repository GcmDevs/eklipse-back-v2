import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { FetchSolicitudesImpl, CreateSolicitudImpl } from '../../infrastructure/services';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CtMzSolicitudRes } from '@inn/central-mezclas/application/responses';
import { CtMzSolicitudPayload } from '@inn/central-mezclas/presentation/dtos';

@ApiTags('Solicitudes')
@Controller('v1/inn/central-mezclas/solicitudes')
export class SolicitudesController {
  constructor(
    private _fetchSolicitudes: FetchSolicitudesImpl,
    private _createSolicitud: CreateSolicitudImpl
  ) {}

  @ApiResponse({ status: 200, type: CtMzSolicitudRes, isArray: true })
  @Get()
  fetch(@Query('fechaInicio') fechaInicio: Date, @Query('fechaFin') fechaFin: Date) {
    try {
      if (!fechaInicio || !fechaFin) {
        throw new Error('Los campos fechaInicio y fechaFin son requeridas');
      }
      fechaInicio = new Date(`${fechaInicio}:00:00:00`);
      fechaFin = new Date(`${fechaFin}:23:59:59`);
      return this._fetchSolicitudes.execute(fechaInicio, fechaFin);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiBody({ type: CtMzSolicitudPayload })
  @ApiResponse({ status: 201, type: Boolean })
  @Post()
  async register(@Body() payload: CtMzSolicitudPayload): Promise<boolean> {
    try {
      return this._createSolicitud.execute(payload);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
