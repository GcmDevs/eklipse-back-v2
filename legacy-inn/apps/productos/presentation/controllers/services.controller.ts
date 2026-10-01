import { INN_AUTHORITIES } from '@authorities/inventario';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ExistenciasImpl } from '@productos/infrastructure/services';

@CommonGuards()
@Controller('v4/productos')
export class ProductosServicesController {
  constructor(private _existencias: ExistenciasImpl) {}

  @Authorities([INN_AUTHORITIES.PRODUCTOS.GESTION_REPORTES])
  @Get('existencias-actuales')
  public async existenciasActuales(@Query('pattern') pattern: string) {
    try {
      const data = await this._existencias.fetchExistenciaActualAllCentrosByPattern(pattern);
      if (!data.length) throw new Error('No hay existencias en ninguna clinica');
      else return data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
