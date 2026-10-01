import { OptionalText, RequiredInteger, RequiredText } from '@common/presentation/decorators';
import { PartialType } from '@nestjs/swagger';

export class CreateClaseEquipoDto {
  @RequiredInteger({ min: 1 })
  tipoActivoId: number;

  @RequiredText({ maxLength: 120 })
  nombre: string;

  @RequiredText({ maxLength: 30 })
  codigo: string;

  @OptionalText({ maxLength: 300 })
  descripcion?: string;
}

export class CreateSubclaseEquipoDto {
  @RequiredText({ maxLength: 120 })
  nombre: string;

  @RequiredText({ maxLength: 30 })
  codigo: string;

  @OptionalText({ maxLength: 300 })
  descripcion?: string;
}

export class UpdateSubclaseEquipoDto extends PartialType(CreateSubclaseEquipoDto) {}
export class UpdateClaseEquipoDto extends PartialType(CreateClaseEquipoDto) {}
