import { OptionalBooleanQuery, OptionalDateString, OptionalInteger, OptionalText, RequiredInteger } from '@common/presentation/decorators';
import { PaginationDto } from '@common/presentation/dto';
import { EstadoDotacion, EstadoLimpieza, EstadoTurno } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { IsEnum, IsOptional } from 'class-validator';

export class TurnoSearchQueryDto extends PaginationDto {
  @OptionalText() search?: string;
  @OptionalInteger() vehiculoId?: number;
  @IsOptional() @IsEnum(EstadoTurno) estado?: EstadoTurno;
  @OptionalDateString() desde?: string;
  @OptionalDateString() hasta?: string;
}

export class DotacionSearchQueryDto extends PaginationDto {
  @OptionalText() search?: string;
  @OptionalInteger() vehiculoId?: number;
  @OptionalDateString() desde?: string;
  @OptionalDateString() hasta?: string;
  @IsOptional() @IsEnum(EstadoDotacion) estado?: EstadoDotacion;
  @OptionalBooleanQuery() completa?: boolean;
}

export class LimpiezaSearchQueryDto extends PaginationDto {
  @OptionalText() search?: string;
  @OptionalInteger() vehiculoId?: number;
  @OptionalInteger() turnoId?: number;
  @IsOptional() @IsEnum(EstadoLimpieza) estado?: EstadoLimpieza;
  @OptionalDateString() desde?: string;
  @OptionalDateString() hasta?: string;
}

export class DotacionGrillaQueryDto {
  @RequiredInteger({ min: 1, max: 12 }) mes: number;
  @RequiredInteger({ min: 2000, max: 2100 }) anio: number;
  @OptionalInteger() vehiculoId?: number;
  @OptionalText() tipoAmbulancia?: string;
}

export class DotacionGrillaItemsQueryDto {
  @RequiredInteger({ min: 1, max: 12 }) mes: number;
  @RequiredInteger({ min: 2000, max: 2100 }) anio: number;
}
