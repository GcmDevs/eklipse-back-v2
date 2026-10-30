import { FilterSearchDto } from '@common/presentation/dto';
import { OptionalText, RequiredInteger, RequiredText } from '@common/presentation/decorators';

export class CreateMarcaDto {
  @RequiredText({ maxLength: 255 })
  nombre: string;

  @OptionalText({ maxLength: 500 })
  descripcion?: string;
}

export class CreateModeloDto {
  @RequiredText({ maxLength: 255 })
  nombre: string;

  @RequiredInteger({ min: 1 })
  marcaId: number;
}

export class FilterModeloDto extends FilterSearchDto {
  @RequiredInteger({ min: 1 })
  marcaId: number;
}

export class ResponseMarcaDto {
  id: number;
  nombre: string;
  createdAt: Date;
  updatedAt: Date;
  descripcion?: string;
}

export class ResponseModeloDto {
  id: number;
  nombre: string;
  marca: ResponseMarcaDto;
  createdAt: Date;
  updatedAt: Date;
}
