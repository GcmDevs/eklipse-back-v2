import { BadRequestException, Body, Controller, Patch } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { INN_AUTHORITIES } from '@authorities/inventario';
import { ServicesSolicitudesImpl } from '@inn/central-compras/infrastructure/servis';
import { OldUpdateProdOrServDto } from '../dtos';
import { ApiTags } from '@nestjs/swagger';

@CommonGuards()
@ApiTags('V4')
@Controller('v4/central-compras/solicitudes')
export class SolicitudServiceController {
  constructor(private _services: ServicesSolicitudesImpl) {}

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.AGREGAR_OC])
  @Patch('update-producto-or-servicio')
  public updateIdItemSolicitado(@Body() body: OldUpdateProdOrServDto) {
    try {
      return this._services.updateProductoOrServicioItemCotizado(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
