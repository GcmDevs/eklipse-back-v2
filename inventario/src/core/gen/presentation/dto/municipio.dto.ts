import { OptionalInteger } from '@common/presentation/decorators';
import { FilterSearchPaginatedDto } from '@common/presentation/dto';

export interface MunicipioRead {
  id: number;
  codigo: string;
  nombre: string;
  departamentoId?: number;
  departamentoNombre?: string;
}

export class FilterMunicipioDto extends FilterSearchPaginatedDto {
  @OptionalInteger({ min: 1 })
  departamentoId?: number;
}
