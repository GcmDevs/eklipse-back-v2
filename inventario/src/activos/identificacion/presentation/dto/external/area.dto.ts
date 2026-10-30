import { RequiredText } from '@common/presentation/decorators';
import { LimitDto } from '@common/presentation/dto';

export class FilterNombreAreaDto extends LimitDto {
  @RequiredText()
  nombre: string;
}

export class ResponseAreaDto {
  id: number;
  codigo: string;
  nombre: string;
}
