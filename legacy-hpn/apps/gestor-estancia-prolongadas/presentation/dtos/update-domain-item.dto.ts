import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateDomainItemDto {
  @ApiPropertyOptional({ description: 'Nuevo título del ítem' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  title?: string;

  @ApiPropertyOptional({ description: 'Nuevo subtítulo del ítem' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  subTitle?: string;

  @ApiPropertyOptional({ description: 'Nuevo puntaje del ítem' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  points?: number;

  @ApiPropertyOptional({ description: 'Nuevo orden de visualización' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}
