import { LimitDto } from '@common/presentation/dto';
import { IsOptional, Length } from 'class-validator';

export class ResponsePaisDto {
  id: number;
  codigo: string;
  nombre: string;
}

export class FilterPaisDto extends LimitDto {
  @IsOptional()
  @Length(2, 20)
  search?: string;
}
