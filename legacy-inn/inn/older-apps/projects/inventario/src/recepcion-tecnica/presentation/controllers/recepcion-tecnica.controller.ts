import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { NewRecTecDto } from '../dtos';
import { RecepcionTecnicaCrudService } from '@inn/old/inn/recepcion-tecnica/infrastructure/services';
import { INN_AUTHORITIES } from '@inn/old/authorities/inventario';
import { RecepcionTecnicaOrm } from '@inn/old/inn/recepcion-tecnica/orm';
import { Authorities, CommonGuards } from '@common/presentation/decorators';

@ApiTags('V1/V2/V3')
@CommonGuards()
@Controller('v10/inn/recepcion-tecnica')
export class RecepcionTecnicaController {
  constructor(private _recepcionTecnicaCrud: RecepcionTecnicaCrudService) {}

  @Authorities([INN_AUTHORITIES.RECEPCION_TECNICA.GENERAR_CONSULTAR_RECEPC_TECN])
  @Get()
  async fetch(): Promise<RecepcionTecnicaOrm[]> {
    return this._recepcionTecnicaCrud.fetch();
  }

  @Authorities([INN_AUTHORITIES.RECEPCION_TECNICA.GENERAR_CONSULTAR_RECEPC_TECN])
  @Get('fetch-productos-by-consecutivo-oc/:consecutivo/:centroId')
  async fetchProductosByConsecutivoOC(
    @Param('consecutivo') consecutivo: string,
    @Param('centroId') centroId: number
  ) {
    return this._recepcionTecnicaCrud.fetchProductosByConsecutivoOC(consecutivo, +centroId);
  }

  @Authorities([INN_AUTHORITIES.RECEPCION_TECNICA.GENERAR_CONSULTAR_RECEPC_TECN])
  @Post()
  async create(@Body() payload: NewRecTecDto): Promise<RecepcionTecnicaOrm> {
    return this._recepcionTecnicaCrud.create(payload);
  }

  @Authorities([INN_AUTHORITIES.RECEPCION_TECNICA.GENERAR_CONSULTAR_RECEPC_TECN])
  @Put()
  async update(@Body() payload: NewRecTecDto) {
    return this._recepcionTecnicaCrud.update(payload);
  }
}
