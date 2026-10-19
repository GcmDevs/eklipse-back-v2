import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { GcmContexts } from '@common/application/constants';
import { CommonGuards } from '@common/presentation/decorators';
import { TIPOS } from '@ctypes/inn/central-compras/solicitudes';
import { DependenciaOrm, ProveedorOrm } from '@orm/gen';
import { ResourcesHandler } from '../handlers';
import { toStringOrNumericArray } from '@inn/central-compras/infrastructure/base';
import { ClaseProductoCode } from '@ctypes/inn/productos';
import { AlmacenOrm, ProductoOrm } from '@orm/inn/productos';
import { ApiTags } from '@nestjs/swagger';

@CommonGuards()
@ApiTags('V4')
@Controller('v4/central-compras/recursos')
export class ResourcesController {
  constructor(private _resourcesCrud: ResourcesHandler) {}

  @Get('productos')
  public fetchProductosByPattern(
    @Query('tipos') tipos: ClaseProductoCode[],
    @Query('pattern') pattern: string,
    @Query('productosExcluded') productosExcluded: number[],
    @Query('context') context: GcmContexts
  ): Promise<ProductoOrm[]> {
    if ((tipos && typeof tipos === 'string') || (tipos && typeof tipos === 'number')) {
      tipos = [+tipos as any];
    }

    if (!tipos || (tipos && !tipos.length)) {
      throw new BadRequestException(
        'Debe enviar al menos una clase de producto requerida (producto, servicio o activo fijo)'
      );
    }

    tipos = tipos.map(tipo => {
      if (tipo == TIPOS.PRODUCTOS.getCode()) tipo = 0;
      else if (tipo == TIPOS.SERVICIOS.getCode()) tipo = 1;
      return tipo;
    });

    if (tipos.includes(1)) return [] as any;

    if (!productosExcluded || !productosExcluded.length) productosExcluded = [0];

    if (typeof productosExcluded === 'string') productosExcluded = [productosExcluded];

    if (productosExcluded) {
      productosExcluded = toStringOrNumericArray(productosExcluded, true) as number[];
    }
    return this._resourcesCrud.fetchProductosByPattern(tipos, productosExcluded, pattern, context);
  }

  @Get('proveedores')
  fetchProveedorByPatternAndCentro(
    @Query('pattern') pattern: string,
    @Query('centroId') centroId: number,
    @Query('context') context: GcmContexts
  ): Promise<ProveedorOrm[]> {
    return this._resourcesCrud.fetchProveedorByPatternAndCentro(pattern, +centroId, context);
  }

  @Get('terceros')
  fetchProveedorByPattern(@Query('pattern') pattern: string): Promise<ProveedorOrm[]> {
    return this._resourcesCrud.fetchProveedorByPattern(pattern);
  }

  @Get('dependencias')
  public fetchDependenciaByPattern(@Query('pattern') pattern: string): Promise<DependenciaOrm[]> {
    return this._resourcesCrud.fetchDependenciasByPattern(pattern);
  }

  @Get('almacenes')
  public fetchAlmacenByPattern(@Query('pattern') pattern: string): Promise<AlmacenOrm[]> {
    return this._resourcesCrud.fetchAlmacenesByPattern(pattern);
  }

  @Get('productos/grupos')
  public fetchGrupos() {
    return this._resourcesCrud.fetchGrupos();
  }

  @Get('ingresos')
  public async ingresosSuggestionsByPattern(
    @Query('consecutivo') consecutivo: number,
    @Query('pattern') pattern: string,
    @Query('incluyeEgresados') incluyeEgresados: boolean
  ) {
    return this._resourcesCrud.fetchIngresosByPattern(consecutivo, pattern, incluyeEgresados);
  }
}
