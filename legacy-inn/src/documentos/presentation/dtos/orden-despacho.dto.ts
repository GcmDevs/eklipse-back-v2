import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ORDESItemRecibidoDto {
  @ApiProperty()
  @IsNumber()
  id: number;
  @ApiProperty()
  @IsNumber()
  cantidad: number;
}
