import {
  OptionalEnum,
  OptionalInteger,
  OptionalText,
  RequiredBoolean,
  RequiredEnum,
  RequiredInteger,
  RequiredNestedArray,
  RequiredText,
} from '@common/presentation/decorators';
import { FilterSearchLimitedDto } from '@common/presentation/dto';
import { CategoriaDocumento } from '@equipos/domain/enums';

export class ReglaObligatoriedadTipoActivoDto {
  @RequiredInteger({ min: 1 })
  tipoActivoId: number;

  @RequiredBoolean()
  esObligatorio: boolean;
}

export class CreateDocumentoNestedDto {
  @RequiredInteger({ min: 1 })
  tipoDocumentoId: number;

  @RequiredBoolean()
  aplica: boolean;

  @OptionalInteger({ min: 1 })
  archivoId?: number;

  @OptionalText({ maxLength: 300 })
  observaciones?: string;
}

export class CreateTipoDocCategoriaActivoDto {
  @RequiredText({ maxLength: 80 })
  nombre: string;

  @RequiredEnum(CategoriaDocumento)
  categoria: CategoriaDocumento;

  @RequiredNestedArray(() => ReglaObligatoriedadTipoActivoDto)
  reglasTipoActivo: ReglaObligatoriedadTipoActivoDto[];

  @OptionalText({ maxLength: 300 })
  descripcion?: string;
}

export class ReplaceTipoDocCategoriaActivoDto extends CreateTipoDocCategoriaActivoDto {}

export class FilterTipoDocCategoriaActivoDto extends FilterSearchLimitedDto {
  @OptionalInteger({ min: 1 })
  tipoActivoId?: number;

  @OptionalEnum(CategoriaDocumento)
  categoria?: CategoriaDocumento;
}
