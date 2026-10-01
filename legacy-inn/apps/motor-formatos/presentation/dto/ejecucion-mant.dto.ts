import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TipoRespuestaItem } from 'apps/motor-formatos/domain';

export class CreateGrupoEjecucionMantDto {
  @IsString()
  @MaxLength(110)
  nombre: string;
}

export class CreateEjecucionMantItemDto {
  @IsString()
  @MaxLength(500)
  texto: string;

  @IsEnum(TipoRespuestaItem)
  tipoRespuesta: TipoRespuestaItem;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  adicional?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  textoAyuda?: string;
}
