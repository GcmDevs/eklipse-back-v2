import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { BadRequestException, Body, Controller, Patch } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { RecibirItemsOrdenDespachoImpl } from '@inn/documentos/infrastructure/services/orden-despacho';
import { INN_AUTHORITIES } from '@authorities/inventario';
import { ORDESItemRecibidoDto } from '../dtos';

@ApiTags('Ordenes de despacho')
@CommonGuards()
@Controller('v1/inn/documentos/ordenes-despacho')
export class RecibirOrdenDespachoController {
  constructor(private _recibirItems: RecibirItemsOrdenDespachoImpl) {}

  @ApiBody({ type: ORDESItemRecibidoDto, isArray: true })
  @ApiOkResponse({ type: Boolean })
  @Authorities([INN_AUTHORITIES.SUMINISTROS.RECIBIR])
  @Patch('recibir-productos')
  async recibirSuministros(@Body() payload: ORDESItemRecibidoDto[]) {
    try {
      return this._recibirItems.execute(payload);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
