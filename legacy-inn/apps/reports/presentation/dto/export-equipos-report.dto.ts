import { EstadoEquipo } from '@equipos/domain/enums';
import { CustomExportColumn, EQUIPOS_CUSTOM_COLUMNS } from 'apps/reports/domain/types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsDefined,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';


export class FiltersExportEquiposListDto {
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  tipoActivoIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  claseIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  subclaseIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  tipoEquipoIds?: number[];

  @IsOptional()
  @IsArray()
  @IsEnum(EstadoEquipo, { each: true })
  estado?: EstadoEquipo[];

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  localizacion?: string | null;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  responsableIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  compraIds?: number[];

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  fechaAdquisicionDesde?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  fechaAdquisicionHasta?: string | null;
}

export class EquiposCustomReportListDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => FiltersExportEquiposListDto)
  filtros: FiltersExportEquiposListDto;

  @IsOptional()
  @IsArray()
  @IsIn([...EQUIPOS_CUSTOM_COLUMNS], { each: true })
  columnas?: CustomExportColumn[];
}

export class EquiposInventarioReportListDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => FiltersExportEquiposListDto)
  filtros: FiltersExportEquiposListDto;
}
