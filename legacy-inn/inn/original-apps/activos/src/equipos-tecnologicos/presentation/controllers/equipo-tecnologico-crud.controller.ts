import { CommonGuards } from '@common/presentation/decorators';
import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DocumentoDto } from '../dtos';
import { EquipoTecnologicoCrudSource } from '../../infrastructure/repositories';

@ApiTags('V1 - equipos (Equipos tecnologicos)')
@CommonGuards()
@Controller('v1/inn/eqpotecn')
export class EquipoTecnologicoCrudController {
  constructor(private _eqtecCrud: EquipoTecnologicoCrudSource) {}
  @Get()
  public fecth() {
    try {
      return this._eqtecCrud.fetch();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('create')
  public create(@Body() body: DocumentoDto) {
    try {
      return this._eqtecCrud.create(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
