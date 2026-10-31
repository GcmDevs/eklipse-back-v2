import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, UseFilters } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { ADMIN_AUTHORITY } from '@common/application/constants';
import { INN_AUTHORITIES } from '@inn/authorities';
import { InvimaDatabaseFilter } from './invima-database.filter';
import { RecepcionInvimaService } from '../application/recepcion.service';
import { GuardarRecepcionItemDto, VersionRecepcionDto } from './recepcion.dto';

@CommonGuards()
@UseFilters(InvimaDatabaseFilter)
@Controller('v4/inn/invima/facturas/:id/recepcion')
export class RecepcionInvimaController {
  constructor(private readonly service: RecepcionInvimaService) {}
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.PRODUCTOS.VERIFICACION_INVIMA])
  @Get()
  detalle(@Param('id', ParseIntPipe) id: number) {
    return this.service.detalle(id);
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.PRODUCTOS.VERIFICACION_INVIMA])
  @Post()
  iniciar(@Param('id', ParseIntPipe) id: number) {
    return this.service.iniciar(id);
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.PRODUCTOS.VERIFICACION_INVIMA])
  @Put('renglones/:itemId')
  guardar(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() input: GuardarRecepcionItemDto
  ) {
    return this.service.guardar(id, itemId, input);
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.PRODUCTOS.VERIFICACION_INVIMA])
  @Post('finalizar')
  finalizar(@Param('id', ParseIntPipe) id: number, @Body() input: VersionRecepcionDto) {
    return this.service.finalizar(id, input.version);
  }
}
