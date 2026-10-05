import { TipoComponente } from 'apps/motor-formatos/domain/enums';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class RespuestaItemGrupoDto {
  @IsBoolean()
  valor: boolean;

  @IsOptional()
  @IsString()
  observacion?: string | null;
}

export class RespuestaGrupoEjecucionDto {
  tipo: TipoComponente.GRUPO_EJECUCION;

  @IsObject()
  items: Record<string, RespuestaItemGrupoDto>;
}

export class RespuestaTablaDto {
  tipo: TipoComponente.TABLA;
  @IsArray()
  filas: Record<string, string | number | boolean | null>[];
}

export class RespuestaRangoDto {
  tipo: TipoComponente.RANGO;
  @IsNumber() valor: number;
}

export class RespuestaTextoLibreDto {
  tipo: TipoComponente.TEXTO_LIBRE;
  @IsString() valor: string | null;
}

export class ImagenDto {
  @IsString() @IsNotEmpty() key: string;
  @IsOptional() @IsInt() archivoId: number | null;
}

export class DiligenciarFormatoDto {
  @IsInt() @IsPositive() equipoId: number;
  @IsInt() @IsPositive() registroActividadId: number;

  @IsBoolean()
  @IsOptional()
  completarInmediato?: boolean;

  @IsObject()
  respuestas: Record<
    string,
    RespuestaGrupoEjecucionDto | RespuestaTablaDto | RespuestaRangoDto | RespuestaTextoLibreDto
  >;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImagenDto)
  imagenes?: ImagenDto[];
}
