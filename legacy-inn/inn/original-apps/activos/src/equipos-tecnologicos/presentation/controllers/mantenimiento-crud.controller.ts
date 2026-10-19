import { CommonGuards } from '@common/presentation/decorators';
import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MantenimientoCrudSource } from '../../infrastructure/repositories';
import { MantenimientoDto } from '../dtos';

@ApiTags('V1 - Mantenimientos (Equipos)')
@CommonGuards()
@Controller('v1/inn/mto/equipo')
export class MantenimientoCrudController {
  constructor(private _mtoCrud: MantenimientoCrudSource) {}

  @Get()
  public fecth(@Query('documentoId') documentoId: number) {
    try {
      return this._mtoCrud.fetchByDocumentoId(documentoId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('create')
  public create(@Body() body: MantenimientoDto) {
    try {
      return this._mtoCrud.create(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
