import { ApiProperty } from '@nestjs/swagger';

export class PartidoRes {
  @ApiProperty()
  id: number;

  @ApiProperty()
  fase: string;

  @ApiProperty()
  localNombre: string;

  @ApiProperty()
  visitanteNombre: string;

  @ApiProperty()
  fecha: Date;

  @ApiProperty()
  localMarcador: number;

  @ApiProperty()
  visitanteMarcador: number;

  @ApiProperty()
  isCerrado: boolean;
}
