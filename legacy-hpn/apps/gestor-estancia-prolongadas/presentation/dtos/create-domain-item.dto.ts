import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateDominioItemDto {
  @ApiProperty({ description: 'Título de la barrera o pregunta' })
  @IsString()
  @MaxLength(250)
  titulo: string;

  @ApiPropertyOptional({ description: 'Subtítulo opcional de apoyo' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  subTitulo?: string;

  @ApiProperty({ description: 'Puntos que aporta el ítem' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  puntos: number;

  // @ApiPropertyOptional({ description: 'Orden visual dentro del dominio' })
  // @IsOptional()
  // @Type(() => Number)
  // @IsInt()
  // @Min(0)
  // orden?: number;
}
