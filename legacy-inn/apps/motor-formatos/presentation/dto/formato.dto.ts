import { OrigenSeccion, TipoComponente, TipoDatoTabla, TipoRespuestaItem } from 'apps/motor-formatos/domain';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CloneFormatoPlantillaDto {
  @IsInt()
  @IsPositive()
  formatoBaseId: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.toUpperCase())
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  @Transform(({ value }) => value?.toUpperCase())
  codigo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  descripcion?: string;

  @IsNotEmpty()
  @IsInt()
  versionFormatoId: number;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  etiquetaVersion?: string;

  @IsOptional()
  @IsInt()
  formatoDestinoId?: number;
}

export class ResponseCloneFormatoDto {
  formatoId: number;
  versionId: number;
}

export class ItemGrupoDto {
  @IsOptional() @IsString()
  key?: string;

  @IsOptional() @IsInt() @IsPositive()
  catalogoItemId?: number | null;

  @IsInt() @Min(1)
  orden: number;

  @IsString() @MaxLength(500)
  texto: string;

  @IsEnum(TipoRespuestaItem)
  tipoRespuesta: TipoRespuestaItem;

  @IsOptional() @IsString() @MaxLength(200)
  textoAyuda?: string | null;

  @IsOptional() @IsString() @MaxLength(40)
  adicional?: string | null;
}

export class ComponenteGrupoEjecucionDto {
  @IsOptional() @IsString()
  key?: string;

  @IsEnum(TipoComponente)
  tipo: TipoComponente.GRUPO_EJECUCION;

  @IsInt() @Min(1)
  orden: number;

  @IsString() @MaxLength(110)
  nombre: string;

  @IsOptional() @IsInt() @IsPositive()
  catalogoGrupoId?: number | null;

  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemGrupoDto)
  items: ItemGrupoDto[];
}

export class ColumnaTablaDto {
  @IsOptional() @IsString()
  key?: string;

  @IsString() @MaxLength(100)
  etiqueta: string;

  @IsEnum(TipoDatoTabla)
  tipoDato: TipoDatoTabla;
}

export class ComponenteTablaDto {
  @IsOptional() @IsString()
  key?: string;

  @IsEnum(TipoComponente)
  tipo: TipoComponente.TABLA;

  @IsInt() @Min(1)
  orden: number;

  @IsString() @MaxLength(150)
  etiqueta: string;

  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ColumnaTablaDto)
  columnas: ColumnaTablaDto[];

  @IsInt() @Min(1)
  filasEsperadas: number;

  @IsOptional() @IsArray() @IsString({ each: true })
  filasEtiquetas?: string[];
}

export class ComponenteRangoDto {
  @IsOptional() @IsString()
  key?: string;

  @IsEnum(TipoComponente)
  tipo: TipoComponente.RANGO;

  @IsInt() @Min(1)
  orden: number;

  @IsString() @MaxLength(150)
  etiqueta: string;

  @IsString() @MaxLength(20)
  unidad: string;

  @IsNumber() min: number;
  @IsNumber() max: number;
}

export class ComponenteTextoLibreDto {
  @IsOptional() @IsString()
  key?: string;

  @IsEnum(TipoComponente)
  tipo: TipoComponente.TEXTO_LIBRE;

  @IsInt() @Min(1)
  orden: number;

  @IsString() @MaxLength(150)
  etiqueta: string;

  @IsBoolean()
  requerido: boolean;

  @IsOptional() @IsInt() @Min(1)
  maxLength?: number;
}

export type ComponenteDto =
  | ComponenteGrupoEjecucionDto
  | ComponenteTablaDto
  | ComponenteRangoDto
  | ComponenteTextoLibreDto;

export class SeccionDto {
  @IsOptional() @IsString()
  key?: string;

  @IsInt() @Min(1)
  orden: number;

  @IsString() @MaxLength(110)
  nombre: string;

  @IsEnum(OrigenSeccion)
  origen: OrigenSeccion;

  @ValidateIf(o => o.origen === 'catalogo')
  @IsInt() @IsPositive()
  seccionCatalogoId?: number | null;

  @IsArray() @ArrayMinSize(1)
  componentes: ComponenteDto[];
}

export class DesignVersionFormatoDto {
  @IsOptional() @IsInt() @IsPositive()
  configuracionImagenesId?: number;

  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SeccionDto)
  secciones: SeccionDto[];
}
