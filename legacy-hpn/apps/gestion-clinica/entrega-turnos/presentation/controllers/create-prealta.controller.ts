import { BadRequestException, Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';
import { CreatePrealtaImpl } from '@gestion-clinica/entrega-turnos/infrastructure/repositories';
import { CreatePrealtaDto } from '../dtos';

@CommonGuards()
@Controller('v4/entrega-turnos/prealta')
export class PreAltaController {
  constructor(private _preAltaService: CreatePrealtaImpl) {}

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Get(':ingresoId')
  public fetch(@Param('ingresoId') ingresoId: number) {
    try {
      const result = this._preAltaService.fetch(ingresoId);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Post('create')
  public create(@Body() body: CreatePrealtaDto) {
    try {
      const result = this._preAltaService.create(body);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.ENTREGA_TURNO])
  @Put('update')
  public update(@Body() body: CreatePrealtaDto) {
    try {
      const result = this._preAltaService.update(body);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
