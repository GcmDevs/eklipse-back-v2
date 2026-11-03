import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseFilters,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { ADMIN_AUTHORITY } from '@common/application/constants';
import { INN_AUTHORITIES } from '@inn/authorities';
import { InvimaService } from '../application/invima.service';
import {
  ConfirmarCandidatoDto,
  GuardarMedicamentoDto,
  ListarUnidadesMedidaDto,
  PaginaCandidatoDto,
} from './invima.dto';
import { InvimaDatabaseFilter } from './invima-database.filter';

@ApiTags('Verificación INVIMA')
@CommonGuards()
@UseFilters(InvimaDatabaseFilter)
@Controller('v4/inn/invima')
export class InvimaController {
  constructor(private readonly service: InvimaService) {}
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.PRODUCTOS.VERIFICACION_INVIMA])
  @Get('unidades-medida')
  unidadesMedida(@Query() query: ListarUnidadesMedidaDto) {
    return this.service.unidadesMedida(query.q, query.limit);
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.PRODUCTOS.VERIFICACION_INVIMA])
  @Get('productos')
  listar(@Query('sinFactura') sinFactura?: string) {
    return this.service.listar(undefined, sinFactura === 'true');
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.PRODUCTOS.VERIFICACION_INVIMA])
  @Post('productos')
  crear(@Body() input: GuardarMedicamentoDto) {
    return this.service.crear(input);
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.PRODUCTOS.VERIFICACION_INVIMA])
  @Put('productos/:id')
  editar(@Param('id', ParseIntPipe) id: number, @Body() input: GuardarMedicamentoDto) {
    return this.service.editar(id, input);
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.PRODUCTOS.VERIFICACION_INVIMA])
  @Post('productos/:id/verificaciones')
  verificar(@Param('id', ParseIntPipe) id: number) {
    return this.service.verificar(id);
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.PRODUCTOS.VERIFICACION_INVIMA])
  @Get('productos/:id/verificaciones')
  historial(@Param('id', ParseIntPipe) id: number) {
    return this.service.historial(id);
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.PRODUCTOS.VERIFICACION_INVIMA])
  @Get('productos/:id/verificaciones/:verificacionId/candidatos')
  candidatos(
    @Param('id', ParseIntPipe) id: number,
    @Param('verificacionId', ParseIntPipe) verificacionId: number,
    @Query() query: PaginaCandidatoDto
  ) {
    return this.service.candidatos(id, verificacionId, query.fuenteId, query.offset);
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.PRODUCTOS.VERIFICACION_INVIMA])
  @Post('productos/:id/verificaciones/:verificacionId/confirmacion')
  confirmar(
    @Param('id', ParseIntPipe) id: number,
    @Param('verificacionId', ParseIntPipe) verificacionId: number,
    @Body() input: ConfirmarCandidatoDto
  ) {
    return this.service.confirmar(id, verificacionId, input.clave);
  }
}
