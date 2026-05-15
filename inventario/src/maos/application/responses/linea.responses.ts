import { ApiProperty } from '@nestjs/swagger';

export class ProveedorRes {
  @ApiProperty()
  id: number;

  @ApiProperty()
  codigo: string;

  @ApiProperty()
  nombre: string;
}

export class LineaProductoRes {
  @ApiProperty()
  id: number;

  @ApiProperty()
  codigo: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  cantidad: number;
}

export class OfertaProductoRes extends LineaProductoRes {
  @ApiProperty()
  precioUnitario: number;
}

export class OfertaSetRes {
  @ApiProperty()
  id: number;

  @ApiProperty({ type: ProveedorRes })
  proveedor: ProveedorRes;

  @ApiProperty({ type: OfertaProductoRes, isArray: true })
  productos: OfertaProductoRes[];
}

export class LineaSetRes {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nombre: string;

  @ApiProperty({ type: LineaProductoRes, isArray: true })
  productos: LineaProductoRes[];

  @ApiProperty({ type: OfertaSetRes, isArray: true })
  ofertas: OfertaSetRes[];
}

export class LineaClasificacionRes {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nombre: string;

  @ApiProperty({ type: LineaSetRes, isArray: true })
  sets: LineaSetRes[];
}

export class LineaRes {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nombre: string;

  @ApiProperty({ type: LineaClasificacionRes, isArray: true })
  clasificaciones: LineaClasificacionRes[];
}
