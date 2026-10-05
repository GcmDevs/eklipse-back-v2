import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ComponenteTextoLibreCatalogoDto {
  @IsInt()
  @Min(1)
  orden: number;

  @IsString()
  @MaxLength(150)
  etiqueta: string;

  @IsBoolean()
  requerido: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxLength?: number;
}

export class CreateSeccionPlantillaDto {
  @IsString()
  @MaxLength(110)
  nombre: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponenteTextoLibreCatalogoDto)
  componentes: ComponenteTextoLibreCatalogoDto[];
}
