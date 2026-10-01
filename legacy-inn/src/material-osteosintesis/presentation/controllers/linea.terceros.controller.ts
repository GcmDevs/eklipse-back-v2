import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CommonGuards } from '@common/presentation/decorators';
import { LineaCrudSource } from '../../infrastructure/repositories';
import { RegistrarOfertaImpl } from '@inn/material-osteosintesis/infrastructure/services';
import { RegistrarOfertaDto } from '../dtos';

@CommonGuards()
@Controller('v1/terceros/inn/maos/lineas')
export class LineaController {
  constructor(
    private _setCrud: LineaCrudSource,
    private _registrarOferta: RegistrarOfertaImpl
  ) {}

  @Get()
  public async fetch(@Query('pattern') pattern: string) {
    try {
      const response = await this._setCrud.fetch(pattern);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('ofertas/:setId')
  public async fetchEstadoOferta(@Param('setId') setId: number) {
    try {
      const response = await this._setCrud.fetchEstadoOferta(+setId);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('ofertas/registrar')
  public async registrarOferta(@Body() oferta: RegistrarOfertaDto) {
    try {
      const response = await this._registrarOferta.execute(oferta);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
