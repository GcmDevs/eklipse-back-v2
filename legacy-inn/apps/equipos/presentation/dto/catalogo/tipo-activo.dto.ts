import { FilterSearchDto } from '@common/presentation/dto';
import { OptionalInteger, OptionalText, RequiredText } from '@common/presentation/decorators';
import { PartialType } from '@nestjs/swagger';

export class CreateTipoActivoDto {
  @RequiredText({ maxLength: 80 })
  nombre: string;

  @RequiredText({ maxLength: 20 })
  codigo: string;

  @OptionalText({ maxLength: 300 })
  descripcion?: string;
}

export class UpdateTipoActivoDto extends PartialType(CreateTipoActivoDto) {}

export class FilterTipoActivoDto extends FilterSearchDto {
  @OptionalInteger({ min: 1 })
  limit?: number;
}
