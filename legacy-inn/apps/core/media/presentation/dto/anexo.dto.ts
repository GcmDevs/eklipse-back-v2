import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class AnexoItemDto {
  @IsInt()
  @IsPositive()
  archivoId: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  observaciones?: string;

  @IsOptional()
  @IsInt()
  orden?: number;
}

export class AddAnexosDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => AnexoItemDto)
  anexos: AnexoItemDto[];
}
