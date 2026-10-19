import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { ProveedoresImpl } from '../../infrastructure/services';

@Controller('v4/ofertas/proveedores')
export class ProveedorController {
  constructor(private readonly _proveedores: ProveedoresImpl) {}

  @Get()
  async fetch(@Query('isProveedorAutenticado') isProveedorAutenticado: boolean) {
    try {
      return await this._proveedores.fetch(isProveedorAutenticado);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('fetch-oferta-by-proveedor/:proveedorId')
  async fetchOfertaByProveedor(@Param('proveedorId') proveedorId: number) {
    try {
      return await this._proveedores.fetchOfertaByProveedor(proveedorId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
