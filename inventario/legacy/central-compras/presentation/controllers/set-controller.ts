import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { SetDto, AddSetProveeDto } from '../dtos';
import { ApiTags } from '@nestjs/swagger';
import { SetCrudSource } from '../../infrastructure/repositories';
import { INN_AUTHORITIES } from '@inn/authorities';

@CommonGuards()
@ApiTags('Cotizaciones prefabricadas')
@Controller('v1/inn/ctc/cotizaciones/prefabricadas/sets')
export class SetController {
  constructor(private _setCrud: SetCrudSource) {}

  @Authorities()
  @Get('by-pattern')
  public async fetchPattern(@Query('pattern') pattern: string) {}

  @Authorities()
  @Post('add-provee')
  public async add(@Body() payload: AddSetProveeDto) {}

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.COTI_PREFABRI])
  @Get()
  public async fetch() {
    try {
      return this._setCrud.fetch();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities()
  @Post()
  public async create(@Body() payload: SetDto) {}

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.COTI_PREFABRI])
  @Get('ofertas')
  public async fetchOfertas(@Query('setId') setId: number) {
    try {
      const response = await this._setCrud.fetchOfertas(+setId);
      return response;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('ofertas-by-producto/:id')
  public async fetchOfertasByProducto(@Param('id') id: number) {
    try {
      const response = await this._setCrud.fetchOfertasByProducto(+id);
      return response;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
