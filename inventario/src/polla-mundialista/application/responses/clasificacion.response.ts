import { ApiProperty } from '@nestjs/swagger';

export class ClasificacionUsuarioRes {
  @ApiProperty()
  posicion: number;

  @ApiProperty()
  id: number;

  @ApiProperty()
  usuarioId: number;

  @ApiProperty()
  cedula: string;

  @ApiProperty()
  nombreCompleto: string;

  @ApiProperty()
  puntos: number;

  @ApiProperty()
  exactos: number;

  @ApiProperty()
  aciertos: number;

  @ApiProperty()
  pendientes: number;
}

export class DefiClasifiRes {
  @ApiProperty()
  colaboradoresActivos: number;

  @ApiProperty({ type: ClasificacionUsuarioRes, isArray: true })
  clasificacion: ClasificacionUsuarioRes[];

  @ApiProperty({ type: ClasificacionUsuarioRes })
  miPosicion: ClasificacionUsuarioRes;
}
