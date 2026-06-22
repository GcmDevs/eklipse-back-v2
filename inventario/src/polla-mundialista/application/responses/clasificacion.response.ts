import { ApiProperty } from '@nestjs/swagger';

export class ClasificacionUsuarioRes {
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
