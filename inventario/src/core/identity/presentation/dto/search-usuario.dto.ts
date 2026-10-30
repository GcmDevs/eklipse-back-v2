import { OptionalBooleanQuery } from '@common/presentation/decorators';
import { FilterSearchPaginatedDto } from '@common/presentation/dto';

export class SearchUsuarioDto extends FilterSearchPaginatedDto {
  /** Con `transversal=true`, opcional header `ctx` (código numérico de sede, igual que media). Sin `ctx` → sede del JWT. */
  @OptionalBooleanQuery()
  transversal?: boolean;
}
