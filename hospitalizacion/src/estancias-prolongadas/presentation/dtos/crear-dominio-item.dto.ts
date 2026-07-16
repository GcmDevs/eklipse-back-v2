import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CrearDominioItemDto {
  @IsString()
  @MaxLength(250)
  titulo: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  subTitulo?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  puntos: number;

  // @ApiPropertyOptional({ descripcion: 'Orden visual dentro del dominio' })
  // @IsOptional()
  // @Type(() => Number)
  // @IsInt()
  // @Min(0)
  // orden?: number;
}
