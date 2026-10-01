import { ApiProperty } from '@nestjs/swagger';
import { CtmTypeRes, UsuarioBasicoRes } from '@common/application/responses';

export class OrdDesFetchPendienteProductoRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  codigo: string;
  @ApiProperty()
  descripcionCorta: string;
  @ApiProperty()
  descripcionLarga: string | null;
}

export class OrdDesFetchPendienteItemRes {
  @ApiProperty()
  id: number;
  @ApiProperty()
  cantidad: number;
  @ApiProperty()
  cantidadSolicitada: number;
  @ApiProperty()
  cantidadDevuelta: number;
  @ApiProperty()
  cantidadRecibida: number;
  @ApiProperty({ type: OrdDesFetchPendienteProductoRes })
  producto: OrdDesFetchPendienteProductoRes;
}

export class OrdDesFetchPendienteRes {
  @ApiProperty()
  id: number;
  @ApiProperty({ type: OrdDesFetchPendienteItemRes, isArray: true })
  items: OrdDesFetchPendienteItemRes[];
  @ApiProperty()
  consecutivo: string;
  @ApiProperty({ type: CtmTypeRes })
  tipo: CtmTypeRes;
  @ApiProperty({ type: CtmTypeRes })
  destino: CtmTypeRes;
  @ApiProperty({ type: CtmTypeRes })
  estadoEntrega: CtmTypeRes;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty({ type: UsuarioBasicoRes })
  createdBy: UsuarioBasicoRes;
}
