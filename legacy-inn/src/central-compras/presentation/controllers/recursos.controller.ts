import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { toStringOrNumericArray } from '@inn/central-compras/infrastructure/base';
import { CTCRecursosImpl } from '@inn/central-compras/infrastructure/services';
import { TIPOS } from '@ctypes/inn/central-compras/solicitudes';
import { CommonGuards } from '@common/presentation/decorators';
import { AlmacenOrm, ProductoOrm } from '@orm/inn/productos';
import { GcmContexts } from '@common/application/constants';
import { ClaseProductoCode } from '@ctypes/inn/productos';
import { DependenciaOrm, ProveedorOrm } from '@orm/gen';
import {
  RecursoIngresoRes,
  RecursoProductoRes,
  RecursoTerceroRes,
} from '@inn/central-compras/infrastructure/responses';
import { EntidadBasicaRes } from '@common/application/responses';

@CommonGuards()
@ApiTags('Recursos')
@Controller('v1/inn/ctc/recursos')
export class CTCRecursosController {
  constructor(private _resourcesCrud: CTCRecursosImpl) {}

  @ApiOkResponse({ type: RecursoProductoRes, isArray: true })
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

  @ApiOkResponse({ type: RecursoTerceroRes, isArray: true })
  @Get('proveedores')
  fetchProveedorByPatternAndCentro(
    @Query('pattern') pattern: string,
    @Query('centroId') centroId: number,
    @Query('context') context: GcmContexts
  ): Promise<ProveedorOrm[]> {
    return this._resourcesCrud.fetchProveedorByPatternAndCentro(pattern, +centroId, context);
  }

  @ApiOkResponse({ type: RecursoTerceroRes, isArray: true })
  @Get('terceros')
  fetchProveedorByPattern(@Query('pattern') pattern: string): Promise<ProveedorOrm[]> {
    return this._resourcesCrud.fetchProveedorByPattern(pattern);
  }

  @ApiOkResponse({ type: EntidadBasicaRes, isArray: true })
  @Get('dependencias')
  public fetchDependenciaByPattern(@Query('pattern') pattern: string): Promise<DependenciaOrm[]> {
    return this._resourcesCrud.fetchDependenciasByPattern(pattern);
  }

  @ApiOkResponse({ type: EntidadBasicaRes, isArray: true })
  @Get('almacenes')
  public fetchAlmacenByPattern(@Query('pattern') pattern: string): Promise<AlmacenOrm[]> {
    return this._resourcesCrud.fetchAlmacenesByPattern(pattern);
  }

  @ApiOkResponse({ type: EntidadBasicaRes, isArray: true })
  @Get('productos/grupos')
  public fetchGrupos() {
    return this._resourcesCrud.fetchGrupos();
  }

  @ApiOkResponse({ type: RecursoIngresoRes, isArray: true })
  @Get('ingresos')
  public async ingresosSuggestionsByPattern(
    @Query('consecutivo') consecutivo: number,
    @Query('pattern') pattern: string,
    @Query('incluyeEgresados') incluyeEgresados: boolean
  ) {
    return this._resourcesCrud.fetchIngresosByPattern(consecutivo, pattern, incluyeEgresados);
  }
}
