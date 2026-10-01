import { EntityStatusFilter } from '@common/domain/enums';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LimitDto, PaginationDto } from './pagination.dto';

export class FilterSearchDto {
  @IsOptional()
  @IsString()
  search?: string;
}

export class FilterSearchLimitedDto extends LimitDto {
  @IsOptional()
  @IsString()
  search?: string;
}

export class FilterSearchPaginatedDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}

export class FilterEstadoDto {
  @IsOptional()
  @IsEnum(EntityStatusFilter)
  estado?: EntityStatusFilter;
}

export class FilterEstadoMasHijosDto extends FilterEstadoDto {
  @IsOptional()
  @IsEnum(EntityStatusFilter)
  estadoHijos?: EntityStatusFilter;
}
